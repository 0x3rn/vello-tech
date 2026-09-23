'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, resolveImageUrl } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export interface SlideData {
  id: string
  title: string
  subtitle: string
  description: string
  price: number
  badge: string
  slug: string
  image: string
}

export function Hero({ initialSlides = [] }: { initialSlides?: SlideData[] }) {
  const [currentSlide, setCurrentSlide] = useState(0)

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

  const nextSlide = useCallback(() => {
    if (initialSlides.length <= 1) return
    setCurrentSlide((prev) => (prev + 1) % initialSlides.length)
  }, [initialSlides.length])

  const prevSlide = useCallback(() => {
    if (initialSlides.length <= 1) return
    setCurrentSlide((prev) => (prev - 1 + initialSlides.length) % initialSlides.length)
  }, [initialSlides.length])

  useEffect(() => {
    if (initialSlides.length <= 1) return
    const timer = setInterval(nextSlide, 8000)
    return () => clearInterval(timer)
  }, [nextSlide, initialSlides.length])

  if (initialSlides.length === 0) {
    return null
  }

  const current = initialSlides[currentSlide]

  return (
    <section 
      className="relative flex min-h-[620px] w-full items-center overflow-hidden bg-[#101114] text-white lg:min-h-[680px]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Sleek Dark Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black z-0" />
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03)_0%,transparent_50%)] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto h-full w-full max-w-[1440px] px-6 pb-20 pt-12 sm:px-8 lg:px-16 lg:py-14">
        <div className="grid min-h-[540px] w-full grid-cols-1 items-center gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
          
          {/* Mobile Image Block (Shows above text on mobile) */}
          <div className="block lg:hidden w-full z-20 mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`mobile-img-${currentSlide}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="relative flex aspect-square max-h-[340px] w-full items-center justify-center"
              >
                <Link href={current.slug === 'shop' ? '/shop' : `/product/${current.slug}`} className="absolute inset-0 z-10 flex items-center justify-center">
                  <Image 
                    src={resolveImageUrl(current.image)} 
                    alt={current.title} 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-4"
                    priority={currentSlide === 0}
                  />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Text Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${currentSlide}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="z-20 flex flex-col items-center text-center lg:items-start lg:text-left"
            >
              {/* Badge */}
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/65">{current.badge} / {current.subtitle}</p>

              {/* Title */}
              <h1 className="mb-6 max-w-[650px] text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-5xl lg:text-[clamp(3.75rem,5vw,4.5rem)]">
                {current.title}
              </h1>

              {/* Description */}
              <p className="mb-7 max-w-md text-base leading-relaxed text-zinc-400 md:text-lg line-clamp-3">
                {current.description}
              </p>
              {current.price > 0 && (
                <p className="mb-7 text-xl font-semibold tracking-tight text-white">
                  ${current.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              )}

              {/* Price and CTA */}
              <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row lg:items-center">
                <Link href={current.slug === 'shop' ? '/shop' : `/product/${current.slug}`} className="w-full sm:w-auto">
                  <Button size="lg" className="h-12 w-full rounded-[11px] bg-primary px-7 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto">
                    Shop now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href={current.slug === 'shop' ? '/categories' : `/product/${current.slug}`} className="px-3 py-3 text-sm font-medium text-white/75 transition-colors hover:text-white">
                  {current.slug === 'shop' ? 'Explore categories' : 'View details'}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Desktop Image Block */}
          <div className="hidden lg:block w-full z-20 h-full relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`desktop-img-${currentSlide}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Link href={current.slug === 'shop' ? '/shop' : `/product/${current.slug}`} className="relative flex h-full max-h-[620px] w-full items-center justify-center">
                  <Image 
                    src={resolveImageUrl(current.image)} 
                    alt={current.title} 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-[5%]"
                    priority={currentSlide === 0}
                  />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      {initialSlides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 lg:bottom-10">
            {initialSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  'h-1 rounded-full transition-all duration-[220ms]',
                  index === currentSlide 
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
        </div>
      )}
    </section>
  )
}
