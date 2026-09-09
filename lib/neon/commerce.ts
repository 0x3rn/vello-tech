import "server-only";

import crypto from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { createDatabase } from "@/db/client";
import {
  addresses,
  appSettings,
  cartItems,
  orderItems,
  orders,
  productColors,
  productVariantChoices,
  productVariantGroups,
  products,
  shippingRates,
  taxRates,
  users,
  webhookEvents,
} from "@/db/schema";
import { ensureNeonUser } from "@/lib/neon/auth";
import { listStoreProducts, type StoreProduct } from "@/lib/neon/catalog";

type CheckoutSelection = {
  id: string;
  quantity: number;
  selectedColor?: { name?: string } | string | null;
  selectedVariants?: Array<{ groupName: string; choiceName: string }> | Record<string, string> | null;
};

type PreparedLine = {
  product: StoreProduct;
  quantity: number;
  unitPrice: number;
  selectedColor: string | null;
  selectedVariants: Array<{ groupName: string; choiceName: string }>;
};

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function selections(value: CheckoutSelection["selectedVariants"]) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return Object.entries(value).map(([groupName, choiceName]) => ({ groupName, choiceName }));
}

function selectedColorName(value: CheckoutSelection["selectedColor"]) {
  if (!value) return null;
  return typeof value === "string" ? value : value.name ?? null;
}

export async function getShippingSettings() {
  const [row] = await createDatabase().select().from(appSettings).where(eq(appSettings.key, "shipping")).limit(1);
  const value = (row?.value ?? {}) as { threshold?: unknown };
  return { freeShippingThreshold: typeof value.threshold === "number" ? value.threshold : null };
}

export async function getRegionRates(country: string, state: string) {
  const db = createDatabase();
  const [shipping, tax] = await Promise.all([
    db.select().from(shippingRates).where(and(eq(shippingRates.country, country), eq(shippingRates.state, state))).limit(1),
    db.select().from(taxRates).where(and(eq(taxRates.country, country), eq(taxRates.state, state))).limit(1),
  ]);
  return {
    shipping: shipping[0] ? { ...shipping[0], amount: Number(shipping[0].amount) } : null,
    tax: tax[0] ? { ...tax[0], percentage: tax[0].percentage === null ? null : Number(tax[0].percentage), amount: tax[0].amount === null ? null : Number(tax[0].amount) } : null,
  };
}

export async function getDefaultAddress(uid: string) {
  const [row] = await createDatabase().select().from(addresses).where(and(eq(addresses.userId, uid), eq(addresses.isDefault, true))).limit(1);
  return row ? { id: row.id, ...(row.sourceData as object), isDefault: true } : null;
}

async function prepareLines(uid: string, directItem?: unknown) {
  let requested: CheckoutSelection[];
  if (directItem && typeof directItem === "object" && typeof (directItem as CheckoutSelection).id === "string") {
    requested = [directItem as CheckoutSelection];
  } else {
    const rows = await createDatabase().select().from(cartItems).where(eq(cartItems.userId, uid));
    requested = rows.map((row) => ({ ...(row.sourceData as object), id: row.productId, quantity: row.quantity } as CheckoutSelection));
  }
  if (!requested.length || requested.length > 100) throw new Error("Cart is empty");

  const catalog = await listStoreProducts();
  const catalogById = new Map(catalog.map((product) => [product.id, product]));
  return requested.map((item): PreparedLine => {
    const product = catalogById.get(item.id);
    const quantity = Number(item.quantity);
    if (!product) throw new Error("A product is no longer available");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error(`Invalid quantity for ${product.name}`);
    if (quantity > product.stockQuantity) throw new Error(`Insufficient stock for ${product.name}`);

    let unitPrice = product.discountPrice ?? product.price;
    const colorName = selectedColorName(item.selectedColor);
    if (colorName) {
      const color = product.colors.find((entry) => entry.name === colorName);
      if (!color) throw new Error(`Invalid color for ${product.name}`);
      if (quantity > color.stockQuantity) throw new Error(`Insufficient ${colorName} stock for ${product.name}`);
      unitPrice += color.priceModifier ?? 0;
    }
    const variants = selections(item.selectedVariants);
    for (const variant of variants) {
      const group = product.variantGroups.find((entry) => entry.groupName === variant.groupName);
      const choice = group?.choices.find((entry) => entry.choiceName === variant.choiceName);
      if (!choice) throw new Error(`Invalid ${variant.groupName} selection for ${product.name}`);
      if (quantity > choice.stockQuantity) throw new Error(`Insufficient ${variant.choiceName} stock for ${product.name}`);
      unitPrice += choice.priceModifier;
    }
    return { product, quantity, unitPrice: money(unitPrice), selectedColor: colorName, selectedVariants: variants };
  });
}

export async function createPendingCheckout(input: {
  uid: string;
  email?: string | null;
  identityEmail?: string | null;
  name?: string | null;
  paymentMethod: "paystack" | "lemonsqueezy";
  country?: string;
  state?: string;
  shippingAddress?: Record<string, unknown>;
  directItem?: unknown;
}) {
  await ensureNeonUser({ uid: input.uid, email: input.identityEmail ?? undefined, name: input.name ?? undefined });
  const lines = await prepareLines(input.uid, input.directItem);
  const subtotal = money(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
  const settings = await getShippingSettings();
  const rates = input.country && input.state ? await getRegionRates(input.country, input.state) : { shipping: null, tax: null };
  if (input.country && input.state && (!rates.shipping || !rates.tax)) throw new Error("Shipping is not available for this region");
  const shipping = settings.freeShippingThreshold !== null && subtotal >= settings.freeShippingThreshold ? 0 : rates.shipping?.amount ?? 0;
  const tax = rates.tax ? (rates.tax.percentage !== null ? subtotal * rates.tax.percentage / 100 : rates.tax.amount ?? 0) : 0;
  const total = money(subtotal + shipping + tax);
  const orderId = `ORD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomBytes(4).toString("hex")}`;
  const db = createDatabase();
  await db.transaction(async (tx) => {
    await tx.insert(orders).values({
      id: orderId,
      userId: input.uid,
      customerEmail: input.email ?? null,
      status: "pending",
      paymentMethod: input.paymentMethod,
      totalAmount: total.toFixed(2),
      createdAt: new Date(),
      sourceData: { subtotal, shipping, tax, shippingAddress: input.shippingAddress ?? null },
    });
    await tx.insert(orderItems).values(lines.map((line, index) => ({
      id: `${orderId}:${index}`,
      orderId,
      productId: line.product.id,
      name: line.product.name,
      slug: line.product.slug,
      imageUrl: line.product.imageUrls[0] ?? null,
      unitPrice: line.unitPrice.toFixed(2),
      quantity: line.quantity,
      configuration: { selectedColor: line.selectedColor, selectedVariants: line.selectedVariants },
    })));
  });
  return { orderId, totalInCents: Math.round(total * 100), email: input.email, total };
}

export async function fulfillPendingOrder(input: {
  source: "paystack" | "lemonsqueezy";
  eventId: string;
  orderId: string;
  paymentReference: string;
  amountInCents: number;
  sourceData: Record<string, unknown>;
}) {
  const db = createDatabase();
  const result = await db.transaction(async (tx) => {
    const inserted = await tx.insert(webhookEvents).values({
      id: `${input.source}_${input.eventId}`,
      source: input.source,
      orderId: input.orderId,
      processedAt: new Date(),
      sourceData: input.sourceData,
    }).onConflictDoNothing().returning({ id: webhookEvents.id });
    if (!inserted.length) return { duplicate: true, email: null, orderId: input.orderId };

    const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
    if (!order || order.status !== "pending") throw new Error("Pending order not found");
    if (Math.round(Number(order.totalAmount) * 100) !== input.amountInCents) throw new Error("Payment amount mismatch");
    const lines = await tx.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));
    if (!lines.length) throw new Error("Order has no items");
    for (const line of lines) {
      if (!line.productId) throw new Error("Order product is missing");
      const updated = await tx.update(products)
        .set({ stockQuantity: sql`${products.stockQuantity} - ${line.quantity}`, updatedAt: new Date() })
        .where(and(eq(products.id, line.productId), gte(products.stockQuantity, line.quantity)))
        .returning({ id: products.id });
      if (!updated.length) throw new Error(`Insufficient stock for ${line.name}`);
      const configuration = line.configuration as { selectedColor?: string | null; selectedVariants?: Array<{ groupName: string; choiceName: string }> };
      if (configuration.selectedColor) {
        const colorUpdated = await tx.update(productColors)
          .set({ stockQuantity: sql`${productColors.stockQuantity} - ${line.quantity}` })
          .where(and(eq(productColors.productId, line.productId), eq(productColors.name, configuration.selectedColor), gte(productColors.stockQuantity, line.quantity)))
          .returning({ id: productColors.id });
        if (!colorUpdated.length) throw new Error(`Insufficient option stock for ${line.name}`);
      }
      for (const variant of configuration.selectedVariants ?? []) {
        const [group] = await tx.select({ id: productVariantGroups.id }).from(productVariantGroups).where(and(eq(productVariantGroups.productId, line.productId), eq(productVariantGroups.name, variant.groupName))).limit(1);
        if (!group) throw new Error(`Variant group missing for ${line.name}`);
        const choiceUpdated = await tx.update(productVariantChoices)
          .set({ stockQuantity: sql`${productVariantChoices.stockQuantity} - ${line.quantity}` })
          .where(and(eq(productVariantChoices.groupId, group.id), eq(productVariantChoices.name, variant.choiceName), gte(productVariantChoices.stockQuantity, line.quantity)))
          .returning({ id: productVariantChoices.id });
        if (!choiceUpdated.length) throw new Error(`Insufficient option stock for ${line.name}`);
      }
    }
    await tx.update(orders).set({ status: "processing", paymentReference: input.paymentReference }).where(eq(orders.id, input.orderId));
    if (order.userId) await tx.delete(cartItems).where(eq(cartItems.userId, order.userId));
    return { duplicate: false, email: order.customerEmail, orderId: order.id };
  });
  return result;
}

export async function getOrderReceipt(orderId: string) {
  const db = createDatabase();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return order ? {
    email: order.customerEmail,
    totalInCents: Math.round(Number(order.totalAmount) * 100),
    items: items.map((item) => ({ name: item.name, quantity: item.quantity, price: Number(item.unitPrice) })),
  } : null;
}

export async function getOrderForUser(orderId: string, uid: string) {
  const db = createDatabase();
  const [order] = await db.select().from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, uid)))
    .limit(1);
  if (!order) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    items: items.map((item) => ({ name: item.name, quantity: item.quantity, price: Number(item.unitPrice) })),
  };
}
export async function listAdminData(resource: string) {
  const db = createDatabase();
  if (resource === "categories") return db.select().from((await import("@/db/schema")).categories);
  if (resource === "shippingRates") return (await db.select().from(shippingRates)).map((row) => ({ ...row, amount: Number(row.amount) }));
  if (resource === "taxRates") return (await db.select().from(taxRates)).map((row) => ({ ...row, percentage: row.percentage === null ? null : Number(row.percentage), amount: row.amount === null ? null : Number(row.amount) }));
  if (resource === "users") return (await db.select().from(users)).map((row) => ({ ...(row.sourceData as object), ...row, uid: row.id, createdAt: row.createdAt?.toISOString() ?? null }));
  if (resource === "orders") {
    const orderRows = await db.select().from(orders);
    const ids = orderRows.map((row) => row.id);
    const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
    return orderRows.map((row) => ({ ...(row.sourceData as object), ...row, email: row.customerEmail, total: Number(row.totalAmount), totalAmount: Number(row.totalAmount), createdAt: row.createdAt?.toISOString() ?? null, items: items.filter((item) => item.orderId === row.id).map((item) => ({ ...item, image: item.imageUrl, price: Number(item.unitPrice) })) }));
  }
  if (resource === "products") return listStoreProducts();
  throw new Error("Unsupported resource");
}
