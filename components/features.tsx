'use client'

import { useState, useEffect } from 'react'
import { Truck, Shield, Headphones, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $99.',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% secure transactions.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Expert assistance anytime.',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    description: '30-day return policy.',
  },
]

export function Features() {
  const [page, setPage] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      if (window.innerWidth < 640) {
        setPage((p) => (p === 0 ? 1 : 0))
      }
    }, 4000)

    const handleResize = () => {
      if (window.innerWidth >= 640) setPage(0)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      clearInterval(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <section className="py-8 md:py-12 border-y border-border bg-background overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Desktop View */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View with Transition */}
        <div className="sm:hidden relative h-16 w-full flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-between gap-2"
            >
              {features.slice(page * 2, page * 2 + 2).map((feature) => (
                <div key={feature.title} className="flex items-center gap-3 w-1/2">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-primary bg-primary/5 rounded-full">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{feature.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
