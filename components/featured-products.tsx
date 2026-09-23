'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ProductCard, type ProductData } from '@/components/product-card'
import { cn } from '@/lib/utils'

export function FeaturedProducts({ initialProducts = [], categories = [] }: {
  initialProducts?: ProductData[]
  categories?: { id: string; name: string }[]
}) {
  const [activeFilter, setActiveFilter] = useState('All')
  const availableIds = new Set(initialProducts.map((product) => product.categoryId))
  const filters = ['All', ...categories.filter((category) => availableIds.has(category.id)).map((category) => category.name)]
  const products = activeFilter === 'All'
    ? initialProducts.slice(0, 4)
    : initialProducts.filter((product) => categories.find((category) => category.id === product.categoryId)?.name === activeFilter).slice(0, 4)

  return (
    <section id="products" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#111214] md:text-4xl">Featured products</h2>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-[#111214] hover:text-primary">
            Shop all products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {filters.length > 1 && (
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 border-b border-[#E7E9ED]" role="group" aria-label="Filter featured products">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
                className={cn('relative shrink-0 pb-3 text-sm transition-colors duration-200 hover:text-[#111214]', activeFilter === filter ? 'font-semibold text-[#111214] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary' : 'text-[#656A73]')}
              >
                {filter}
              </button>
            ))}
          </div>
        )}
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
          {products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 2} />)}
        </div>
      </div>
    </section>
  )
}
