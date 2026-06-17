'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, resolveImageUrl } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'
import Link from 'next/link'

interface SlideData {
  id: string
  title: string
  subtitle: string
  description: string
  price: number
  badge: string
  slug: string
  image: string
}

export function Hero() {
  const [slides, setSlides] = useState<SlideData[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)

  // Touch handlers for swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
  }

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        // 1. Try to fetch products explicitly marked for the carousel
        let q = query(collection(db, 'products'), where('isCarousel', '==', true), limit(5))
        let snapshot = await getDocs(q)
        
        // 2. Fallback to New Arrivals if no carousel items exist
        if (snapshot.empty) {
          q = query(collection(db, 'products'), where('isNewArrival', '==', true), limit(3))
          snapshot = await getDocs(q)
        }
        
        const fetchedSlides: SlideData[] = []
        
        snapshot.forEach((doc) => {
          const data = doc.data()
          fetchedSlides.push({
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

        // 3. Ultimate static fallback if the database is completely empty or missing flags
        if (fetchedSlides.length === 0) {
          fetchedSlides.push({
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

        setSlides(fetchedSlides)
      } catch (error) {
        console.error("Error fetching hero slides:", error)
        toast.error("Failed to load products. Reference: ERR-VLT-DB-101")
      } finally {
        setLoading(false)
      }
    }

    fetchSlides()
  }, [])

  const nextSlide = useCallback(() => {
    if (slides.length <= 1) return
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const prevSlide = useCallback(() => {
    if (slides.length <= 1) return
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(nextSlide, 8000)
    return () => clearInterval(timer)
  }, [nextSlide, slides.length])

  if (loading) {
    return (
      <section className="relative w-full h-[600px] overflow-hidden bg-background border-b border-border flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </section>
    )
  }

  if (slides.length === 0) {
    return null // Or render a static fallback hero if desired
  }

  const current = slides[currentSlide]

  return (
    <section 
      className="relative w-full overflow-hidden bg-zinc-950 text-white min-h-[80vh] flex items-center transition-colors duration-1000"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Sleek Dark Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black z-0" />
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03)_0%,transparent_50%)] pointer-events-none z-0" />

      <div className="relative h-full w-full mx-auto max-w-7xl px-6 sm:px-12 md:px-16 lg:px-24 pt-12 lg:pt-0 pb-20 lg:pb-0 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full min-h-[600px]">
          
          {/* Mobile Image Block (Shows above text on mobile) */}
          <div className="block lg:hidden w-full z-20 mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`mobile-img-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative w-full aspect-square max-h-[400px] flex items-center justify-center"
              >
                <Link href={current.slug === 'shop' ? '/shop' : `/product/${current.slug}`} className="absolute inset-0 z-10 flex items-center justify-center">
                  <Image 
                    src={resolveImageUrl(current.image)} 
                    alt={current.title} 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-4 hover:scale-105 transition-transform duration-700 drop-shadow-2xl" 
                    priority
                  />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Text Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${currentSlide}`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col items-center lg:items-start text-center lg:text-left z-20"
            >
              {/* Badge */}
              <div className="inline-block px-4 py-1.5 bg-white/10 text-white backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest rounded-full mb-8">
                {current.badge}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 line-clamp-3">
                {current.title}
              </h1>

              {/* Description */}
              <p className="text-base md:text-xl text-zinc-400 max-w-lg mb-10 leading-relaxed font-light line-clamp-3">
                {current.description}
              </p>

              {/* Price and CTA */}
              <div className="flex flex-col sm:flex-row items-center lg:items-center gap-6 w-full lg:w-auto">
                <Link href={current.slug === 'shop' ? '/shop' : `/product/${current.slug}`} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold transition-all duration-300">
                    Shop Now
                  </Button>
                </Link>
                {current.price > 0 && (
                  <p className="text-lg lg:text-xl font-medium text-white/90">
                    ${current.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Desktop Image Block */}
          <div className="hidden lg:block w-full z-20 h-full relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`desktop-img-${currentSlide}`}
                initial={{ opacity: 0, scale: 0.9, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 1.05, x: -30 }}
                transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <Link href={current.slug === 'shop' ? '/shop' : `/product/${current.slug}`} className="relative w-full h-full max-h-[600px] flex items-center justify-center">
                  <Image 
                    src={resolveImageUrl(current.image)} 
                    alt={current.title} 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-8 group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl" 
                    priority
                  />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 lg:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  index === currentSlide 
                    ? 'w-10 bg-foreground' 
                    : 'w-3 bg-muted hover:bg-muted-foreground'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
        </div>
      )}
    </section>
  )
}
