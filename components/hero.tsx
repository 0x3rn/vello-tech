'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const slides = [
  {
    id: 1,
    title: 'ProMax Smartphone X1',
    subtitle: 'Experience the Future',
    description: 'Revolutionary camera system with advanced features. The most capable smartphone we have ever created.',
    price: '$1,299',
    badge: 'New Arrival',
  },
  {
    id: 2,
    title: 'UltraBook Pro 16"',
    subtitle: 'Power Meets Portability',
    description: 'Unmatched performance in an incredibly thin design. Built for creators and professionals.',
    price: '$2,499',
    badge: 'Best Seller',
  },
  {
    id: 3,
    title: 'SoundWave Elite ANC',
    subtitle: 'Immersive Audio',
    description: 'Premium active noise cancellation with spatial audio. 40-hour battery life.',
    price: '$349',
    badge: 'Featured',
  },
]

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextSlide, 8000)
    return () => clearInterval(timer)
  }, [nextSlide])

  return (
    <section className="relative min-h-[700px] h-[85vh] max-h-[900px] w-full overflow-hidden bg-background border-b border-border">
      <div className="relative h-full mx-auto max-w-7xl px-16 md:px-24 lg:px-32 flex items-center pt-16 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full z-20">
          {/* Text Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center lg:items-start text-center lg:text-left"
            >
              {/* Badge */}
              <div className="inline-block px-4 py-2 bg-secondary text-secondary-foreground border border-border text-sm font-semibold rounded-full mb-8">
                {slides[currentSlide].badge}
              </div>

              {/* Subtitle */}
              <p className="text-muted-foreground text-lg md:text-xl font-medium mb-4 uppercase tracking-widest">
                {slides[currentSlide].subtitle}
              </p>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight mb-6">
                {slides[currentSlide].title}
              </h1>

              {/* Description */}
              <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                {slides[currentSlide].description}
              </p>

              {/* Price and CTA */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Starting from</p>
                  <p className="text-3xl font-bold text-foreground">{slides[currentSlide].price}</p>
                </div>
                <div className="flex gap-4 sm:ml-4">
                  <Button size="lg" className="rounded-none transition-all duration-300 hover:opacity-90">
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-none transition-all duration-300">
                    Learn More
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Placeholder Image Block */}
          <div className="hidden lg:block w-full z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="relative w-full aspect-square max-h-[500px] bg-secondary border border-border rounded-3xl flex items-center justify-center shadow-lg"
              >
                <div className="text-muted-foreground/50 flex flex-col items-center">
                  <span className="text-lg font-medium tracking-widest uppercase">Product Image</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute left-4 md:left-8 lg:left-12 top-1/2 -translate-y-1/2 z-30">
        <button
          onClick={prevSlide}
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
        </button>
      </div>
      <div className="absolute right-4 md:right-8 lg:right-12 top-1/2 -translate-y-1/2 z-30">
        <button
          onClick={nextSlide}
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
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

      {/* Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border z-30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {[
              { value: '50K+', label: 'Happy Customers' },
              { value: '4.9/5', label: 'Average Rating' },
              { value: '24/7', label: 'Support' },
              { value: '2 Year', label: 'Warranty' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-base font-bold text-foreground">{stat.value}</div>
                <div className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
