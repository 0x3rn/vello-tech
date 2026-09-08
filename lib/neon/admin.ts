import "server-only";

import { eq } from "drizzle-orm";
import { createDatabase } from "@/db/client";
import {
  appSettings,
  categories,
  productColors,
  productImages,
  products,
  productSpecifications,
  productVariantChoices,
  productVariantGroups,
  shippingRates,
  taxRates,
} from "@/db/schema";
import { listAdminData } from "@/lib/neon/commerce";
import { listStoreProducts } from "@/lib/neon/catalog";

type ProductInput = Record<string, unknown> & {
  id?: string;
  name?: string;
  slug?: string;
  categoryId?: string;
  subcategoryId?: string;
  condition?: string;
  price?: number;
  discountPrice?: number | null;
  stockQuantity?: number;
  imageUrls?: string[];
  imageAlts?: string[];
  specifications?: Record<string, string>;
  colors?: Array<{ name: string; hex: string; priceModifier?: number; stockQuantity?: number; imageUrls?: string[] }>;
  variantGroups?: Array<{ groupName: string; choices: Array<{ choiceName: string; priceModifier?: number; stockQuantity?: number }> }>;
};

function requiredText(value: unknown, field: string, max = 500) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${field} is invalid`);
  return value.trim();
}

function finiteNumber(value: unknown, field: string, minimum = 0) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum) throw new Error(`${field} is invalid`);
  return number;
}

function identifier(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || crypto.randomUUID();
}

function objectStorageKey(url: string) {
  const base = process.env.NEON_OBJECT_STORAGE_PUBLIC_URL?.replace(/\/$/, "");
  return base && url.startsWith(`${base}/`) ? decodeURIComponent(url.slice(base.length + 1)) : null;
}

export async function saveProduct(input: ProductInput, requestedId?: string) {
  const id = requestedId ?? input.id ?? crypto.randomUUID();
  const name = requiredText(input.name, "name", 200);
  const slug = requiredText(input.slug, "slug", 200);
  const categoryId = requiredText(input.categoryId, "categoryId", 200);
  const condition: "new" | "used" | "refurbished" = input.condition === "used" || input.condition === "refurbished" ? input.condition : "new";
  const price = finiteNumber(input.price, "price", 0.01);
  const discount = input.discountPrice === null || input.discountPrice === undefined ? null : finiteNumber(input.discountPrice, "discountPrice");
  const stock = finiteNumber(input.stockQuantity, "stockQuantity");
  if (!Number.isInteger(stock)) throw new Error("stockQuantity is invalid");
  const colors = Array.isArray(input.colors) ? input.colors.slice(0, 100) : [];
  const groups = Array.isArray(input.variantGroups) ? input.variantGroups.slice(0, 100) : [];
  const imageUrls = Array.isArray(input.imageUrls) ? input.imageUrls.filter((url): url is string => typeof url === "string" && /^https:\/\//.test(url)).slice(0, 50) : [];
  const now = new Date();
  const db = createDatabase();

  await db.transaction(async (tx) => {
    const row = {
      id,
      categoryId,
      subcategoryId: typeof input.subcategoryId === "string" && input.subcategoryId ? input.subcategoryId : null,
      name,
      slug,
      brand: typeof input.brand === "string" ? input.brand.slice(0, 200) : null,
      description: typeof input.description === "string" ? input.description.slice(0, 20000) : null,
      condition,
      price: price.toFixed(2),
      discountPrice: discount === null ? null : discount.toFixed(2),
      stockQuantity: stock,
      isFeatured: input.isFeatured === true,
      isNewArrival: input.isNewArrival === true,
      isBestSeller: input.isBestSeller === true,
      isCarousel: input.isCarousel === true,
      updatedAt: now,
      sourceData: {},
    };
    const [existing] = await tx.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1);
    if (existing) {
      await tx.update(products).set(row).where(eq(products.id, id));
      await tx.delete(productImages).where(eq(productImages.productId, id));
      await tx.delete(productSpecifications).where(eq(productSpecifications.productId, id));
      await tx.delete(productVariantGroups).where(eq(productVariantGroups.productId, id));
      await tx.delete(productColors).where(eq(productColors.productId, id));
    } else {
      await tx.insert(products).values({ ...row, createdAt: now });
    }

    const colorRows = colors.map((color, index) => ({
      id: `${id}:color:${identifier(requiredText(color.name, "color name", 100))}:${index}`,
      productId: id,
      name: requiredText(color.name, "color name", 100),
      hex: requiredText(color.hex, "color hex", 20),
      priceModifier: color.priceModifier === undefined ? null : finiteNumber(color.priceModifier, "color price modifier").toFixed(2),
      stockQuantity: Math.trunc(finiteNumber(color.stockQuantity ?? 0, "color stock")),
    }));
    if (colorRows.length) await tx.insert(productColors).values(colorRows);

    const mainImages = imageUrls.map((url, position) => ({ id: `${id}:image:${position}`, productId: id, colorId: null, url, sourceUrl: url, storageKey: objectStorageKey(url), alt: input.imageAlts?.[position]?.slice(0, 500) ?? null, position }));
    const colorImages = colors.flatMap((color, colorIndex) => (color.imageUrls ?? []).filter((url) => typeof url === "string" && /^https:\/\//.test(url)).slice(0, 20).map((url, position) => ({ id: `${id}:color-image:${colorIndex}:${position}`, productId: id, colorId: colorRows[colorIndex].id, url, sourceUrl: url, storageKey: objectStorageKey(url), alt: `${name} - ${color.name}`, position })));
    if (mainImages.length || colorImages.length) await tx.insert(productImages).values([...mainImages, ...colorImages]);

    const specificationRows = Object.entries(input.specifications ?? {}).slice(0, 200).map(([key, value]) => ({ productId: id, key: requiredText(key, "specification key", 200), value: requiredText(value, "specification value", 2000) }));
    if (specificationRows.length) await tx.insert(productSpecifications).values(specificationRows);

    const groupRows = groups.map((group, position) => ({ id: `${id}:variant:${identifier(requiredText(group.groupName, "variant group", 100))}:${position}`, productId: id, name: requiredText(group.groupName, "variant group", 100), position }));
    if (groupRows.length) await tx.insert(productVariantGroups).values(groupRows);
    const choiceRows = groups.flatMap((group, groupIndex) => (group.choices ?? []).slice(0, 100).map((choice, position) => ({ id: `${groupRows[groupIndex].id}:choice:${identifier(requiredText(choice.choiceName, "variant choice", 100))}:${position}`, groupId: groupRows[groupIndex].id, name: requiredText(choice.choiceName, "variant choice", 100), priceModifier: finiteNumber(choice.priceModifier ?? 0, "variant price modifier").toFixed(2), stockQuantity: Math.trunc(finiteNumber(choice.stockQuantity ?? 0, "variant stock")), position })));
    if (choiceRows.length) await tx.insert(productVariantChoices).values(choiceRows);
  });
  return id;
}

export async function deleteProduct(id: string) {
  await createDatabase().delete(products).where(eq(products.id, id));
}

export async function getProduct(id: string) {
  return (await listStoreProducts()).find((product) => product.id === id) ?? null;
}

export async function getAdminResource(resource: string, id?: string) {
  if (resource === "settings") {
    const rows = await createDatabase().select().from(appSettings);
    return id ? rows.find((row) => row.key === id)?.value ?? null : rows.map((row) => ({ id: row.key, ...(row.value as object) }));
  }
  const rows = await listAdminData(resource);
  return id ? (rows as Array<{ id?: string }>).find((row) => row.id === id) ?? null : rows;
}

export async function writeAdminResource(resource: string, id: string | undefined, value: Record<string, unknown>) {
  const db = createDatabase();
  const rowId = id ?? crypto.randomUUID();
  if (resource === "categories") {
    const row = { id: rowId, name: requiredText(value.name, "name", 200), slug: requiredText(value.slug, "slug", 200), parentCategoryId: typeof value.parentCategoryId === "string" && value.parentCategoryId ? value.parentCategoryId : null };
    await db.insert(categories).values(row).onConflictDoUpdate({ target: categories.id, set: row });
  } else if (resource === "shippingRates") {
    const row = { id: rowId, country: requiredText(value.country, "country", 20), state: requiredText(value.state, "state", 50), amount: finiteNumber(value.amount, "amount").toFixed(2) };
    await db.insert(shippingRates).values(row).onConflictDoUpdate({ target: shippingRates.id, set: row });
  } else if (resource === "taxRates") {
    const row = { id: rowId, country: requiredText(value.country, "country", 20), state: requiredText(value.state, "state", 50), percentage: value.percentage === null || value.percentage === undefined ? null : finiteNumber(value.percentage, "percentage").toFixed(4), amount: value.amount === null || value.amount === undefined ? null : finiteNumber(value.amount, "amount").toFixed(2) };
    await db.insert(taxRates).values(row).onConflictDoUpdate({ target: taxRates.id, set: row });
  } else if (resource === "settings") {
    await db.insert(appSettings).values({ key: rowId, value }).onConflictDoUpdate({ target: appSettings.key, set: { value } });
  } else throw new Error("Unsupported resource");
  return rowId;
}

export async function deleteAdminResource(resource: string, id: string) {
  const db = createDatabase();
  if (resource === "categories") await db.delete(categories).where(eq(categories.id, id));
  else if (resource === "shippingRates") await db.delete(shippingRates).where(eq(shippingRates.id, id));
  else if (resource === "taxRates") await db.delete(taxRates).where(eq(taxRates.id, id));
  else if (resource === "settings") await db.delete(appSettings).where(eq(appSettings.key, id));
  else throw new Error("Unsupported resource");
}
