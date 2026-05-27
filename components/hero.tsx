'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const slides = [
  {
    id: 1,
    title: 'ProMax Smartphone X1',
    subtitle: 'Experience the Future',
    description: 'Revolutionary camera system with AI-powered features. The most advanced smartphone we have ever created.',
    price: '$1,299',
    image: '/images/hero-smartphone.jpg',
    badge: 'New Arrival',
  },
  {
    id: 2,
    title: 'UltraBook Pro 16"',
    subtitle: 'Power Meets Portability',
    description: 'Unmatched performance in an incredibly thin design. Built for creators and professionals.',
    price: '$2,499',
    image: '/images/hero-laptop.jpg',
    badge: 'Best Seller',
  },
  {
    id: 3,
    title: 'SoundWave Elite ANC',
    subtitle: 'Immersive Audio',
    description: 'Premium active noise cancellation with spatial audio. 40-hour battery life.',
    price: '$349',
    image: '/images/hero-headphones.jpg',
    badge: 'Featured',
  },
]

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const goToSlide = useCallback((index: number) => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentSlide(index)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isAnimating])

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length)
  }, [currentSlide, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length)
  }, [currentSlide, goToSlide])

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000)
    return () => clearInterval(timer)
  }, [nextSlide])

  const slide = slides[currentSlide]

  return (
    <section className="relative h-screen min-h-[700px] max-h-[900px] w-full overflow-hidden bg-secondary">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/90 to-primary/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full mx-auto max-w-7xl px-4 lg:px-8 flex items-center">
        <div className="max-w-2xl">
          {/* Badge */}
          <div
            className={cn(
              'inline-block px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full mb-6 transition-all duration-500 ease-out',
              isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            )}
          >
            {slide.badge}
          </div>

          {/* Subtitle */}
          <p
            className={cn(
              'text-primary-foreground/80 text-lg md:text-xl font-medium mb-2 transition-all duration-500 ease-out delay-75',
              isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            )}
          >
            {slide.subtitle}
          </p>

          {/* Title */}
          <h1
            className={cn(
              'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-foreground tracking-tight leading-tight mb-6 transition-all duration-500 ease-out delay-100',
              isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            )}
          >
            {slide.title}
          </h1>

          {/* Description */}
          <p
            className={cn(
              'text-lg text-primary-foreground/80 max-w-lg mb-8 leading-relaxed transition-all duration-500 ease-out delay-150',
              isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            )}
          >
            {slide.description}
          </p>

          {/* Price and CTA */}
          <div
            className={cn(
              'flex flex-col sm:flex-row items-start sm:items-center gap-6 transition-all duration-500 ease-out delay-200',
              isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            )}
          >
            <div>
              <p className="text-sm text-primary-foreground/60 mb-1">Starting from</p>
              <p className="text-3xl font-bold text-primary-foreground">{slide.price}</p>
            </div>
            <div className="flex gap-4">
              <Button size="lg" className="group transition-transform duration-300 hover:scale-105">
                Shop Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 transition-all duration-300">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={prevSlide}
          className="w-12 h-12 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center text-primary-foreground transition-all duration-300 hover:bg-primary-foreground/20 hover:scale-110"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>
      <div className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={nextSlide}
          className="w-12 h-12 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center text-primary-foreground transition-all duration-300 hover:bg-primary-foreground/20 hover:scale-110"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              index === currentSlide 
                ? 'w-8 bg-primary-foreground' 
                : 'w-2 bg-primary-foreground/40 hover:bg-primary-foreground/60'
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-4">
          <div className="flex items-center justify-center md:justify-between gap-8 flex-wrap">
            <div className="flex items-center gap-8 md:gap-12">
              {[
                { value: '50K+', label: 'Happy Customers' },
                { value: '4.9/5', label: 'Average Rating' },
                { value: '24/7', label: 'Support' },
                { value: '2 Year', label: 'Warranty' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
