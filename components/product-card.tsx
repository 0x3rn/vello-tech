'use client'

import { useState, type MouseEvent } from 'react'
import { Heart, Loader2, ShoppingCart, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWishlist } from '@/lib/hooks/use-wishlist'
import { useCartStore } from '@/lib/store/cart'
import { cn, resolveImageUrl } from '@/lib/utils'

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
  subcategoryId?: string
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

const BLUR_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mO88OjRfwwAI6wDeamL1nAAAAAASUVORK5CYII='

export function ProductCard({ product, priority = false }: { product: ProductData; priority?: boolean }) {
  const router = useRouter()
  const { toggleWishlist, loadingItems, wishlist } = useWishlist()
  const addItem = useCartStore((state) => state.addItem)
  const [isAdding, setIsAdding] = useState(false)
  const isLiked = wishlist.some((id) => id === product.id || id.startsWith(`${product.id}::`))
  const salePrice = product.discountPrice !== null && product.discountPrice < product.price ? product.discountPrice : null
  const href = `/product/${product.slug}`

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (isAdding || product.stockQuantity <= 0) return
    if (product.colors?.length || product.variantGroups?.length) {
      toast.info('Choose your options before adding this product')
      router.push(href)
      return
    }
    setIsAdding(true)
    try {
      addItem({
        id: product.id,
        name: product.name,
        price: salePrice ?? product.price,
        image: resolveImageUrl(product.imageUrls?.[0]),
        quantity: 1,
        stockQuantity: product.stockQuantity,
        slug: product.slug,
        categoryId: product.categoryId,
      })
      toast.success(`${product.name} added to cart`)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="group min-w-0 transition-transform duration-[220ms] ease-out hover:-translate-y-[3px]">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#F5F6F8] transition-shadow duration-[220ms] ease-out group-hover:shadow-[0_12px_30px_rgba(17,24,39,0.07)]">
        <Link href={href} aria-label={`View ${product.name}`} className="absolute inset-0 block">
          <Image
            src={resolveImageUrl(product.imageUrls?.[0])}
            alt={product.imageAlts?.[0] || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-contain p-[9%] transition-transform duration-[220ms] ease-out group-hover:scale-[1.025]"
          />
        </Link>
        {product.badge ? (
          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#111214]">{product.badge}</span>
        ) : salePrice !== null && product.price > 0 ? (
          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#111214]">{Math.round((1 - salePrice / product.price) * 100)}% off</span>
        ) : null}
        <button
          type="button"
          onClick={(event) => toggleWishlist(event, product.id)}
          disabled={loadingItems[product.id]}
          aria-label={isLiked ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isLiked}
          className={cn(
            'absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/95 text-[#656A73] transition-[opacity,color] duration-[220ms] hover:text-primary focus-visible:outline-2 focus-visible:outline-primary lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100',
            isLiked && 'text-primary lg:opacity-100',
          )}
        >
          {loadingItems[product.id] ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Heart className={cn('h-[18px] w-[18px]', isLiked && 'fill-current')} />}
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stockQuantity <= 0 || isAdding}
          aria-label={product.stockQuantity <= 0 ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary text-white transition-[opacity,transform,background-color] duration-[220ms] ease-out hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 lg:bottom-4 lg:left-4 lg:right-4 lg:h-11 lg:w-auto lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100"
        >
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
          <span className="ml-2 hidden text-sm font-semibold lg:inline">{product.stockQuantity <= 0 ? 'Out of stock' : 'Add to cart'}</span>
        </button>
      </div>
      <div className="pt-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#656A73]">{product.brand}</p>
        <Link href={href} className="mt-1.5 block min-h-11 text-[16px] font-semibold leading-snug text-[#111214] line-clamp-2 hover:text-primary">{product.name}</Link>
        {product.numReviews > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#656A73]" aria-label={`${product.rating} out of 5 stars from ${product.numReviews} reviews`}>
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-[#35383D]">{product.rating}</span>
            <span>({product.numReviews})</span>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-[#111214]">${(salePrice ?? product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          {salePrice !== null && <span className="text-sm text-[#8A8F98] line-through">${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>}
        </div>
      </div>
    </article>
  )
}
