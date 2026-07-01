"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ShoppingCart,
  Shield,
  Truck,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/lib/store/cart"
import { useAuth } from "@/lib/contexts/auth-context"
import { resolveImageUrl } from "@/lib/utils"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCartStore()
  const { user } = useAuth()
  const router = useRouter()
  const [promoCode, setPromoCode] = useState("")
  
  const [taxRate, setTaxRate] = useState<{ percentage: number | null, amount: number | null } | null>(null)
  const [shippingRate, setShippingRate] = useState<number | null>(null)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | null>(null)
  const [fetchingRates, setFetchingRates] = useState(false)
  const [hasDefaultAddress, setHasDefaultAddress] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchThreshold = async () => {
      try {
        const docRef = doc(db, "settings", "shipping")
        const snap = await getDoc(docRef)
        if (snap.exists() && typeof snap.data().threshold === 'number') {
          setFreeShippingThreshold(snap.data().threshold)
        }
      } catch (e) {}
    }
    fetchThreshold()
  }, [])

  useEffect(() => {
    const fetchDefaultAddressRates = async () => {
      if (!user) {
        setHasDefaultAddress(false)
        return
      }
      
      setFetchingRates(true)
      try {
        const q = query(collection(db, "users", user.uid, "addresses"), where("isDefault", "==", true))
        const snapshot = await getDocs(q)
        
        if (!snapshot.empty) {
          const address = snapshot.docs[0].data()
          setHasDefaultAddress(true)
          
          if (address.country && address.state) {
            const docId = `${address.country}_${address.state}`
            const taxSnap = await getDoc(doc(db, "taxRates", docId))
            const shipSnap = await getDoc(doc(db, "shippingRates", docId))
            
            if (taxSnap.exists()) {
              const td = taxSnap.data()
              setTaxRate({
                percentage: typeof td.percentage === 'number' ? td.percentage : null,
                amount: typeof td.amount === 'number' ? td.amount : null
              })
            } else {
              setTaxRate(null)
            }
            
            if (shipSnap.exists() && typeof shipSnap.data().amount === 'number') {
              setShippingRate(shipSnap.data().amount)
            } else {
              setShippingRate(null)
            }
          }
        } else {
          setHasDefaultAddress(false)
        }
      } catch (e) {
        console.error("Failed to fetch address rates", e)
      } finally {
        setFetchingRates(false)
      }
    }
    
    fetchDefaultAddressRates()
  }, [user])

  const subtotal = totalPrice()
  const discount = promoCode === "TECH20" ? subtotal * 0.2 : 0
  
  let shipping = 0
  let tax = 0
  const isShippingBlocked = shippingRate === null
  const isTaxBlocked = taxRate !== null && taxRate.percentage === null && taxRate.amount === null
  const isRegionSupported = !isShippingBlocked && !isTaxBlocked
  
  if (hasDefaultAddress && isRegionSupported) {
    if (freeShippingThreshold !== null && subtotal > freeShippingThreshold) {
      shipping = 0
    } else {
      shipping = shippingRate as number
    }
    
    if (taxRate && taxRate.percentage !== null) {
      tax += subtotal * (taxRate.percentage / 100)
    }
    if (taxRate && taxRate.amount !== null) {
      tax += taxRate.amount
    }
  }

  const total = subtotal + shipping - discount + tax

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-10 lg:pt-16 pb-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="h-4 w-32 bg-secondary rounded animate-pulse mb-4"></div>
                <div className="h-8 w-48 bg-secondary rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-secondary rounded animate-pulse"></div>
              </div>
            </div>
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
              <div className="lg:col-span-7 space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-card border border-border animate-pulse">
                    <div className="w-full sm:w-32 h-32 bg-secondary rounded-xl"></div>
                    <div className="flex-1 space-y-4">
                      <div className="h-5 w-3/4 bg-secondary rounded"></div>
                      <div className="h-4 w-1/2 bg-secondary rounded"></div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="h-8 w-24 bg-secondary rounded"></div>
                        <div className="h-6 w-16 bg-secondary rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 lg:mt-0 lg:col-span-5">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse">
                  <div className="h-6 w-1/2 bg-secondary rounded mb-6"></div>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between"><div className="h-4 w-16 bg-secondary rounded"></div><div className="h-4 w-12 bg-secondary rounded"></div></div>
                    <div className="flex justify-between"><div className="h-4 w-20 bg-secondary rounded"></div><div className="h-4 w-12 bg-secondary rounded"></div></div>
                    <div className="flex justify-between"><div className="h-4 w-12 bg-secondary rounded"></div><div className="h-4 w-12 bg-secondary rounded"></div></div>
                  </div>
                  <div className="h-px bg-border my-6"></div>
                  <div className="flex justify-between mb-6"><div className="h-6 w-16 bg-secondary rounded"></div><div className="h-6 w-20 bg-secondary rounded"></div></div>
                  <div className="h-12 w-full bg-secondary rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-10 lg:pt-16 pb-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                Shopping Cart
              </h1>
              <p className="mt-2 text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} in your cart
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 bg-secondary/10 rounded-2xl border border-border">
              <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Your cart is empty
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Looks like you haven&apos;t added any products to your cart yet.
                Browse our collection and find something you love.
              </p>
              <Button asChild size="lg">
                <Link href="/#categories">Browse Categories</Link>
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.cartItemId || item.id}
                    className="bg-card border border-border rounded-xl p-4 sm:p-5 flex gap-4 transition-all duration-200 hover:shadow-md"
                  >
                    {/* Product Image */}
                    <Link href={`/product/${item.slug}`} className="block relative w-20 h-20 sm:w-24 sm:h-24 lg:w-24 lg:h-24 rounded-lg flex-shrink-0 flex items-center justify-center bg-secondary/30 border border-border overflow-hidden group">
                      <Image
                        src={resolveImageUrl(item.selectedColor?.imageUrls?.[0] || item.image)}
                        alt={item.name}
                        fill
                        sizes="96px"
                        className="object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link href={`/product/${item.slug}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                            {item.name}
                          </Link>
                          {item.selectedColor && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Color: {item.selectedColor.name}
                            </p>
                          )}
                          {item.selectedVariants && item.selectedVariants.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.selectedVariants.map(v => `${v.groupName}: ${v.choiceName}`).join(' | ')}
                            </p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-foreground whitespace-nowrap">
                          ${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-200"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-10 text-center font-medium text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId || item.id, Math.min(item.stockQuantity, item.quantity + 1))}
                            disabled={item.quantity >= item.stockQuantity}
                            className={`w-8 h-8 rounded-lg border border-border flex items-center justify-center transition-all duration-200 ${
                              item.quantity >= item.stockQuantity 
                                ? 'opacity-50 cursor-not-allowed text-muted-foreground' 
                                : 'text-muted-foreground hover:text-foreground hover:border-primary'
                            }`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.cartItemId || item.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
                  <h2 className="text-xl font-bold text-foreground mb-6">
                    Order Summary
                  </h2>

                  {/* Promo Code */}
                  <div className="flex gap-2 mb-6">
                    <Input
                      type="text"
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" className="shrink-0">
                      Apply
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span>
                        {!hasDefaultAddress ? (
                          <span className="text-xs text-muted-foreground italic">(calculated at checkout)</span>
                        ) : fetchingRates ? (
                          <span className="animate-pulse">...</span>
                        ) : !isRegionSupported ? (
                          <span className="text-destructive font-medium text-xs">Not Supported</span>
                        ) : shipping === 0 ? (
                          <span className="text-accent font-medium">Free</span>
                        ) : (
                          `$${shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    
                    {/* Add Tax Row */}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax</span>
                      <span>
                        {!hasDefaultAddress ? (
                          <span className="text-xs text-muted-foreground italic">(calculated at checkout)</span>
                        ) : fetchingRates ? (
                          <span className="animate-pulse">...</span>
                        ) : !isRegionSupported ? (
                          <span className="text-destructive font-medium text-xs">Not Supported</span>
                        ) : (
                          `$${tax.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-accent">
                        <span>Discount (20%)</span>
                        <span>-${discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between text-foreground mb-6">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold">
                      ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <Link 
                    href="/checkout"
                    onClick={(e) => {
                      if (user && !user.isAnonymous && !user.emailVerified) {
                        e.preventDefault()
                        toast.error("Action restricted: Please verify your email address using the link we sent you before proceeding to checkout.")
                      }
                    }}
                  >
                    <Button className="w-full h-12 text-base transition-all duration-200 hover:scale-[1.02]">
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  {/* Trust Badges */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4 text-accent" />
                      Secure Checkout
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Truck className="h-4 w-4 text-accent" />
                      {freeShippingThreshold !== null && subtotal > freeShippingThreshold
                        ? "Free Shipping Applied!"
                        : freeShippingThreshold !== null
                        ? `$${(freeShippingThreshold - subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })} away from free shipping`
                        : "Fast & Reliable Shipping"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}