import { ShopClient } from "../shop/shop-client";
import { listCategories, listStoreProducts } from "@/lib/neon/catalog";

export const revalidate = 60;

export default async function NewArrivalsPage() {
  const [categoryRows, allProducts] = await Promise.all([listCategories(), listStoreProducts()]);
  const ignored = new Set(["new", "used", "refurbished"]);
  return <ShopClient initialProducts={allProducts.filter((product) => product.isNewArrival)} categories={categoryRows.filter((category) => !ignored.has(category.name.toLowerCase()))} title="New Arrivals" description="Discover the latest and greatest products added to our catalog." />;
}
