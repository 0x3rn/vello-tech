'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useCartStore } from '@/lib/store/cart'
import { Button } from '@/components/ui/button'
import { Loader2, ShoppingCart, Star, SlidersHorizontal, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn, resolveImageUrl } from '@/lib/utils'

interface ProductData {
  id: string
  name: string
  brand: string
  price: number
  discountPrice: number | null
  stockQuantity: number
  description: string
  imageUrls: string[]
  categoryId: string
  isFeatured: boolean
  rating: number
  numReviews: number
  slug: string
  condition?: 'new' | 'used' | 'refurbished'
  imageAlts?: string[]
  colors?: { name: string; hex: string; priceModifier?: number; stockQuantity: number; imageUrls?: string[] }[]
  variantGroups?: { groupName: string; choices: { choiceName: string; priceModifier: number; stockQuantity: number }[] }[]
}

interface CategoryData {
  id: string
  name: string
  slug: string
  parentCategoryId: string | null
}

function BestSellersContent() {
  const searchParams = useSearchParams()
  const isSale = searchParams.get('sale') === 'true'
  
  const [products, setProducts] = useState<ProductData[]>([])
  const [categories, setCategories] = useState<{id: string, name: string, parentCategoryId: string | null}[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [hideOutOfStock, setHideOutOfStock] = useState(false)
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured')
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [addingProduct, setAddingProduct] = useState<string | null>(null)

  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    const fetchShopData = async () => {
      setLoading(true)
      try {
        const catSnap = await getDocs(collection(db, 'categories'))
        const cats: {id: string, name: string, parentCategoryId: string | null}[] = []
        const ignoreNames = ['new', 'used', 'refurbished']
        catSnap.forEach(doc => {
          const data = doc.data()
          if (!ignoreNames.includes((data.name || '').toLowerCase())) {
            cats.push({ id: doc.id, name: data.name, parentCategoryId: data.parentCategoryId || null })
          }
        })
        setCategories(cats)

        // Fetch products
        const prodQuery = query(collection(db, 'products'), where('isBestSeller', '==', true))
        const prodSnap = await getDocs(prodQuery)
        let fetchedProducts: ProductData[] = []
        
        prodSnap.forEach(doc => {
          fetchedProducts.push({ id: doc.id, ...doc.data() } as ProductData)
        })
        
        // If sale param is true, pre-filter
        if (isSale) {
          fetchedProducts = fetchedProducts.filter(p => p.discountPrice !== null && p.discountPrice < p.price)
        }
        
        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchShopData()
  }, [isSale])

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

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) ? prev.filter(c => c !== categoryId) : [...prev, categoryId]
    )
  }

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev => 
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    )
  }

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // Apply Category Filter
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.categoryId))
    }

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
        // By default we could sort by featured or rating, here we just prioritize featured
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
        break
    }

    return result
  }, [products, selectedCategories, selectedBrands, selectedConditions, hideOutOfStock, sortBy])

  const handleAddToCart = async (e: React.MouseEvent, product: ProductData) => {
    e.preventDefault()
    e.stopPropagation()
    
    if ((product.colors && product.colors.length > 0) || (product.variantGroups && product.variantGroups.length > 0)) {
      toast.info("Please select options for this product")
      window.location.href = `/product/${product.slug}`
      return
    }
    
    setAddingProduct(product.id)
    
    // Simulate short network delay for satisfying visual feedback
    await new Promise(resolve => setTimeout(resolve, 600))
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: resolveImageUrl(product.imageUrls?.[0]),
      quantity: 1,
      stockQuantity: product.stockQuantity,
      slug: product.slug,
      categoryId: product.categoryId
    })
    
    toast.success(`${product.name} added to cart`, {
      description: "You can view your cart or continue shopping.",
    })
    setAddingProduct(null)
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-8 lg:pt-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 border-b border-border pb-8">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-4">
            Best Sellers
          </h1>
          <p className="text-muted-foreground text-lg">
            Shop our most popular and highly rated products.
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

              {/* Sort Options */}
              <div className="mb-8">
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
              <div className="mb-8 border-t border-border pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Availability</h3>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={hideOutOfStock} onChange={(e) => setHideOutOfStock(e.target.checked)} className="rounded border-input text-primary accent-primary" />
                  <span className="text-sm group-hover:text-primary transition-colors">In Stock Only</span>
                </label>
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="mb-8 border-t border-border pt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Categories</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    {categories.filter(c => !c.parentCategoryId).map(mainCat => {
                      const isSelected = selectedCategories.includes(mainCat.id)
                      const subCats = categories.filter(c => c.parentCategoryId === mainCat.id)
                      
                      return (
                        <div key={mainCat.id} className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => toggleCategory(mainCat.id)} 
                              className="rounded border-input text-primary accent-primary" 
                            />
                            <span className="text-sm group-hover:text-primary transition-colors font-medium">{mainCat.name}</span>
                          </label>
                          
                          {isSelected && subCats.length > 0 && (
                            <div className="pl-6 space-y-2 mt-2 border-l-2 border-border/50 ml-2">
                              {subCats.map(subCat => (
                                <label key={subCat.id} className="flex items-center gap-2 cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedCategories.includes(subCat.id)} 
                                    onChange={() => toggleCategory(subCat.id)} 
                                    className="rounded border-input text-primary accent-primary" 
                                  />
                                  <span className="text-sm group-hover:text-primary transition-colors text-muted-foreground">{subCat.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Condition Filter */}
              <div className="mb-8 border-t border-border pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Condition</h3>
                <div className="space-y-2">
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
              </div>

              {/* Brands Filter */}
              {availableBrands.length > 0 && (
                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Brands</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
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
                </div>
              )}
              
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
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-20 bg-secondary/20 rounded-2xl border border-border">
                <h2 className="text-2xl font-semibold mb-2">No Best Sellers Found</h2>
                <p className="text-muted-foreground">Check back later for trending items.</p>
                {(selectedCategories.length > 0 || selectedBrands.length > 0 || hideOutOfStock) && (
                  <Button variant="outline" className="mt-6" onClick={() => { setSelectedBrands([]); setHideOutOfStock(false); }}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <div className="hidden lg:block mb-4 text-sm text-muted-foreground">
                  Showing {filteredAndSortedProducts.length} products
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAndSortedProducts.map((product) => (
                    <Link 
                      key={product.id} 
                      href={`/product/${product.slug}`}
                      className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg"
                    >
                      {/* Product Image */}
                      <div className="relative aspect-square bg-secondary/30 p-6 overflow-hidden flex items-center justify-center">
                        <Image
                          src={resolveImageUrl(product.imageUrls?.[0])}
                          alt={product.imageAlts?.[0] || product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-2 py-1 rounded text-xs font-medium border border-border">
                          {product.brand}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          <span className="text-sm font-medium">{product.rating}</span>
                          <span className="text-sm text-muted-foreground ml-1">({product.numReviews})</span>
                        </div>
                        
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        
                        <div className="mt-auto pt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              ${(product.discountPrice || product.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            {product.discountPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                ${(product.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={product.stockQuantity === 0 || addingProduct === product.id}
                            className="rounded-full w-10 h-10 p-0 shadow-md"
                          >
                            {addingProduct === product.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShoppingCart className="h-4 w-4" />
                            )}
                            <span className="sr-only">Add to cart</span>
                          </Button>
                        </div>
                      </div>
                    </Link>
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

export default function BestSellersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <BestSellersContent />
    </Suspense>
  )
}
