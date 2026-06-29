'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ProductCard, ProductData } from '@/components/product-card'

export function FeaturedProducts({ 
  initialProducts = [], 
  categories = [] 
}: { 
  initialProducts?: ProductData[],
  categories?: { id: string, name: string }[] 
}) {
  const [activeFilter, setActiveFilter] = useState('All')

  // Derive filters from available products and categories
  const availableCategoryIds = Array.from(new Set(initialProducts.map(p => p.categoryId)))
  const dynamicFilters = ['All', ...categories.filter(c => availableCategoryIds.includes(c.id)).map(c => c.name)]
  const filters = dynamicFilters.length > 1 ? dynamicFilters : ['All']

  const filteredProducts = activeFilter === 'All' 
    ? initialProducts 
    : initialProducts.filter(p => {
        const cat = categories.find(c => c.id === p.categoryId)
        return cat?.name === activeFilter
      })

  return (
    <section id="products" className="py-16 lg:py-20 bg-background relative">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
              Featured <span className="text-primary">Products</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl text-base">
              Handpicked selection of our best-selling and most-loved tech products.
            </p>
          </div>
          <Link href="/shop">
            <Button variant="outline" className="rounded-full px-8 transition-transform duration-300 hover:scale-105 border-primary/20 hover:bg-primary/5 hover:text-primary">
              View All Products
            </Button>
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-start md:justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 overflow-x-auto pb-4 scrollbar-hide px-4 md:px-0 -mx-4 md:mx-0"
        >
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'relative px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border outline-none',
                activeFilter === filter
                  ? 'text-primary-foreground border-transparent'
                  : 'bg-background text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
              )}
            >
              {activeFilter === filter && (
                <motion.div
                  layoutId="activeTabFeatured"
                  className="absolute inset-0 bg-primary rounded-md z-0"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{filter}</span>
            </button>
          ))}
        </motion.div>

        <motion.div 
          key={activeFilter}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {filteredProducts.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              priority={index < 4} // Preload first 4 items
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
