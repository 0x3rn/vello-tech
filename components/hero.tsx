'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
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

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        // Fetch up to 3 featured products for the carousel
        const q = query(collection(db, 'products'), where('isFeatured', '==', true), limit(3))
        const snapshot = await getDocs(q)
        const fetchedSlides: SlideData[] = []
        
        snapshot.forEach((doc) => {
          const data = doc.data()
          fetchedSlides.push({
            id: doc.id,
            title: data.name || 'Featured Product',
            subtitle: data.brand ? `By ${data.brand}` : 'Top Choice',
            description: data.description || 'Discover our premium selection of tech products.',
            price: data.discountPrice || data.price || 0,
            badge: data.badge || 'Featured',
            slug: data.slug,
            image: data.imageUrls?.[0] || '',
          })
        })

        // If no featured products found in DB, fallback to an empty state or generic
        setSlides(fetchedSlides)
      } catch (error) {
        console.error("Error fetching hero slides:", error)
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
    <section className="relative w-full overflow-hidden bg-background border-b border-border transition-colors duration-1000">
      {/* Ambient Section Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${currentSlide}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        >
          <Image 
            src={resolveImageUrl(current.image)} 
            alt="Ambient background" 
            fill 
            className="object-cover opacity-15 sm:opacity-20 blur-[100px] scale-150 saturate-150"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </motion.div>
      </AnimatePresence>

      <div className="relative h-full mx-auto max-w-7xl px-6 sm:px-12 md:px-16 lg:px-24 flex items-center pt-12 lg:pt-24 pb-20 lg:pb-36 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full z-20 mt-4 lg:mt-0">
          
          {/* Mobile Image Block (Shows above text on mobile) */}
          <div className="block lg:hidden w-full z-20 mb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`mobile-img-${currentSlide}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="relative w-full aspect-square max-h-[350px] flex items-center justify-center"
              >
                {/* Spotlight Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0)_70%)] opacity-80 dark:opacity-60" />
                <Link href={`/product/${current.slug}`} className="absolute inset-0 z-10">
                  <Image 
                    src={resolveImageUrl(current.image)} 
                    alt={current.title} 
                    fill 
                    className="object-contain p-8 mix-blend-multiply hover:scale-105 transition-transform duration-500" 
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center lg:items-start text-center lg:text-left"
            >
              {/* Badge */}
              <div className="inline-block px-4 py-2 bg-secondary text-secondary-foreground border border-border text-sm font-semibold rounded-full mb-6 lg:mb-8">
                {current.badge}
              </div>

              {/* Subtitle */}
              <p className="text-muted-foreground text-sm md:text-xl font-medium mb-3 lg:mb-4 uppercase tracking-widest">
                {current.subtitle}
              </p>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight mb-4 lg:mb-6 line-clamp-2">
                {current.title}
              </h1>

              {/* Description */}
              <p className="text-sm md:text-lg text-muted-foreground max-w-lg mb-6 lg:mb-8 leading-relaxed line-clamp-3">
                {current.description}
              </p>

              {/* Price and CTA */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-6">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground mb-1 uppercase tracking-wider">Starting from</p>
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">
                    ${current.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex gap-4 sm:ml-4">
                  <Link href={`/product/${current.slug}`}>
                    <Button size="lg" className="rounded-none transition-all duration-300 hover:opacity-90">
                      Shop Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Desktop Image Block */}
          <div className="hidden lg:block w-full z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={`desktop-img-${currentSlide}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="relative w-full aspect-square max-h-[500px] flex items-center justify-center group"
              >
                {/* Spotlight Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0)_70%)] opacity-80 dark:opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
                <Link href={`/product/${current.slug}`} className="absolute inset-0 z-10">
                  <Image 
                    src={resolveImageUrl(current.image)} 
                    alt={current.title} 
                    fill 
                    className="object-contain p-12 mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                    priority
                  />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <div className="hidden md:flex absolute left-4 md:left-8 lg:left-12 top-1/2 -translate-y-1/2 z-30">
            <button
              onClick={prevSlide}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors bg-background/50 backdrop-blur-sm rounded-full"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
            </button>
          </div>
          <div className="hidden md:flex absolute right-4 md:right-8 lg:right-12 top-1/2 -translate-y-1/2 z-30">
            <button
              onClick={nextSlide}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors bg-background/50 backdrop-blur-sm rounded-full"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
            </button>
          </div>
          
          {/* Slide Indicators */}
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
        </>
      )}
    </section>
  )
}
