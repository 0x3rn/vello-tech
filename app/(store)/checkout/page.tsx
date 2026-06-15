"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Shield,
  Truck,
  CreditCard,
  CheckCircle,
  User,
  Mail,
  MapPin,
  Phone,
  Lock,
  ChevronRight,
  Package,
  Minus,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCartStore } from "@/lib/store/cart"
import { toast } from "sonner"

type CheckoutStep = "login" | "shipping" | "payment" | "review"

export default function CheckoutPage() {
  const { items: cartItems } = useCartStore()
  const [step, setStep] = useState<CheckoutStep>("shipping")
  const [checkoutType, setCheckoutType] = useState<"guest" | "login">("guest")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [phone, setPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "lemonsqueezy">("paystack")
  const [processing, setProcessing] = useState(false)

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const shipping = subtotal > 99 ? 0 : 9.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  const steps = [
    { id: "shipping" as const, label: "Shipping" },
    { id: "payment" as const, label: "Payment" },
    { id: "review" as const, label: "Review" },
  ]

  const { user } = useAuth()

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please log in to complete your order")
      return
    }
    
    setProcessing(true)
    
    try {
      const endpoint = paymentMethod === "paystack" 
        ? "/api/checkout/paystack" 
        : "/api/checkout/lemonsqueezy"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email || email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize checkout")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during checkout")
      setProcessing(false)
    }
  }

  const renderLoginChoice = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setCheckoutType("guest")}
          className={cn(
            "p-6 rounded-2xl text-left transition-all duration-200",
            checkoutType === "guest"
              ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
              : "bg-secondary text-foreground hover:bg-secondary/80"
          )}
        >
          <User className="h-8 w-8 mb-3" />
          <h3 className="font-semibold text-lg mb-1">Guest Checkout</h3>
          <p className="text-sm opacity-80">Quick checkout without creating an account</p>
        </button>
        <button
          onClick={() => setCheckoutType("login")}
          className={cn(
            "p-6 rounded-2xl text-left transition-all duration-200",
            checkoutType === "login"
              ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
              : "bg-secondary text-foreground hover:bg-secondary/80"
          )}
        >
          <Lock className="h-8 w-8 mb-3" />
          <h3 className="font-semibold text-lg mb-1">Sign In</h3>
          <p className="text-sm opacity-80">Access your saved addresses and order history</p>
        </button>
      </div>

      {checkoutType === "login" && (
        <div className="space-y-4 p-6 bg-secondary/50 rounded-2xl">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" />
            </div>
          </div>
          <Button className="w-full">Sign In & Continue</Button>
        </div>
      )}
    </div>
  )

  const renderShippingForm = () => (
    <div className="space-y-4">
      {step === "shipping" && renderLoginChoice()}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">First Name</label>
          <Input placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Last Name</label>
          <Input placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Address</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="123 Main Street" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">City</label>
          <Input placeholder="San Francisco" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">ZIP Code</label>
          <Input placeholder="94105" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Phone</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
        </div>
      </div>
    </div>
  )

  const renderPaymentForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4">
        <button
          onClick={() => setPaymentMethod("paystack")}
          className={cn(
            "flex items-center gap-4 p-4 rounded-xl text-left border-2 transition-all",
            paymentMethod === "paystack"
              ? "border-primary bg-primary/5"
              : "border-border/50 hover:border-primary/50"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
            paymentMethod === "paystack" ? "border-primary" : "border-muted-foreground"
          )}>
            {paymentMethod === "paystack" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
          </div>
          <div>
            <h4 className="font-medium text-foreground">Credit Card / Local Bank</h4>
            <p className="text-sm text-muted-foreground">Processed securely via Paystack</p>
          </div>
        </button>

        <button
          onClick={() => setPaymentMethod("lemonsqueezy")}
          className={cn(
            "flex items-center gap-4 p-4 rounded-xl text-left border-2 transition-all",
            paymentMethod === "lemonsqueezy"
              ? "border-primary bg-primary/5"
              : "border-border/50 hover:border-primary/50"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
            paymentMethod === "lemonsqueezy" ? "border-primary" : "border-muted-foreground"
          )}>
            {paymentMethod === "lemonsqueezy" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
          </div>
          <div>
            <h4 className="font-medium text-foreground">Global Payments</h4>
            <p className="text-sm text-muted-foreground">Processed securely via Lemon Squeezy</p>
          </div>
        </button>
      </div>
      <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl mt-6">
        <Shield className="h-5 w-5 text-accent flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          You will be redirected to the secure payment portal after clicking Place Order.
        </p>
      </div>
    </div>
  )

  const renderReview = () => (
    <div className="space-y-6">
      <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Shipping Address
        </div>
        <p className="text-sm text-muted-foreground pl-6">
          {firstName} {lastName}<br />
          {address}<br />
          {city}, {zipCode}
        </p>
      </div>
      <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          Payment Method
        </div>
        <p className="text-sm text-muted-foreground pl-6">
          {paymentMethod === "paystack" ? "Credit Card / Local Bank" : "Global Payments"}
        </p>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Order Items</h4>
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
            </div>
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              ${(item.price * item.quantity).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const currentStepContent = () => {
    switch (step) {
      case "shipping": return renderShippingForm()
      case "payment": return renderPaymentForm()
      case "review": return renderReview()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16 pb-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>

          <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-8">Checkout</h1>

          {/* Steps Progress */}
          <div className="flex items-center gap-2 sm:gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 sm:gap-4 shrink-0">
                <button
                  onClick={() => {
                    if (steps.findIndex(x => x.id === s.id) <= steps.findIndex(x => x.id === step)) return
                    setStep(s.id)
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    step === s.id
                      ? "bg-primary text-primary-foreground"
                      : steps.findIndex(x => x.id === s.id) < steps.findIndex(x => x.id === step)
                      ? "bg-accent/10 text-accent"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <span className={cn(
                    "w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                    step === s.id ? "bg-primary-foreground text-primary" : steps.findIndex(x => x.id === s.id) < steps.findIndex(x => x.id === step) ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {steps.findIndex(x => x.id === s.id) < steps.findIndex(x => x.id === step) ? <CheckCircle className="h-4 w-4" /> : i + 1}
                  </span>
                  {s.label}
                </button>
                {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl p-6 lg:p-8 border border-border/50 shadow-sm">
                {currentStepContent()}
              </div>
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-6">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (step === "shipping") window.location.href = "/cart"
                    else if (step === "payment") setStep("shipping")
                    else setStep("payment")
                  }}
                >
                  Back
                </Button>
                {step === "review" ? (
                  <Button
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={processing}
                    className="w-full sm:w-auto transition-all duration-200 hover:scale-105"
                  >
                    {processing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Place Order · ${total.toLocaleString()}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => {
                      if (step === "shipping") setStep("payment")
                      else setStep("review")
                    }}
                    className="w-full sm:w-auto transition-all duration-200 hover:scale-105"
                  >
                    Continue to {step === "shipping" ? "Payment" : "Review"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm sticky top-24">
                <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm text-foreground">${item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? <span className="text-accent">Free</span> : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between text-foreground">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold">${total.toLocaleString()}</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="h-3.5 w-3.5 text-accent" />
                    Free shipping on orders over $99
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-accent" />
                    Secure & encrypted checkout
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}