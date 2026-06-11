'use client'

import { Smartphone, Laptop, Headphones, Watch, Camera, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const categories = [
  { 
    name: 'Smartphones', 
    icon: Smartphone, 
    count: 124,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  { 
    name: 'Laptops', 
    icon: Laptop, 
    count: 86,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  { 
    name: 'Audio', 
    icon: Headphones, 
    count: 215,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  { 
    name: 'Wearables', 
    icon: Watch, 
    count: 98,
    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  },
  { 
    name: 'Cameras', 
    icon: Camera, 
    count: 67,
    color: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  { 
    name: 'Gaming', 
    icon: Gamepad2, 
    count: 143,
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
]

export function Categories() {
  return (
    <section id="categories" className="py-24 lg:py-32 bg-secondary/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-px bg-primary/20" />
      
      <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            Shop by <span className="text-primary">Category</span>
          </h2>
          <p className="mt-6 text-muted-foreground max-w-2xl mx-auto text-lg">
            Browse our extensive collection organized by category for easy navigation and discovering exactly what you need.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <a
                key={category.name}
                href={`#${category.name.toLowerCase()}`}
                className={cn(
                  'block bg-card/80 backdrop-blur-sm rounded-3xl sm:rounded-[2rem] p-4 sm:p-6 border border-white/10 dark:border-white/5',
                  'hover:shadow-lg transition-shadow duration-200'
                )}
              >
                <div className={cn(
                  'w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-inner',
                  category.color
                )}>
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <h3 className="font-bold text-foreground mb-1 sm:mb-1.5 text-base sm:text-lg">
                  {category.name}
                </h3>
                <p className="text-sm font-medium text-muted-foreground">{category.count} Products</p>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
