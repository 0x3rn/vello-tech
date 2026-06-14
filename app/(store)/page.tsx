import { Hero } from '@/components/hero'
import { Categories } from '@/components/categories'
import { FeaturedProducts } from '@/components/featured-products'
import { PromoSection } from '@/components/promo-section'
import { Features } from '@/components/features'
import { Testimonials } from '@/components/testimonials'
import { Newsletter } from '@/components/newsletter'

export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <Categories />
      <FeaturedProducts />
      <PromoSection />
      <Testimonials />
      <Newsletter />
    </div>
  )
}
