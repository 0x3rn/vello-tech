"use client"

import Link from "next/link"
import {
  CheckCircle,
  Package,
  ArrowRight,
  ArrowLeft,
  Download,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const orderDetails = {
  id: "VT-2026-NEW",
  date: new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  total: 1548.00,
  items: [
    { name: "ProMax Smartphone X1", quantity: 1, price: 1299 },
    { name: "WirelessBuds Pro", quantity: 2, price: 498 },
  ],
  shipping: { name: "John Doe", address: "123 Main Street, San Francisco, CA 94105", method: "Express (2-3 business days)" },
  payment: { method: "Credit Card", last4: "3456" },
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6 animate-[fade-in-up_0.5s_ease-out]">
            <CheckCircle className="h-12 w-12 text-accent" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground text-lg">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 lg:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-xl font-bold text-foreground">{orderDetails.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium text-foreground">{orderDetails.date}</p>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Items */}
          <div className="space-y-3 mb-6">
            {orderDetails.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-medium text-foreground">${item.price.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <Separator className="mb-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${orderDetails.items.reduce((s, i) => s + i.price, 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="text-accent">Free</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>${(orderDetails.total - orderDetails.items.reduce((s, i) => s + i.price, 0)).toLocaleString()}</span>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="flex justify-between">
            <span className="font-bold text-foreground text-lg">Total</span>
            <span className="text-2xl font-bold text-foreground">${orderDetails.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Shipping & Payment Info */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
            <h3 className="font-semibold text-foreground mb-3">Shipping Address</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{orderDetails.shipping.name}<br />{orderDetails.shipping.address}</p>
            <p className="text-xs text-muted-foreground mt-2">{orderDetails.shipping.method}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
            <h3 className="font-semibold text-foreground mb-3">Payment Method</h3>
            <p className="text-sm text-muted-foreground">{orderDetails.payment.method} ····{orderDetails.payment.last4}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              Confirmation sent to your email
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/account/orders">
            <Button size="lg" className="transition-all duration-200 hover:scale-105 w-full sm:w-auto">
              <Package className="h-4 w-4 mr-2" />
              Track Your Order
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/#products">
            <Button variant="outline" size="lg" className="transition-all duration-200 hover:scale-105 w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}