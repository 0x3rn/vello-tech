'use client'

import { useState } from 'react'
import { Star, Heart, ShoppingCart, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, resolveImageUrl } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import { useWishlist } from '@/lib/hooks/use-wishlist'
import { toast } from 'sonner'

export interface ProductData {
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
  imageAlts?: string[]
  colors?: { name: string; hex: string; priceModifier?: number; stockQuantity: number; imageUrls?: string[] }[]
  variantGroups?: { groupName: string; choices: { choiceName: string; priceModifier: number; stockQuantity: number }[] }[]
}

const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mO88OjRfwwAI6wDeamL1nAAAAAASUVORK5CYII="

export function ProductCard({ 
  product,
  priority = false
}: { 
  product: ProductData
  priority?: boolean 
}) {
  const { toggleWishlist, loadingItems, wishlist } = useWishlist()
  const isLiked = wishlist.includes(product.id)
  const isWishlistLoading = loadingItems[product.id]
  const [isHovered, setIsHovered] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if ((product.colors && product.colors.length > 0) || (product.variantGroups && product.variantGroups.length > 0)) {
      toast.info("Please select options for this product")
      window.location.href = `/product/${product.slug}`
      return
    }
    
    setIsAdding(true)
    
    // Simulate short network delay for satisfying visual feedback
    await new Promise(resolve => setTimeout(resolve, 600))
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      image: resolveImageUrl(product.imageUrls?.[0]),
      quantity: 1,
      stockQuantity: product.stockQuantity,
      slug: product.slug,
      categoryId: product.categoryId,
    })
    
    toast.success(`${product.name} added to cart`, {
      description: "You can view your cart or continue shopping.",
    })
    setIsAdding(false)
  }

  return (
    <div 
      className="group bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-square p-6 overflow-hidden bg-secondary/30 flex items-center justify-center">
          <Image
            src={resolveImageUrl(product.imageUrls?.[0])}
            alt={product.imageAlts?.[0] || product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            priority={priority}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Action buttons */}
          <div className={cn(
            'absolute top-4 right-4 flex flex-col gap-3 transition-all duration-500 ease-out z-10',
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          )}>
            <button
              onClick={(e) => toggleWishlist(e, product.id)}
              disabled={isWishlistLoading}
              className={cn(
                'w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border shadow-sm transition-colors duration-300 hover:bg-secondary',
                isLiked && 'bg-destructive/10 border-destructive/20 text-destructive'
              )}
            >
              {isWishlistLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-foreground" />
              ) : (
                <Heart className={cn(
                  'h-5 w-5 transition-colors duration-300',
                  isLiked ? 'fill-destructive text-destructive' : 'text-foreground'
                )} />
              )}
            </button>
            <div 
              className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border shadow-sm transition-colors duration-300 hover:bg-secondary cursor-pointer"
            >
              <Eye className="h-5 w-5 text-foreground" />
            </div>
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
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4">
            <span className="text-lg font-bold text-foreground">
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
    </div>
  )
}
