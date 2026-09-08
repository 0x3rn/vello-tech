import { NextRequest, NextResponse } from "next/server";
import { listCategories, listStoreProducts } from "@/lib/neon/catalog";

export async function GET(request: NextRequest) {
  const resource = request.nextUrl.searchParams.get("resource") ?? "products";
  if (resource === "categories") return NextResponse.json(await listCategories());
  if (resource !== "products") return NextResponse.json({ error: "Unknown catalog resource" }, { status: 400 });

  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  const products = await listStoreProducts();
  if (!query) return NextResponse.json(products);
  return NextResponse.json(products.filter((product) =>
    [product.name, product.description, product.brand].some((value) => value.toLowerCase().includes(query)),
  ));
}
