'use client'

import { Truck, Shield, Headphones, RefreshCw } from 'lucide-react'

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $99. Fast delivery to your doorstep.',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% secure transactions with encrypted data.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Expert assistance whenever you need help.',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    description: '30-day hassle-free return policy.',
  },
]

export function Features() {
  return (
    <section className="py-16 border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div 
              key={feature.title} 
              className="flex items-start gap-4 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                <feature.icon className="h-6 w-6 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
