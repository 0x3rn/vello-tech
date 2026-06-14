"use client"

import { useState } from "react"
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

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCartStore()
  const router = useRouter()
  const [promoCode, setPromoCode] = useState("")

  const subtotal = totalPrice()
  const shipping = subtotal > 99 ? 0 : 9.99
  const discount = promoCode === "TECH20" ? subtotal * 0.2 : 0
  const total = subtotal + shipping - discount

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
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
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
                    key={item.id}
                    className="bg-card border border-border rounded-xl p-4 sm:p-5 flex gap-4 transition-all duration-200 hover:shadow-md"
                  >
                    {/* Product Image */}
                    <Link href={`/product/${item.slug}`} className="block relative w-20 h-20 sm:w-24 sm:h-24 lg:w-24 lg:h-24 rounded-lg flex-shrink-0 flex items-center justify-center bg-secondary/30 border border-border overflow-hidden group">
                      <Image
                        src={item.image || 'https://via.placeholder.com/500x500.png'}
                        alt={item.name}
                        fill
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
                        </div>
                        <p className="text-lg font-bold text-foreground whitespace-nowrap">
                          ${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-200"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-10 text-center font-medium text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-200"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
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
                        {shipping === 0 ? (
                          <span className="text-accent font-medium">Free</span>
                        ) : (
                          `$${shipping.toFixed(2)}`
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

                  <Link href="/checkout">
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
                      {shipping === 0
                        ? "Free Shipping"
                        : `$${(99 - subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })} away from free shipping`}
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