"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import { useUserStore } from "@/lib/store/user"
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  Loader2,
} from "lucide-react"
import { ProductGridSkeleton } from "@/components/ui/product-grid-skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store/cart"
import { toast } from "sonner"
import { AuthGuard } from "@/components/auth-guard"
import { cn, resolveImageUrl } from "@/lib/utils"

export default function WishlistPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { userData, setUserData } = useUserStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addingProduct, setAddingProduct] = useState<string | null>(null)
  const [removingProduct, setRemovingProduct] = useState<string | null>(null)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user || !userData) return
      
      const wishlistIds = userData.wishlist || []
      
      if (wishlistIds.length === 0) {
        setItems([])
        setLoading(false)
        return
      }

      try {
        // We might have duplicate productIds if a user wishlisted multiple colors of the same product.
        // Or we might just have one. Let's parse the ids.
        const parsedIds = wishlistIds.map(id => {
          const [productId, colorName] = id.split('::');
          return { originalId: id, productId, colorName };
        });
        
        const response = await fetch('/api/catalog?resource=products')
        if (!response.ok) throw new Error('Unable to load products')
        const catalog = await response.json() as any[]
        const productsById = new Map(catalog.map(product => [product.id, product]));
        
        const products = parsedIds
          .map(({ originalId, productId, colorName }) => {
            const data = productsById.get(productId);
            if (!data) return null;
            
            let finalImage = resolveImageUrl(data.imageUrls?.[0]);
            if (colorName && data.colors) {
              const colorObj = data.colors.find((c: any) => c.name === colorName);
              if (colorObj && colorObj.imageUrls && colorObj.imageUrls.length > 0) {
                finalImage = resolveImageUrl(colorObj.imageUrls[0]);
              }
            }
            
            return {
              id: originalId, // Store the exact string to allow remove by exact string
              baseProductId: data.id,
              name: colorName ? `${data.name} (${colorName})` : data.name || "Unknown Product",
              category: data.brand || "Uncategorized", // Can use brand or categoryId
              price: data.discountPrice || data.price || 0,
              originalPrice: data.discountPrice ? data.price : null,
              rating: data.rating || 0,
              reviews: data.numReviews || 0,
              badge: data.isNewArrival ? "New" : data.discountPrice ? "Sale" : null,
              color: "bg-secondary",
              inStock: data.stockQuantity > 0,
              stockQuantity: data.stockQuantity,
              image: finalImage,
              imageAlt: data.imageAlts?.[0] || data.name || "Product",
              slug: data.slug,
              colors: data.colors,
              variantGroups: data.variantGroups,
            }
          })
          .filter(Boolean)
          
        setItems(products)
      } catch (error) {
        console.error("Error fetching wishlist:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWishlist()
  }, [user, userData, userData?.wishlist]) // Re-fetch if wishlist array changes

  const removeItem = async (productId: string) => {
    if (!user || !userData) return
    
    setRemovingProduct(productId)
    try {
      const updatedWishlist = (userData.wishlist || []).filter(id => id !== productId)
      const response = await fetch('/api/me/wishlist', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wishlist: updatedWishlist }) })
      if (!response.ok) throw new Error('Unable to update wishlist')
      setUserData({
        ...(userData as any),
        wishlist: updatedWishlist
      })
      
      setItems(prev => prev.filter(item => item.id !== productId))
      toast.success("Removed from wishlist")
    } catch (error) {
      console.error("Failed to remove item:", error)
      toast.error("Failed to remove item from wishlist")
    } finally {
      setRemovingProduct(null)
    }
  }

  const handleAddToCart = async (item: any) => {
    if ((item.colors && item.colors.length > 0) || (item.variantGroups && item.variantGroups.length > 0)) {
      toast.info("Please select options for this product")
      router.push(`/product/${item.slug}`)
      return
    }

    setAddingProduct(item.id)
    
    // Simulate short network delay for satisfying visual feedback
    await new Promise(resolve => setTimeout(resolve, 600))
    
    addItem({
      id: item.baseProductId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      stockQuantity: item.stockQuantity,
      slug: item.slug,
      categoryId: item.category
    })
    
    toast.success(`${item.name} added to cart`, {
      description: "You can view your cart or continue shopping.",
    })
    setAddingProduct(null)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
      <div className="pt-10 lg:pt-16 pb-20">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
          {/* Header */}
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">
                Wishlist
              </h1>
              <p className="mt-2 text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <Heart className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Save your favorite products to your wishlist and come back to
                them anytime.
              </p>
              <Button asChild size="lg">
                <Link href="/#products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group min-w-0 transition-transform duration-[220ms] hover:-translate-y-[3px]"
                >
                  {/* Image */}
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#F5F6F8] p-4 transition-shadow duration-[220ms] group-hover:shadow-[0_12px_30px_rgba(17,24,39,0.07)] sm:p-6">
                    <Link href={`/product/${item.slug}`}>
                      <div className="relative flex h-full w-full items-center justify-center transition-transform duration-[220ms] group-hover:scale-[1.025]">
                        {item.image ? (
                          <Image src={item.image} alt={item.imageAlt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-contain" />
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-foreground/5 rounded-2xl transition-transform duration-300 group-hover:rotate-3" />
                        )}
                      </div>
                    </Link>

                    {/* Badge */}
                    {item.badge && (
                      <Badge
                        className={cn(
                          "absolute top-4 left-4",
                          item.badge === "Sale" &&
                            "bg-destructive text-destructive-foreground",
                          item.badge === "New" &&
                            "bg-primary text-primary-foreground"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={removingProduct === item.id}
                      className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/95 text-muted-foreground transition-colors duration-200 hover:text-destructive disabled:opacity-50"
                      aria-label={`Remove ${item.name} from wishlist`}
                    >
                      {removingProduct === item.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>

                    {!item.inStock && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <Badge
                          variant="secondary"
                          className="w-full justify-center"
                        >
                          Out of Stock
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="pt-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {item.category}
                    </p>
                    <Link href={`/product/${item.slug}`}>
                      <h3 className="mt-1.5 min-h-11 text-[16px] font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary line-clamp-2">
                        {item.name}
                      </h3>
                    </Link>

                    {/* Rating */}
                    {item.reviews > 0 && <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{item.rating} ({item.reviews})</div>}

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-lg font-semibold text-foreground">
                        ${item.price.toLocaleString()}
                      </span>
                      {item.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${item.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart */}
                    <Button
                      onClick={() => handleAddToCart(item)}
                      className="mt-4 w-full rounded-[10px] transition-colors duration-200"
                      size="sm"
                      disabled={!item.inStock || addingProduct === item.id}
                    >
                      {addingProduct === item.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 mr-2" />
                      )}
                      {addingProduct === item.id ? 'Adding...' : item.inStock ? "Add to Cart" : "Out of Stock"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
