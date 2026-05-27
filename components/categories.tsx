'use client'

import { Smartphone, Laptop, Headphones, Watch, Camera, Gamepad2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const categories = [
  { 
    name: 'Smartphones', 
    icon: Smartphone, 
    count: 124,
    color: 'bg-blue-500/10 text-blue-600',
    hoverColor: 'hover:bg-blue-500/20',
  },
  { 
    name: 'Laptops', 
    icon: Laptop, 
    count: 86,
    color: 'bg-purple-500/10 text-purple-600',
    hoverColor: 'hover:bg-purple-500/20',
  },
  { 
    name: 'Audio', 
    icon: Headphones, 
    count: 215,
    color: 'bg-orange-500/10 text-orange-600',
    hoverColor: 'hover:bg-orange-500/20',
  },
  { 
    name: 'Wearables', 
    icon: Watch, 
    count: 98,
    color: 'bg-teal-500/10 text-teal-600',
    hoverColor: 'hover:bg-teal-500/20',
  },
  { 
    name: 'Cameras', 
    icon: Camera, 
    count: 67,
    color: 'bg-red-500/10 text-red-600',
    hoverColor: 'hover:bg-red-500/20',
  },
  { 
    name: 'Gaming', 
    icon: Gamepad2, 
    count: 143,
    color: 'bg-green-500/10 text-green-600',
    hoverColor: 'hover:bg-green-500/20',
  },
]

export function Categories() {
  return (
    <section id="categories" className="py-20 lg:py-28 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            Shop by Category
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Browse our extensive collection organized by category for easy navigation.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <a
                key={category.name}
                href={`#${category.name.toLowerCase()}`}
                className={cn(
                  'group relative bg-card rounded-2xl p-6 border border-border transition-all duration-300',
                  'hover:shadow-lg hover:-translate-y-1',
                  category.hoverColor
                )}
              >
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110',
                  category.color
                )}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 transition-colors duration-200 group-hover:text-primary">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground">{category.count} Products</p>
                
                <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
