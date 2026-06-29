import { Hero, SlideData } from '@/components/hero'
import { Categories } from '@/components/categories'
import { FeaturedProducts } from '@/components/featured-products'
import { PromoSection } from '@/components/promo-section'
import { UsedProducts } from '@/components/used-products'
import { Features } from '@/components/features'
import { Testimonials } from '@/components/testimonials'
import { Newsletter } from '@/components/newsletter'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ProductData } from '@/components/product-card'

export const revalidate = 60

export default async function Home() {
  // Fetch Hero Slides
  let heroQ = query(collection(db, 'products'), where('isCarousel', '==', true), limit(5))
  let heroSnap = await getDocs(heroQ)
  if (heroSnap.empty) {
    heroQ = query(collection(db, 'products'), where('isNewArrival', '==', true), limit(3))
    heroSnap = await getDocs(heroQ)
  }
  
  const slides: SlideData[] = []
  heroSnap.forEach((doc) => {
    const data = doc.data()
    slides.push({
      id: doc.id,
      title: data.name || 'Premium Tech',
      subtitle: data.brand ? `By ${data.brand}` : 'Top Choice',
      description: data.description || 'Discover our premium selection of tech products.',
      price: data.discountPrice || data.price || 0,
      badge: data.isCarousel ? 'Featured' : 'New Arrival',
      slug: data.slug || '',
      image: data.imageUrls?.[0] || '',
    })
  })

  if (slides.length === 0) {
    slides.push({
      id: 'fallback-1',
      title: 'Welcome to Vello Tech',
      subtitle: 'Premium Electronics',
      description: 'Discover the latest in premium tech gadgets, laptops, and accessories built for the modern professional.',
      price: 0,
      badge: 'Welcome',
      slug: 'shop',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000&auto=format&fit=crop',
    })
  }

  // Fetch Categories
  const catSnap = await getDocs(collection(db, 'categories'))
  const categories: {id: string, name: string}[] = []
  const ignoreNames = ['new', 'used', 'refurbished']
  catSnap.forEach(doc => {
    const name = doc.data().name
    if (!ignoreNames.includes(name.toLowerCase())) {
      categories.push({ id: doc.id, name: name })
    }
  })

  // Fetch Featured Products
  const featuredQ = query(collection(db, 'products'), where('isFeatured', '==', true), limit(8))
  const featuredSnap = await getDocs(featuredQ)
  const featuredProducts: ProductData[] = []
  featuredSnap.forEach((doc) => {
    featuredProducts.push({ id: doc.id, ...doc.data() } as ProductData)
  })

  // Fetch Used Products
  const usedQ = query(collection(db, 'products'), where('condition', 'in', ['used', 'refurbished']), limit(8))
  const usedSnap = await getDocs(usedQ)
  const usedProducts: ProductData[] = []
  usedSnap.forEach((doc) => {
    usedProducts.push({ id: doc.id, ...doc.data() } as ProductData)
  })

  // Fetch Reviews for Testimonials
  const reviewsQ = query(collection(db, 'reviews'), where('rating', '==', 5), limit(6))
  const reviewsSnap = await getDocs(reviewsQ)
  const realTestimonials: any[] = []
  reviewsSnap.forEach(doc => {
    const data = doc.data()
    realTestimonials.push({
      name: data.userName || 'Verified Buyer',
      role: 'Customer',
      content: data.title ? `${data.title} - ${data.content}` : data.content,
      rating: data.rating,
      avatar: data.userName ? data.userName.substring(0, 2).toUpperCase() : 'VB'
    })
  })

  return (
    <div>
      <Hero initialSlides={slides} />
      <Features />
      <Categories />
      <FeaturedProducts initialProducts={featuredProducts} categories={categories} />
      <PromoSection />
      <UsedProducts initialProducts={usedProducts} categories={categories} />
      <Testimonials initialTestimonials={realTestimonials} />
      <Newsletter />
    </div>
  )
}
