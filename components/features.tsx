'use client'

import { Truck, Shield, Headphones, RefreshCw } from 'lucide-react'
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
  return (
    <section className="py-12 border-y border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div 
              key={feature.title} 
              className="flex items-center gap-4"
            >
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
      </div>
    </section>
  )
}
