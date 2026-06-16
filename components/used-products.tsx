'use client'

import { useEffect, useState } from 'react'
import { Star, Heart, ShoppingCart, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, resolveImageUrl } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import { toast } from 'sonner'

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
  badge?: string
  condition?: 'new' | 'used' | 'refurbished'
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' as const }
  }
}

function ProductCard({ product }: { product: ProductData }) {
  const [isLiked, setIsLiked] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsAdding(true)
    
    // Simulate short network delay for satisfying visual feedback
    await new Promise(resolve => setTimeout(resolve, 600))
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: resolveImageUrl(product.imageUrls?.[0]),
      quantity: 1,
      slug: product.slug,
      categoryId: product.categoryId,
    })
    
    toast.success(`${product.name} added to cart`, {
      description: "You can view your cart or continue shopping.",
    })
    setIsAdding(false)
  }

  return (
    <motion.div 
      variants={itemVariants}
      className="group bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-square p-6 overflow-hidden bg-secondary/30 flex items-center justify-center">
          <Image
            src={resolveImageUrl(product.imageUrls?.[0])}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Badges */}
          {product.isFeatured && (
            <Badge className="absolute top-4 left-4 border-none shadow-sm font-bold px-3 py-1 text-xs z-10 bg-primary/90 text-primary-foreground">
              Featured
            </Badge>
          )}

          {/* Action buttons */}
          <div className={cn(
            'absolute top-4 right-4 flex flex-col gap-3 transition-all duration-500 ease-out z-10',
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          )}>
            <button
              onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }}
              className={cn(
                'w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border shadow-sm transition-colors duration-300 hover:bg-secondary',
                isLiked && 'bg-destructive/10 border-destructive/20 text-destructive'
              )}
            >
              <Heart className={cn(
                'h-5 w-5 transition-colors duration-300',
                isLiked ? 'fill-destructive text-destructive' : 'text-foreground'
              )} />
            </button>
            <button 
              onClick={(e) => e.preventDefault()}
              className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border shadow-sm transition-colors duration-300 hover:bg-secondary"
            >
              <Eye className="h-5 w-5 text-foreground" />
            </button>
          </div>

          {/* Quick add button */}
          <div className={cn(
            'absolute bottom-4 left-4 right-4 transition-all duration-500 ease-out z-10',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}>
            <Button 
              onClick={handleAddToCart}
              disabled={product.stockQuantity === 0 || isAdding}
              className="w-full rounded-xl shadow-lg transition-transform duration-300 hover:scale-[1.02]" 
              size="default"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 relative z-20 bg-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{product.brand}</p>
          <h3 className="font-bold text-foreground mt-2 text-base transition-colors duration-300 group-hover:text-primary line-clamp-2">
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={cn(
                    'h-4 w-4 transition-colors duration-300',
                    i < Math.floor(product.rating || 0) 
                      ? 'fill-amber-400 text-amber-400' 
                      : 'fill-muted text-muted'
                  )} 
                />
              ))}
            </div>
            <span className="text-sm font-bold text-foreground ml-1">{product.rating || 0}</span>
            <span className="text-sm text-muted-foreground">({product.numReviews || 0})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mt-4">
            <span className="text-xl font-extrabold text-foreground">
              ${(product.discountPrice || product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            {product.discountPrice && (
              <span className="text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/50">
                ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            )}
            {product.discountPrice && (
              <Badge variant="secondary" className="ml-auto text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                Save ${(product.price - product.discountPrice).toLocaleString()}
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function UsedProducts() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [products, setProducts] = useState<ProductData[]>([])
  const filters = ['All', 'Smartphones', 'Laptops', 'Audio']

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), where('condition', 'in', ['used', 'refurbished']), limit(8))
        const snapshot = await getDocs(q)
        const fetchedProducts: ProductData[] = []
        snapshot.forEach((doc) => {
          fetchedProducts.push({ id: doc.id, ...doc.data() } as ProductData)
        })
        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Error fetching used products:", error)
      }
    }
    fetchProducts()
  }, [])

  // In a real app we'd filter by checking if categoryId matches the parent category ID
  // For the sake of this mock UI filter on the homepage, we just do a rough substring match on categoryId
  const filteredProducts = activeFilter === 'All' 
    ? products 
    : products.filter(p => p.categoryId.includes(activeFilter.toLowerCase()))

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
            <h2 className="text-3xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Shop <span className="text-primary">Pre-Owned</span> & Refurbished Deals
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl text-lg">
              Get the tech you love for less. Certified pre-owned and fully refurbished devices.
            </p>
          </div>
          <Link href="/category/smartphones">
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
                'px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border',
                activeFilter === filter
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
              )}
            >
              {filter}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeFilter}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
