'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal, X } from 'lucide-react'
import { ProductGridSkeleton } from '@/components/ui/product-grid-skeleton'
import { ProductCard, type ProductData } from '@/components/product-card'
import { cn } from '@/lib/utils'

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  
  const [products, setProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [hideOutOfStock, setHideOutOfStock] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured')
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setProducts([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/catalog?resource=products&q=${encodeURIComponent(query)}`)
        if (!response.ok) throw new Error("Unable to load products")
        setProducts(await response.json() as ProductData[])
      } catch (error) {
        console.error("Error fetching search results:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query])

  // Derived state for filters
  const availableBrands = useMemo(() => {
    const brands = new Set(products.map(p => p.brand))
    return Array.from(brands).sort()
  }, [products])

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev => 
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    )
  }

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // Apply Brand Filter
    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand))
    }

    // Apply Condition Filter
    if (selectedConditions.length > 0) {
      result = result.filter(p => selectedConditions.includes((p.condition || 'new').toLowerCase()))
    }

    // Apply Stock Filter
    if (hideOutOfStock) {
      result = result.filter(p => p.stockQuantity > 0)
    }
    if (minPrice !== '') result = result.filter(p => (p.discountPrice ?? p.price) >= Number(minPrice))
    if (maxPrice !== '') result = result.filter(p => (p.discountPrice ?? p.price) <= Number(maxPrice))

    // Apply Sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price))
        break
      case 'price-desc':
        result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price))
        break
      case 'featured':
      default:
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
        break
    }

    return result
  }, [products, selectedBrands, selectedConditions, hideOutOfStock, minPrice, maxPrice, sortBy])

  return (
    <div className="min-h-screen bg-background pb-20 pt-8 lg:pt-12">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="mb-3 text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
            Search Results
          </h1>
          <p className="text-muted-foreground">
            {query ? `Showing results for "${query}"` : 'Enter a search term to find products.'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex items-center justify-between border border-border p-4 rounded-xl bg-card">
            <span className="font-medium">{filteredAndSortedProducts.length} Products</span>
            <Button variant="outline" size="sm" onClick={() => setIsMobileFiltersOpen(true)}>
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Sidebar Filters */}
          <div className={cn(
            "fixed inset-0 z-50 lg:z-0 bg-background lg:bg-transparent lg:static lg:block lg:w-64 lg:shrink-0 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto lg:overflow-visible",
            isMobileFiltersOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="p-6 lg:p-0">
              <div className="flex items-center justify-between lg:hidden mb-6">
                <h2 className="text-xl font-bold">Filters</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileFiltersOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {(selectedBrands.length > 0 || selectedConditions.length > 0 || hideOutOfStock || minPrice || maxPrice) && (
                <button type="button" onClick={() => { setSelectedBrands([]); setSelectedConditions([]); setHideOutOfStock(false); setMinPrice(''); setMaxPrice('') }} className="mb-5 text-sm font-medium text-primary hover:underline">Clear all filters</button>
              )}

              {/* Sort Options */}
              <div className="mb-8 lg:hidden">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Sort By</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="sort" checked={sortBy === 'featured'} onChange={() => setSortBy('featured')} className="accent-primary" />
                    <span className="text-sm group-hover:text-primary transition-colors">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="sort" checked={sortBy === 'price-asc'} onChange={() => setSortBy('price-asc')} className="accent-primary" />
                    <span className="text-sm group-hover:text-primary transition-colors">Price: Low to High</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="sort" checked={sortBy === 'price-desc'} onChange={() => setSortBy('price-desc')} className="accent-primary" />
                    <span className="text-sm group-hover:text-primary transition-colors">Price: High to Low</span>
                  </label>
                </div>
              </div>

              {/* Stock Status */}
              <details className="border-t border-border py-5">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">Availability</summary>
                <label className="mt-4 flex cursor-pointer items-center gap-2 group">
                  <input type="checkbox" checked={hideOutOfStock} onChange={(e) => setHideOutOfStock(e.target.checked)} className="rounded border-input text-primary accent-primary" />
                  <span className="text-sm group-hover:text-primary transition-colors">In Stock Only</span>
                </label>
              </details>

              {/* Condition Filter */}
              <details className="border-t border-border py-5">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">Condition</summary>
                <div className="mt-4 space-y-2">
                  {['new', 'used', 'refurbished'].map(condition => (
                    <label key={condition} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedConditions.includes(condition)} 
                        onChange={() => toggleCondition(condition)} 
                        className="rounded border-input text-primary accent-primary" 
                      />
                      <span className="text-sm group-hover:text-primary transition-colors capitalize">{condition}</span>
                    </label>
                  ))}
                </div>
              </details>

              {/* Brands Filter */}
              {availableBrands.length > 0 && (
                <details className="border-t border-border py-5">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">Brand</summary>
                  <div className="mt-4 max-h-[300px] space-y-2 overflow-y-auto pr-2 scrollbar-thin">
                    {availableBrands.map(brand => (
                      <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedBrands.includes(brand)} 
                          onChange={() => toggleBrand(brand)} 
                          className="rounded border-input text-primary accent-primary" 
                        />
                        <span className="text-sm group-hover:text-primary transition-colors">{brand}</span>
                      </label>
                    ))}
                  </div>
                </details>
              )}
              <details className="border-t border-border py-5">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">Price</summary>
                <div className="mt-4 flex items-center gap-2">
                  <input aria-label="Minimum price" type="number" min="0" inputMode="decimal" placeholder="Min $" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} className="min-w-0 w-1/2 rounded-lg border border-[#E7E9ED] bg-white px-3 py-2 text-sm outline-none focus:border-primary" />
                  <span className="text-muted-foreground">–</span>
                  <input aria-label="Maximum price" type="number" min="0" inputMode="decimal" placeholder="Max $" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="min-w-0 w-1/2 rounded-lg border border-[#E7E9ED] bg-white px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </details>
              
              {/* Mobile apply button */}
              <div className="lg:hidden mt-8">
                <Button className="w-full" onClick={() => setIsMobileFiltersOpen(false)}>
                  Show {filteredAndSortedProducts.length} Results
                </Button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : products.length === 0 && query ? (
              <div className="py-20 text-center">
                <h2 className="text-2xl font-semibold mb-2">No Matches Found</h2>
                <p className="text-muted-foreground">We couldn&apos;t find anything matching &quot;{query}&quot;.</p>
                <Link href="/" className="mt-6 inline-block">
                  <Button>Browse Products</Button>
                </Link>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="py-20 text-center">
                <h2 className="text-2xl font-semibold mb-2">No Products Found</h2>
                <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
                {(selectedBrands.length > 0 || selectedConditions.length > 0 || hideOutOfStock || minPrice || maxPrice) && (
                  <Button variant="outline" className="mt-6" onClick={() => { setSelectedBrands([]); setSelectedConditions([]); setHideOutOfStock(false); setMinPrice(''); setMaxPrice('') }}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-6 flex items-center justify-between border-b border-[#E7E9ED] pb-4 text-sm text-muted-foreground">
                  <span>{filteredAndSortedProducts.length} products</span>
                  <label className="hidden items-center gap-2 lg:flex">
                    Sort:
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="bg-transparent font-medium text-foreground outline-none">
                      <option value="featured">Featured</option>
                      <option value="price-asc">Price: low to high</option>
                      <option value="price-desc">Price: high to low</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 xl:grid-cols-3">
                  {filteredAndSortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 max-w-7xl mx-auto px-4"><ProductGridSkeleton count={8} /></div>}>
      <SearchResults />
    </Suspense>
  )
}
