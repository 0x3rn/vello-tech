import { config } from "dotenv";
import { CopyObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { createDatabase } from "../db/client";
import { categories, productColors, productImages, products } from "../db/schema";
import { firebaseStorageKey, isFirebaseStorageUrl } from "./storage-keys";

config({ path: ".env.local" });

const apply = process.argv.includes("--apply");

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function segment(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "untitled";
}

function filename(key: string) {
  const value = key.split("/").at(-1);
  if (!value) throw new Error(`Storage key has no filename: ${key}`);
  return value;
}

function client() {
  return new S3Client({
    endpoint: required("NEON_OBJECT_STORAGE_ENDPOINT"),
    region: "auto",
    forcePathStyle: true,
    credentials: {
      accessKeyId: required("NEON_OBJECT_STORAGE_ACCESS_KEY_ID"),
      secretAccessKey: required("NEON_OBJECT_STORAGE_SECRET_ACCESS_KEY"),
    },
  });
}

async function exists(s3: S3Client, bucket: string, key: string) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error: unknown) {
    const status = error && typeof error === "object" && "$metadata" in error
      ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
      : undefined;
    if (status === 404) return false;
    throw error;
  }
}

function copySource(bucket: string, key: string) {
  return `${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function main() {
  const db = createDatabase();
  const s3 = client();
  const bucket = required("NEON_OBJECT_STORAGE_BUCKET");
  const publicBaseUrl = required("NEON_OBJECT_STORAGE_PUBLIC_URL").replace(/\/$/, "");
  const imageRows = await db
    .select({
      imageId: productImages.id,
      currentKey: productImages.storageKey,
      sourceUrl: productImages.sourceUrl,
      productSlug: products.slug,
      productId: products.id,
      categorySlug: categories.slug,
      colorName: productColors.name,
    })
    .from(productImages)
    .innerJoin(products, eq(productImages.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productColors, eq(productImages.colorId, productColors.id));

  const plan = imageRows.map((image) => {
    const sourceKey = image.currentKey ?? firebaseStorageKey(image.sourceUrl);
    if (!sourceKey) return {
      ...image,
      sourceKey: null,
      destinationKey: null,
      reason: isFirebaseStorageUrl(image.sourceUrl) ? "unresolvable Firebase Storage URL" : "external image URL",
    };
    const colorPath = image.colorName ? `colors/${segment(image.colorName)}` : "images";
    const destinationKey = `products/${segment(image.categorySlug)}/${segment(image.productSlug || image.productId)}/${colorPath}/${filename(sourceKey)}`;
    return { ...image, sourceKey, destinationKey, reason: null };
  });
  const unresolved = plan.filter((item) => !item.destinationKey && item.reason === "unresolvable Firebase Storage URL");
  const external = plan.filter((item) => !item.destinationKey && item.reason === "external image URL");
  const conflicts = new Map<string, number>();
  for (const item of plan) {
    if (item.destinationKey) conflicts.set(item.destinationKey, (conflicts.get(item.destinationKey) ?? 0) + 1);
  }
  const duplicateDestinations = [...conflicts].filter(([, count]) => count > 1).map(([key]) => key);
  const changes = plan.filter((item) => item.destinationKey && item.sourceKey !== item.destinationKey);

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    images: plan.length,
    imagesNeedingNewCanonicalKey: changes.length,
    alreadyCanonical: plan.length - changes.length - unresolved.length - external.length,
    unresolved: unresolved.length,
    externalImageUrls: external.length,
    duplicateDestinations: duplicateDestinations.length,
    sampleChanges: changes.slice(0, 10).map(({ sourceKey, destinationKey }) => ({ sourceKey, destinationKey })),
    sampleUnresolved: unresolved.slice(0, 10).map(({ imageId, sourceUrl }) => ({ imageId, sourceUrl })),
    sampleExternalImageUrls: external.slice(0, 10).map(({ imageId, sourceUrl }) => ({ imageId, sourceUrl })),
  }, null, 2));

  if (unresolved.length || duplicateDestinations.length) {
    throw new Error("Storage organization plan is ambiguous; no changes were made.");
  }
  if (!apply) return;

  const results = await Promise.all(plan.map(async (item) => {
    if (!item.destinationKey || !item.sourceKey) return null;
    let copied = false;
    if (!(await exists(s3, bucket, item.destinationKey))) {
      await s3.send(new CopyObjectCommand({
        Bucket: bucket,
        Key: item.destinationKey,
        CopySource: copySource(bucket, item.sourceKey),
      }));
      copied = true;
    }
    await db.update(productImages)
      .set({ storageKey: item.destinationKey, url: `${publicBaseUrl}/${item.destinationKey}` })
      .where(eq(productImages.id, item.imageId));
    return { copied, databaseUpdated: true };
  }));
  const copied = results.filter((result) => result?.copied).length;
  const databaseUpdates = results.filter((result) => result?.databaseUpdated).length;
  console.log(JSON.stringify({ copied, databaseUpdates, oldObjectsRetained: true }, null, 2));
}

main().catch((error: unknown) => {
  console.error("Neon Storage organization failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
