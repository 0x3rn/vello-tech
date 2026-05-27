import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { Categories } from '@/components/categories'
import { FeaturedProducts } from '@/components/featured-products'
import { PromoSection } from '@/components/promo-section'
import { Features } from '@/components/features'
import { Testimonials } from '@/components/testimonials'
import { Newsletter } from '@/components/newsletter'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-16">
        <Hero />
        <Features />
        <Categories />
        <FeaturedProducts />
        <PromoSection />
        <Testimonials />
        <Newsletter />
        <Footer />
      </div>
    </main>
  )
}
