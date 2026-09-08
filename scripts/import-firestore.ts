import { config } from "dotenv";
import type { DocumentData } from "firebase-admin/firestore";
import { createDatabase } from "../db/client";
import {
  addresses,
  appSettings,
  cartItems,
  categories,
  orderItems,
  orders,
  paymentMethods,
  productColors,
  productImages,
  productSpecifications,
  products,
  productVariantChoices,
  productVariantGroups,
  reviews,
  shippingRates,
  taxRates,
  users,
  webhookEvents,
} from "../db/schema";
import { getMigrationFirestore } from "./firebase-admin";

config({ path: ".env.local" });

type RecordData = Record<string, unknown>;

const asArray = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];
const asRecord = (value: unknown): RecordData => value && typeof value === "object" && !Array.isArray(value) ? value as RecordData : {};
const numeric = (value: unknown, fallback = "0") => value === null || value === undefined ? fallback : String(value);
const nullableNumeric = (value: unknown) => value === null || value === undefined ? null : String(value);
const integer = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
const stableId = (...parts: Array<string | number>) => parts.map(String).join(":");

function date(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function json(value: unknown) {
  return JSON.parse(JSON.stringify(value, (_key, current) => {
    if (current && typeof current.toDate === "function") return current.toDate().toISOString();
    return current;
  })) as RecordData;
}

async function importCategories(source: ReturnType<typeof getMigrationFirestore>, db: ReturnType<typeof createDatabase>) {
  const snapshot = await source.collection("categories").get();
  const rows = snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: String(data.id ?? document.id),
      name: String(data.name ?? ""),
      slug: String(data.slug ?? document.id),
      parentCategoryId: data.parentCategoryId ? String(data.parentCategoryId) : null,
    };
  });
  if (rows.length) await db.insert(categories).values(rows).onConflictDoNothing();
  return rows.length;
}

async function importProducts(source: ReturnType<typeof getMigrationFirestore>, db: ReturnType<typeof createDatabase>) {
  const snapshot = await source.collection("products").get();

  for (const document of snapshot.docs) {
    const data = document.data();
    const productId = String(data.id ?? document.id);
    await db.insert(products).values({
      id: productId,
      categoryId: String(data.categoryId ?? "uncategorized"),
      subcategoryId: data.subcategoryId ? String(data.subcategoryId) : null,
      name: String(data.name ?? ""),
      slug: String(data.slug ?? productId),
      brand: data.brand ? String(data.brand) : null,
      description: data.description ? String(data.description) : null,
      condition: data.condition === "used" || data.condition === "refurbished" ? data.condition : "new",
      price: numeric(data.price),
      discountPrice: nullableNumeric(data.discountPrice),
      stockQuantity: integer(data.stockQuantity),
      rating: numeric(data.rating),
      numReviews: integer(data.numReviews),
      isFeatured: data.isFeatured === true,
      isNewArrival: data.isNewArrival === true,
      isBestSeller: data.isBestSeller === true,
      isCarousel: data.isCarousel === true,
      createdAt: date(data.createdAt),
      updatedAt: date(data.updatedAt),
      sourceData: json(data),
    }).onConflictDoNothing();

    const colors = asArray<RecordData>(data.colors);
    for (const [colorIndex, color] of colors.entries()) {
      const colorId = stableId(productId, "color", String(color.name ?? colorIndex));
      await db.insert(productColors).values({
        id: colorId,
        productId,
        name: String(color.name ?? `color-${colorIndex}`),
        hex: String(color.hex ?? "#000000"),
        priceModifier: nullableNumeric(color.priceModifier),
        stockQuantity: color.stockQuantity === undefined ? null : integer(color.stockQuantity),
      }).onConflictDoNothing();

      const colorUrls = asArray<string>(color.imageUrls);
      if (colorUrls.length) {
        await db.insert(productImages).values(colorUrls.map((url, imageIndex) => ({
          id: stableId(colorId, "image", imageIndex),
          productId,
          colorId,
          url,
          sourceUrl: url,
          alt: null,
          position: imageIndex,
        }))).onConflictDoNothing();
      }
    }

    const imageUrls = asArray<string>(data.imageUrls);
    const imageAlts = asArray<string>(data.imageAlts);
    if (imageUrls.length) {
      await db.insert(productImages).values(imageUrls.map((url, imageIndex) => ({
        id: stableId(productId, "image", imageIndex),
        productId,
        colorId: null,
        url,
        sourceUrl: url,
        alt: imageAlts[imageIndex] ?? null,
        position: imageIndex,
      }))).onConflictDoNothing();
    }

    const specifications = asRecord(data.specifications);
    const specificationRows = Object.entries(specifications).map(([key, value]) => ({ productId, key, value: String(value) }));
    if (specificationRows.length) await db.insert(productSpecifications).values(specificationRows).onConflictDoNothing();

    const variantGroups = asArray<RecordData>(data.variantGroups);
    for (const [groupIndex, group] of variantGroups.entries()) {
      const groupName = String(group.groupName ?? `group-${groupIndex}`);
      const groupId = stableId(productId, "variant-group", groupName);
      await db.insert(productVariantGroups).values({ id: groupId, productId, name: groupName, position: groupIndex }).onConflictDoNothing();

      const choices = asArray<RecordData>(group.choices);
      if (choices.length) {
        await db.insert(productVariantChoices).values(choices.map((choice, choiceIndex) => ({
          id: stableId(groupId, "choice", String(choice.choiceName ?? choiceIndex)),
          groupId,
          name: String(choice.choiceName ?? `choice-${choiceIndex}`),
          priceModifier: numeric(choice.priceModifier),
          stockQuantity: integer(choice.stockQuantity),
          position: choiceIndex,
        }))).onConflictDoNothing();
      }
    }
  }

  return snapshot.size;
}

async function importUsers(source: ReturnType<typeof getMigrationFirestore>, db: ReturnType<typeof createDatabase>) {
  const snapshot = await source.collection("users").get();
  for (const document of snapshot.docs) {
    const data = document.data();
    const userId = document.id;
    await db.insert(users).values({
      id: userId,
      email: data.email ? String(data.email) : null,
      name: data.name ? String(data.name) : null,
      phoneNumber: data.phoneNumber ? String(data.phoneNumber) : null,
      role: data.role === "admin" ? "admin" : "user",
      rewardsPoints: integer(data.rewardsPoints),
      createdAt: date(data.createdAt),
      sourceData: json(data),
    }).onConflictDoNothing();

    const cart = asArray<RecordData>(data.cart);
    if (cart.length) {
      await db.insert(cartItems).values(cart.map((item, itemIndex) => ({
        id: stableId(userId, "cart", String(item.cartItemId ?? item.id ?? itemIndex)),
        userId,
        productId: String(item.id ?? item.productId ?? ""),
        quantity: integer(item.quantity, 1),
        configuration: json({ selectedColor: item.selectedColor ?? null, selectedVariants: item.selectedVariants ?? null }),
        sourceData: json(item),
      }))).onConflictDoNothing();
    }

    for (const collectionName of ["addresses", "paymentMethods"] as const) {
      const children = await document.ref.collection(collectionName).get();
      for (const child of children.docs) {
        const data = child.data();
        if (collectionName === "addresses") {
          await db.insert(addresses).values({ id: child.id, userId, isDefault: data.isDefault === true, sourceData: json(data) }).onConflictDoNothing();
        } else {
          await db.insert(paymentMethods).values({ id: child.id, userId, sourceData: json(data) }).onConflictDoNothing();
        }
      }
    }
  }
  return snapshot.size;
}

async function importOrdersAndReviews(source: ReturnType<typeof getMigrationFirestore>, db: ReturnType<typeof createDatabase>) {
  const [orderSnapshot, reviewSnapshot] = await Promise.all([source.collection("orders").get(), source.collection("reviews").get()]);

  for (const document of orderSnapshot.docs) {
    const data = document.data();
    const orderId = String(data.orderId ?? document.id);
    await db.insert(orders).values({
      id: orderId,
      userId: data.uid ? String(data.uid) : null,
      customerEmail: data.customerEmail ? String(data.customerEmail) : data.email ? String(data.email) : null,
      status: ["pending", "processing", "shipped", "delivered", "cancelled"].includes(String(data.status)) ? String(data.status) as "pending" : "pending",
      paymentMethod: data.paymentMethod ? String(data.paymentMethod) : null,
      paymentReference: data.paymentReference ? String(data.paymentReference) : null,
      totalAmount: numeric(data.totalAmount ?? data.totalPaid),
      createdAt: date(data.createdAt),
      sourceData: json(data),
    }).onConflictDoNothing();

    const items = asArray<RecordData>(data.items);
    if (items.length) {
      await db.insert(orderItems).values(items.map((item, itemIndex) => ({
        id: stableId(orderId, "item", itemIndex),
        orderId,
        productId: item.id || item.productId ? String(item.id ?? item.productId) : null,
        name: String(item.name ?? "Unknown product"),
        slug: item.slug ? String(item.slug) : null,
        imageUrl: item.image ? String(item.image) : null,
        unitPrice: numeric(item.price),
        quantity: integer(item.quantity, 1),
        configuration: json({ selectedColor: item.selectedColor ?? null, selectedVariants: item.selectedVariants ?? null }),
      }))).onConflictDoNothing();
    }
  }

  for (const document of reviewSnapshot.docs) {
    const data = document.data();
    await db.insert(reviews).values({
      id: document.id,
      productId: String(data.productId),
      userId: String(data.userId),
      userName: data.userName ? String(data.userName) : null,
      rating: integer(data.rating),
      title: data.title ? String(data.title) : null,
      comment: data.comment ? String(data.comment) : null,
      isVerifiedPurchase: data.isVerifiedPurchase === true,
      createdAt: date(data.createdAt),
    }).onConflictDoNothing();
  }

  return { orders: orderSnapshot.size, reviews: reviewSnapshot.size };
}

async function importRatesAndSettings(source: ReturnType<typeof getMigrationFirestore>, db: ReturnType<typeof createDatabase>) {
  const [shippingSnapshot, taxSnapshot, settingsSnapshot, eventsSnapshot] = await Promise.all([
    source.collection("shippingRates").get(),
    source.collection("taxRates").get(),
    source.collection("settings").get(),
    source.collection("processedEvents").get(),
  ]);

  for (const document of shippingSnapshot.docs) {
    const data = document.data();
    await db.insert(shippingRates).values({ id: document.id, country: String(data.country), state: String(data.state), amount: numeric(data.amount) }).onConflictDoNothing();
  }
  for (const document of taxSnapshot.docs) {
    const data = document.data();
    await db.insert(taxRates).values({ id: document.id, country: String(data.country), state: String(data.state), percentage: nullableNumeric(data.percentage), amount: nullableNumeric(data.amount) }).onConflictDoNothing();
  }
  for (const document of settingsSnapshot.docs) {
    await db.insert(appSettings).values({ key: document.id, value: json(document.data()) }).onConflictDoNothing();
  }
  for (const document of eventsSnapshot.docs) {
    const data = document.data();
    await db.insert(webhookEvents).values({
      id: document.id,
      source: String(data.source ?? "unknown"),
      orderId: data.orderId ? String(data.orderId) : null,
      processedAt: date(data.processedAt),
      sourceData: json(data),
    }).onConflictDoNothing();
  }

  return { shippingRates: shippingSnapshot.size, taxRates: taxSnapshot.size, settings: settingsSnapshot.size, webhookEvents: eventsSnapshot.size };
}

async function main() {
  const source = getMigrationFirestore();
  const db = createDatabase();
  const categoriesCount = await importCategories(source, db);
  const productsCount = await importProducts(source, db);
  const usersCount = await importUsers(source, db);
  const commerceCounts = await importOrdersAndReviews(source, db);
  const configurationCounts = await importRatesAndSettings(source, db);

  console.log(JSON.stringify({ categories: categoriesCount, products: productsCount, users: usersCount, ...commerceCounts, ...configurationCounts }, null, 2));
}

main().catch((error: unknown) => {
  console.error("Firestore import failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
