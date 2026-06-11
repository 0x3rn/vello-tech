"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const wishlistItems = [
  {
    id: 1,
    name: "ProMax Smartphone X1",
    category: "Smartphones",
    price: 1299,
    originalPrice: 1499,
    rating: 4.9,
    reviews: 234,
    badge: "New",
    color: "bg-blue-500/10",
    inStock: true,
  },
  {
    id: 3,
    name: "SoundWave Elite ANC",
    category: "Audio",
    price: 349,
    originalPrice: 449,
    rating: 4.7,
    reviews: 423,
    badge: "Sale",
    color: "bg-orange-500/10",
    inStock: true,
  },
  {
    id: 4,
    name: "SmartWatch Series 8",
    category: "Wearables",
    price: 499,
    originalPrice: null,
    rating: 4.9,
    reviews: 312,
    badge: null,
    color: "bg-teal-500/10",
    inStock: true,
  },
  {
    id: 8,
    name: "TabletPro 12.9\"",
    category: "Tablets",
    price: 1099,
    originalPrice: null,
    rating: 4.9,
    reviews: 234,
    badge: "New",
    color: "bg-indigo-500/10",
    inStock: false,
  },
]

export default function WishlistPage() {
  const [items, setItems] = useState(wishlistItems)

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16 pb-20">
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
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                My Wishlist
              </h1>
              <p className="mt-2 text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>

          {items.length === 0 ? (
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
                  <div className="relative aspect-square bg-secondary p-4 sm:p-6 overflow-hidden">
                    <Link href={`/products/${item.id}`}>
                      <div
                        className={cn(
                          "w-full h-full rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                          item.color
                        )}
                      >
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-foreground/5 rounded-2xl transition-transform duration-300 group-hover:rotate-3" />
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
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-5 w-5" />
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
                    <Link href={`/products/${item.id}`}>
                      <h3 className="font-semibold text-foreground mt-1 transition-colors duration-200 group-hover:text-primary">
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
                      className="w-full mt-4 transition-all duration-200 hover:scale-[1.02]"
                      size="sm"
                      disabled={!item.inStock}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {item.inStock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}