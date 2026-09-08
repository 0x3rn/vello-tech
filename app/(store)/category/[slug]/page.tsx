import { CategoryClient } from "./category-client";
import { notFound } from "next/navigation";
import { getCategoryBySlug, listCategories, listStoreProducts } from "@/lib/neon/catalog";

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, categoryRows, allProducts] = await Promise.all([getCategoryBySlug(slug), listCategories(), listStoreProducts()]);
  if (!category) notFound();
  const ignored = new Set(["new", "used", "refurbished"]);
  const subcategories = categoryRows.filter((candidate) => candidate.parentCategoryId === category.id && !ignored.has(candidate.name.toLowerCase()));
  const categoryIds = new Set([category.id, ...subcategories.map((item) => item.id)]);
  const products = allProducts.filter((product) => categoryIds.has(product.categoryId) || (product.subcategoryId && categoryIds.has(product.subcategoryId)));
  const parent = category.parentCategoryId ? categoryRows.find((item) => item.id === category.parentCategoryId) : null;
  return <CategoryClient categoryName={category.name} parentCategory={parent ? { name: parent.name, slug: parent.slug } : null} initialProducts={products} subcategories={subcategories} />;
}
