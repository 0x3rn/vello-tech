import { Hero, SlideData } from "@/components/hero";
import { Categories } from "@/components/categories";
import { FeaturedProducts } from "@/components/featured-products";
import { PromoSection } from "@/components/promo-section";
import { UsedProducts } from "@/components/used-products";
import { NewArrivals } from "@/components/new-arrivals";
import { Features } from "@/components/features";
import { Testimonials } from "@/components/testimonials";
import { Newsletter } from "@/components/newsletter";
import { listCategories, listFiveStarTestimonials, listStoreProducts } from "@/lib/neon/catalog";

export const revalidate = 60;

export default async function Home() {
  const [allProducts, categoryRows, testimonials] = await Promise.all([
    listStoreProducts(),
    listCategories(),
    listFiveStarTestimonials(),
  ]);
  const heroProducts = allProducts.filter((product) => product.isCarousel).slice(0, 5);
  const slideProducts = heroProducts.length ? heroProducts : allProducts.filter((product) => product.isNewArrival).slice(0, 3);
  const slides: SlideData[] = slideProducts.map((product) => ({
    id: product.id,
    title: product.name || "Premium Tech",
    subtitle: product.brand ? `By ${product.brand}` : "Top Choice",
    description: product.description || "Discover our premium selection of tech products.",
    price: product.discountPrice || product.price,
    badge: product.isCarousel ? "Featured" : "New Arrival",
    slug: product.slug,
    image: product.imageUrls[0] || "",
  }));
  if (!slides.length) slides.push({
    id: "fallback-1",
    title: "Welcome to Vello Tech",
    subtitle: "Premium Electronics",
    description: "Discover the latest in premium tech gadgets, laptops, and accessories built for the modern professional.",
    price: 0,
    badge: "Welcome",
    slug: "shop",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000&auto=format&fit=crop",
  });

  const ignored = new Set(["new", "used", "refurbished"]);
  const categoryList = categoryRows.filter((category) => !ignored.has(category.name.toLowerCase())).map(({ id, name }) => ({ id, name }));

  return <div>
    <Hero initialSlides={slides} />
    <Features />
    <Categories initialCategories={categoryRows} initialProducts={allProducts} />
    <FeaturedProducts initialProducts={allProducts.filter((product) => product.isFeatured).slice(0, 8)} categories={categoryList} />
    <PromoSection product={allProducts.find((product) => product.discountPrice !== null && product.discountPrice < product.price && product.imageUrls.length > 0 && !product.imageUrls[0].includes('via.placeholder.com'))} />
    <UsedProducts initialProducts={allProducts.filter((product) => product.condition === "used" || product.condition === "refurbished").slice(0, 4)} categories={categoryList} />
    <NewArrivals products={allProducts.filter((product) => product.isNewArrival)} />
    <Testimonials initialTestimonials={testimonials} />
    <Newsletter />
  </div>;
}
