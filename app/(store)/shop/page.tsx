import { ShopClient } from "./shop-client";
import { listCategories, listStoreProducts } from "@/lib/neon/catalog";

export const revalidate = 60;

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const [{ sale }, categoryRows, allProducts] = await Promise.all([searchParams, listCategories(), listStoreProducts()]);
  const isSale = sale === "true";
  const ignored = new Set(["new", "used", "refurbished"]);
  const categories = categoryRows.filter((category) => !ignored.has(category.name.toLowerCase()));
  const products = isSale ? allProducts.filter((product) => product.discountPrice !== null && product.discountPrice < product.price) : allProducts;
  return <ShopClient initialProducts={products} categories={categories} title={isSale ? "Sale Items" : "All Products"} description="Explore our curated selection of top-tier products." />;
}
