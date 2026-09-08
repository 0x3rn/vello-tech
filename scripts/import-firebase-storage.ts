import { config } from "dotenv";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { inArray } from "drizzle-orm";
import { createDatabase } from "../db/client";
import { productImages } from "../db/schema";
import { getMigrationBucket } from "./firebase-admin";
import { firebaseStorageKey } from "./storage-keys";

config({ path: ".env.local" });

const mapOnly = process.argv.includes("--map-only");

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function publicUrl(baseUrl: string | undefined, objectKey: string) {
  if (!baseUrl) return null;
  const encodedPath = objectKey.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl.replace(/\/$/, "")}/${encodedPath}`;
}

async function main() {
  const endpoint = required("NEON_OBJECT_STORAGE_ENDPOINT");
  const bucketName = required("NEON_OBJECT_STORAGE_BUCKET");
  const client = new S3Client({
    endpoint,
    region: "auto",
    forcePathStyle: true,
    credentials: {
      accessKeyId: required("NEON_OBJECT_STORAGE_ACCESS_KEY_ID"),
      secretAccessKey: required("NEON_OBJECT_STORAGE_SECRET_ACCESS_KEY"),
    },
  });

  const sourceBucket = getMigrationBucket();
  const db = createDatabase();
  const [files] = await sourceBucket.getFiles({ prefix: "products/" });
  const imageReferences = await db.select({ id: productImages.id, sourceUrl: productImages.sourceUrl }).from(productImages);
  const imageIdsBySourceKey = new Map<string, string[]>();
  for (const image of imageReferences) {
    const sourceKey = firebaseStorageKey(image.sourceUrl);
    if (!sourceKey) continue;
    imageIdsBySourceKey.set(sourceKey, [...(imageIdsBySourceKey.get(sourceKey) ?? []), image.id]);
  }
  let copied = 0;
  let mappedImages = 0;

  for (const file of files) {
    if (file.name.endsWith("/")) continue;
    if (!mapOnly) {
      const [contents] = await file.download();
      const contentType = file.metadata.contentType || "application/octet-stream";
      await client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: file.name,
        Body: contents,
        ContentType: contentType,
      }));
      copied += 1;
    }

    const destinationUrl = publicUrl(process.env.NEON_OBJECT_STORAGE_PUBLIC_URL, file.name);
    const imageIds = imageIdsBySourceKey.get(file.name) ?? [];
    if (imageIds.length) {
      await db.update(productImages)
        .set(destinationUrl ? { url: destinationUrl, storageKey: file.name } : { storageKey: file.name })
        .where(inArray(productImages.id, imageIds));
      mappedImages += imageIds.length;
    }
  }

  console.log(`${mapOnly ? "Mapped" : "Copied"} ${mapOnly ? mappedImages : copied} ${mapOnly ? "product image records" : "Firebase Storage objects"} and mapped ${mappedImages} product image records.`);
  if (!process.env.NEON_OBJECT_STORAGE_PUBLIC_URL) {
    console.log("Objects were copied, but product image URLs remain on Firebase until NEON_OBJECT_STORAGE_PUBLIC_URL is configured.");
  }
}

main().catch((error: unknown) => {
  console.error("Firebase Storage import failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
