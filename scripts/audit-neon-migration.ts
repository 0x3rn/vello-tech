import { config } from "dotenv";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { and, eq, isNull, like, notLike, sql } from "drizzle-orm";
import { createDatabase } from "../db/client";
import { categories, productImages, products } from "../db/schema";
import { getMigrationBucket, getMigrationFirestore } from "./firebase-admin";
import { firebaseStorageKey, isFirebaseStorageUrl } from "./storage-keys";

config({ path: ".env.local" });

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function storageClient() {
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

async function listAllObjectKeys(client: S3Client, bucket: string) {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken }));
    keys.push(...(page.Contents ?? []).flatMap((item) => item.Key ? [item.Key] : []));
    continuationToken = page.NextContinuationToken;
  } while (continuationToken);
  return keys;
}

async function main() {
  const db = createDatabase();
  const firestore = getMigrationFirestore();
  const firebaseBucket = getMigrationBucket();
  const bucketName = required("NEON_OBJECT_STORAGE_BUCKET");
  const publicUrl = process.env.NEON_OBJECT_STORAGE_PUBLIC_URL?.replace(/\/$/, "") ?? "";

  const [firebaseCategories, firebaseProducts, firebaseUsers, firebaseFiles] = await Promise.all([
    firestore.collection("categories").count().get(),
    firestore.collection("products").count().get(),
    firestore.collection("users").count().get(),
    firebaseBucket.getFiles({ prefix: "products/" }),
  ]);
  const neonFiles = await listAllObjectKeys(storageClient(), bucketName);

  const [categoryCount] = await db.select({ count: sql<number>`count(*)::int` }).from(categories);
  const [productCount] = await db.select({ count: sql<number>`count(*)::int` }).from(products);
  const [imageCount] = await db.select({ count: sql<number>`count(*)::int` }).from(productImages);
  const imageRows = await db.select({ storageKey: productImages.storageKey, url: productImages.url, sourceUrl: productImages.sourceUrl }).from(productImages);
  const missingStorageKey = imageRows.filter((image) => !image.storageKey).length;
  const externalImageUrls = imageRows.filter((image) => !isFirebaseStorageUrl(image.sourceUrl)).length;
  const [firebaseImageUrlCount] = await db.select({ count: sql<number>`count(*)::int` }).from(productImages).where(like(productImages.url, "%firebasestorage.googleapis.com%"));
  const [outsideCanonicalLayout] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productImages)
    .where(and(sql`${productImages.storageKey} is not null`, notLike(productImages.storageKey, "products/%/%/%")));

  const mappedKeys = new Set(imageRows.flatMap(({ storageKey }) => storageKey ? [storageKey] : []));
  const firebaseReferencedKeys = new Set(imageRows.flatMap(({ sourceUrl }) => {
    const key = firebaseStorageKey(sourceUrl);
    return key ? [key] : [];
  }));
  const neonProductKeys = neonFiles.filter((key) => key.startsWith("products/"));
  const retainedSourceKeys = neonProductKeys.filter((key) => firebaseReferencedKeys.has(key) && !mappedKeys.has(key));
  const unknownNeonProductKeys = neonProductKeys.filter((key) => !firebaseReferencedKeys.has(key) && !mappedKeys.has(key));
  const missingActiveStorageKeys = imageRows.flatMap(({ storageKey, sourceUrl }) => {
    if (storageKey) return neonProductKeys.includes(storageKey) ? [] : [storageKey];
    const firebaseKey = firebaseStorageKey(sourceUrl);
    return firebaseKey && !neonProductKeys.includes(firebaseKey) ? [firebaseKey] : [];
  });
  const productRows = await db
    .select({ productId: products.id, categoryId: products.categoryId, categoryName: categories.name })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id));
  const productsWithoutCategory = productRows.filter((row) => !row.categoryName);

  const report = {
    source: {
      firestore: {
        categories: firebaseCategories.data().count,
        products: firebaseProducts.data().count,
        users: firebaseUsers.data().count,
      },
      storageObjectsUnderProducts: firebaseFiles[0].filter((file) => !file.name.endsWith("/")).length,
    },
    neon: {
      categories: categoryCount.count,
      products: productCount.count,
      productImages: imageCount.count,
      storageObjectsUnderProducts: neonProductKeys.length,
    },
    checks: {
      categoryCountMatches: categoryCount.count === firebaseCategories.data().count,
      productCountMatches: productCount.count === firebaseProducts.data().count,
      allActiveProductStorageObjectsPresent: missingActiveStorageKeys.length === 0,
      productImagesMissingStorageKey: missingStorageKey,
      productImagesStillOnFirebase: firebaseImageUrlCount.count,
      externalImageUrls,
      productImagesOutsideCanonicalLayout: outsideCanonicalLayout.count,
      retainedOriginalObjects: retainedSourceKeys.length,
      unreferencedNeonProductObjects: unknownNeonProductKeys.length,
      productsWithMissingCategory: productsWithoutCategory.length,
      publicUrlConfigured: Boolean(publicUrl),
    },
    samples: {
      unreferencedNeonProductObjects: unknownNeonProductKeys.slice(0, 10),
      missingActiveStorageObjects: missingActiveStorageKeys.slice(0, 10),
      productsWithMissingCategory: productsWithoutCategory.slice(0, 10),
    },
  };

  console.log(JSON.stringify(report, null, 2));
  const failed = !report.checks.categoryCountMatches
    || !report.checks.productCountMatches
    || !report.checks.allActiveProductStorageObjectsPresent
    || report.checks.productImagesMissingStorageKey > report.checks.externalImageUrls
    || report.checks.productImagesStillOnFirebase > 0
    || report.checks.productsWithMissingCategory > 0;
  if (failed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error("Migration audit failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
