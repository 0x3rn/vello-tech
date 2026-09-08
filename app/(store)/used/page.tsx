import { ShopClient } from "../shop/shop-client";
import { listCategories, listStoreProducts } from "@/lib/neon/catalog";

export const revalidate = 60;

export default async function UsedPage() {
  const [categoryRows, allProducts] = await Promise.all([listCategories(), listStoreProducts()]);
  const ignored = new Set(["new", "used", "refurbished"]);
  return <ShopClient initialProducts={allProducts.filter((product) => product.condition === "used" || product.condition === "refurbished")} categories={categoryRows.filter((category) => !ignored.has(category.name.toLowerCase()))} title="Pre-Owned & Refurbished" description="Certified pre-owned and fully refurbished devices at a fraction of the cost." />;
}
