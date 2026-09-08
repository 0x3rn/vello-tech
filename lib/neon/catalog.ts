import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { createDatabase } from "@/db/client";
import {
  categories,
  productColors,
  productImages,
  productSpecifications,
  products,
  productVariantChoices,
  productVariantGroups,
  reviews,
} from "@/db/schema";

export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string | null;
};

export type StoreProduct = {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  condition: "new" | "used" | "refurbished";
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
  rating: number;
  numReviews: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isCarousel: boolean;
  imageUrls: string[];
  imageAlts: string[];
  specifications: Record<string, string>;
  colors: Array<{
    name: string;
    hex: string;
    priceModifier?: number;
    stockQuantity: number;
    imageUrls: string[];
  }>;
  variantGroups: Array<{
    groupName: string;
    choices: Array<{ choiceName: string; priceModifier: number; stockQuantity: number }>;
  }>;
};

const decimal = (value: string | null) => value === null ? null : Number(value);
const numeric = (value: string) => Number(value);

export async function listCategories() {
  const db = createDatabase();
  return db.select().from(categories).orderBy(asc(categories.name)) satisfies Promise<StoreCategory[]>;
}

export async function getCategoryBySlug(slug: string) {
  const db = createDatabase();
  const [category] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return category ?? null;
}

export async function listStoreProducts() {
  const db = createDatabase();
  const productRows = await db.select().from(products).orderBy(asc(products.name));
  if (!productRows.length) return [] as StoreProduct[];

  const productIds = productRows.map((product) => product.id);
  const [imageRows, colorRows, specificationRows, groupRows] = await Promise.all([
    db.select().from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.position)),
    db.select().from(productColors).where(inArray(productColors.productId, productIds)),
    db.select().from(productSpecifications).where(inArray(productSpecifications.productId, productIds)),
    db.select().from(productVariantGroups).where(inArray(productVariantGroups.productId, productIds)).orderBy(asc(productVariantGroups.position)),
  ]);
  const groupIds = groupRows.map((group) => group.id);
  const choiceRows = groupIds.length
    ? await db.select().from(productVariantChoices).where(inArray(productVariantChoices.groupId, groupIds)).orderBy(asc(productVariantChoices.position))
    : [];

  const imagesByProduct = new Map<string, typeof imageRows>();
  const imagesByColor = new Map<string, typeof imageRows>();
  for (const image of imageRows) {
    imagesByProduct.set(image.productId, [...(imagesByProduct.get(image.productId) ?? []), image]);
    if (image.colorId) imagesByColor.set(image.colorId, [...(imagesByColor.get(image.colorId) ?? []), image]);
  }
  const colorsByProduct = new Map<string, typeof colorRows>();
  for (const color of colorRows) colorsByProduct.set(color.productId, [...(colorsByProduct.get(color.productId) ?? []), color]);
  const specsByProduct = new Map<string, Record<string, string>>();
  for (const specification of specificationRows) {
    specsByProduct.set(specification.productId, {
      ...(specsByProduct.get(specification.productId) ?? {}),
      [specification.key]: specification.value,
    });
  }
  const groupsByProduct = new Map<string, typeof groupRows>();
  for (const group of groupRows) groupsByProduct.set(group.productId, [...(groupsByProduct.get(group.productId) ?? []), group]);
  const choicesByGroup = new Map<string, typeof choiceRows>();
  for (const choice of choiceRows) choicesByGroup.set(choice.groupId, [...(choicesByGroup.get(choice.groupId) ?? []), choice]);

  return productRows.map((product): StoreProduct => {
    const productImagesForProduct = imagesByProduct.get(product.id) ?? [];
    const primaryImages = productImagesForProduct.filter((image) => image.colorId === null);
    return {
      id: product.id,
      categoryId: product.categoryId,
      ...(product.subcategoryId ? { subcategoryId: product.subcategoryId } : {}),
      name: product.name,
      slug: product.slug,
      brand: product.brand ?? "",
      description: product.description ?? "",
      condition: product.condition,
      price: numeric(product.price),
      discountPrice: decimal(product.discountPrice),
      stockQuantity: product.stockQuantity,
      rating: numeric(product.rating),
      numReviews: product.numReviews,
      isFeatured: product.isFeatured,
      isNewArrival: product.isNewArrival,
      isBestSeller: product.isBestSeller,
      isCarousel: product.isCarousel,
      imageUrls: primaryImages.map((image) => image.url),
      imageAlts: primaryImages.map((image) => image.alt ?? ""),
      specifications: specsByProduct.get(product.id) ?? {},
      colors: (colorsByProduct.get(product.id) ?? []).map((color) => ({
        name: color.name,
        hex: color.hex,
        ...(color.priceModifier === null ? {} : { priceModifier: numeric(color.priceModifier) }),
        stockQuantity: color.stockQuantity ?? 0,
        imageUrls: (imagesByColor.get(color.id) ?? []).map((image) => image.url),
      })),
      variantGroups: (groupsByProduct.get(product.id) ?? []).map((group) => ({
        groupName: group.name,
        choices: (choicesByGroup.get(group.id) ?? []).map((choice) => ({
          choiceName: choice.name,
          priceModifier: numeric(choice.priceModifier),
          stockQuantity: choice.stockQuantity,
        })),
      })),
    };
  });
}

export async function getStoreProductBySlug(slug: string) {
  return (await listStoreProducts()).find((product) => product.slug === slug) ?? null;
}

export async function listProductsForCategory(categoryId: string) {
  return (await listStoreProducts()).filter((product) => product.categoryId === categoryId || product.subcategoryId === categoryId);
}

export async function listFiveStarTestimonials(limit = 6) {
  const db = createDatabase();
  const rows = await db.select().from(reviews).where(eq(reviews.rating, 5)).limit(limit);
  return rows.map((review) => ({
    name: review.userName || "Verified Buyer",
    role: "Customer",
    content: review.title ? `${review.title} - ${review.comment ?? ""}` : review.comment ?? "",
    rating: review.rating,
    avatar: review.userName ? review.userName.substring(0, 2).toUpperCase() : "VB",
  }));
}
