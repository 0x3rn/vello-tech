import { ShopClient } from "../shop/shop-client";
import { listCategories, listStoreProducts } from "@/lib/neon/catalog";

export const revalidate = 60;

export default async function BestSellersPage() {
  const [categoryRows, allProducts] = await Promise.all([listCategories(), listStoreProducts()]);
  const ignored = new Set(["new", "used", "refurbished"]);
  return <ShopClient initialProducts={allProducts.filter((product) => product.isBestSeller)} categories={categoryRows.filter((category) => !ignored.has(category.name.toLowerCase()))} title="Best Sellers" description="Shop our most popular and highly rated products." />;
}
