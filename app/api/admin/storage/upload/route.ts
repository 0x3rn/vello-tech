import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createDatabase } from "@/db/client";
import { categories } from "@/db/schema";
import { requireAdmin, requireSameOrigin } from "@/lib/neon/auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const safe = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "item";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    const categoryId = form.get("categoryId");
    const productSlug = form.get("productSlug");
    const colorName = form.get("colorName");
    if (!(file instanceof File) || typeof categoryId !== "string" || typeof productSlug !== "string") return NextResponse.json({ error: "Missing upload fields" }, { status: 400 });
    if (!allowedTypes.has(file.type) || file.size < 1 || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Image must be JPEG, PNG, WebP, AVIF, or GIF and no larger than 10 MB" }, { status: 400 });
    const [category] = await createDatabase().select().from(categories).where(eq(categories.id, categoryId)).limit(1);
    if (!category) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || file.type.split("/")[1] || "bin";
    const name = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const key = colorName && typeof colorName === "string"
      ? `products/${safe(category.slug)}/${safe(productSlug)}/colors/${safe(colorName)}/${name}`
      : `products/${safe(category.slug)}/${safe(productSlug)}/images/${name}`;
    const endpoint = process.env.NEON_OBJECT_STORAGE_ENDPOINT;
    const bucket = process.env.NEON_OBJECT_STORAGE_BUCKET;
    const accessKeyId = process.env.NEON_OBJECT_STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.NEON_OBJECT_STORAGE_SECRET_ACCESS_KEY;
    const publicUrl = process.env.NEON_OBJECT_STORAGE_PUBLIC_URL?.replace(/\/$/, "");
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicUrl) throw new Error("Object storage is not configured");
    const client = new S3Client({ endpoint, region: "auto", forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type, CacheControl: "public, max-age=31536000, immutable" }));
    return NextResponse.json({ url: `${publicUrl}/${key}`, key });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" || message === "Unauthorized" ? 403 : 500 });
  }
}
