"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/contexts/auth-context"
import { useUserStore } from "@/lib/store/user"
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  Eye,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store/cart"
import { toast } from "sonner"
import { AuthGuard } from "@/components/auth-guard"
import { cn, resolveImageUrl } from "@/lib/utils"

export default function WishlistPage() {
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
        const productPromises = wishlistIds.map(id => getDoc(doc(db, "products", id)))
        const docs = await Promise.all(productPromises)
        
        const products = docs
          .filter(d => d.exists())
          .map(d => {
            const data = d.data()
            return {
              id: d.id,
              name: data.name || "Unknown Product",
              category: data.brand || "Uncategorized", // Can use brand or categoryId
              price: data.discountPrice || data.price || 0,
              originalPrice: data.discountPrice ? data.price : null,
              rating: data.rating || 0,
              reviews: data.numReviews || 0,
              badge: data.isNewArrival ? "New" : data.discountPrice ? "Sale" : null,
              color: "bg-secondary",
              inStock: data.stockQuantity > 0,
              stockQuantity: data.stockQuantity,
              image: resolveImageUrl(data.imageUrls?.[0]),
              imageAlt: data.imageAlts?.[0] || data.name || "Product",
              slug: data.slug,
            }
          })
          
        setItems(products)
      } catch (error) {
        console.error("Error fetching wishlist:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWishlist()
  }, [user, userData?.wishlist]) // Re-fetch if wishlist array changes

  const removeItem = async (productId: string) => {
    if (!user || !userData) return
    
    setRemovingProduct(productId)
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        wishlist: arrayRemove(productId)
      })
      
      const updatedWishlist = (userData.wishlist || []).filter(id => id !== productId)
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
      window.location.href = `/product/${item.slug}`
      return
    }

    setAddingProduct(item.id)
    
    // Simulate short network delay for satisfying visual feedback
    await new Promise(resolve => setTimeout(resolve, 600))
    
    addItem({
      id: item.id,
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
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
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
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                My Wishlist
              </h1>
              <p className="mt-2 text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-12 w-12 text-muted-foreground" />
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-secondary p-4 sm:p-6 overflow-hidden flex items-center justify-center">
                    <Link href={`/product/${item.slug}`}>
                      <div className="w-full h-full relative flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                        {item.image ? (
                          <img src={item.image} alt={item.imageAlt} className="object-contain max-h-full max-w-full mix-blend-multiply" />
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
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100 disabled:opacity-50"
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
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">
                      {item.category}
                    </p>
                    <Link href={`/product/${item.slug}`}>
                      <h3 className="font-semibold text-foreground mt-1 transition-colors duration-200 group-hover:text-primary line-clamp-1">
                        {item.name}
                      </h3>
                    </Link>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3.5 w-3.5",
                              i < Math.floor(item.rating)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-muted text-muted"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({item.reviews})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-lg font-bold text-foreground">
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
                      className="w-full mt-4 transition-all duration-200 hover:scale-[1.02]"
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