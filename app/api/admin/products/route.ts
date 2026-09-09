import { NextResponse } from "next/server";
import { getProduct, saveProduct } from "@/lib/neon/admin";
import { invalidateCatalogCache, listStoreProducts } from "@/lib/neon/catalog";
import { requireAdmin, requireSameOrigin } from "@/lib/neon/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const id = new URL(request.url).searchParams.get("id");
    return NextResponse.json(id ? await getProduct(id) : await listStoreProducts());
  } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await requireAdmin();
    const id = await saveProduct(await request.json());
    invalidateCatalogCache();
    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create product";
    return NextResponse.json({ error: message }, { status: /invalid/i.test(message) ? 400 : 500 });
  }
}

export async function PUT(request: Request) {
  try {
    requireSameOrigin(request);
    await requireAdmin();
    const body = await request.json();
    if (typeof body.id !== "string") return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    const id = await saveProduct(body, body.id);
    invalidateCatalogCache();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update product";
    return NextResponse.json({ error: message }, { status: /invalid/i.test(message) ? 400 : 500 });
  }
}
