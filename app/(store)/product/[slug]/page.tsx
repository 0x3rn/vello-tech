import { ProductDetailClient } from "./product-detail-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStoreProductBySlug, listCategories, listStoreProducts } from "@/lib/neon/catalog";

export const revalidate = 60;

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, categoryRows, allProducts] = await Promise.all([getStoreProductBySlug(slug), listCategories(), listStoreProducts()]);
  if (!product) return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
    <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
    <p className="text-muted-foreground mb-8">We couldn&apos;t find the product you were looking for.</p>
    <Link href="/"><Button>Back to Home</Button></Link>
  </div>;

  const categories = new Map(categoryRows.map((category) => [category.id, category]));
  const breadcrumbs: { name: string; slug: string }[] = [];
  let category = categories.get(product.subcategoryId || product.categoryId) ?? null;
  while (category) {
    breadcrumbs.unshift({ name: category.name, slug: category.slug });
    category = category.parentCategoryId ? categories.get(category.parentCategoryId) ?? null : null;
  }
  const displayCategory = categories.get(product.subcategoryId || product.categoryId) ?? null;
  const similarProducts = allProducts.filter((candidate) => candidate.categoryId === product.categoryId && candidate.id !== product.id).slice(0, 4);

  return <ProductDetailClient product={product} category={displayCategory} breadcrumbs={breadcrumbs} similarProducts={similarProducts} />;
}
