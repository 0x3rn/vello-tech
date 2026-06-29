"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Country, State } from "country-state-city"
import { useRouter } from "next/navigation"
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
  Globe,
  Map as MapIcon,
  Loader2
} from "lucide-react"
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/contexts/auth-context"
import { useUserStore } from "@/lib/store/user"
import { toast } from "sonner"
import { signInAnonymously } from "firebase/auth"
import { auth, db } from "@/lib/firebase"

type CheckoutStep = "login" | "shipping" | "payment" | "review"

export default function DirectCheckoutPage() {
  const router = useRouter()
  const [directItem, setDirectItem] = useState<any>(null)
  
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
  const [country, setCountry] = useState("")
  const [stateCode, setStateCode] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "lemonsqueezy">("paystack")
  const [processing, setProcessing] = useState(false)

  const [countriesList, setCountriesList] = useState<any[]>([])
  const [statesList, setStatesList] = useState<any[]>([])
  const [taxRate, setTaxRate] = useState<{ percentage: number | null, amount: number | null } | null>(null)
  const [shippingRate, setShippingRate] = useState<number | null>(null)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | null>(null)
  const [fetchingRates, setFetchingRates] = useState(false)

  const { user } = useAuth()
  const { userData } = useUserStore()

  useEffect(() => {
    setCountriesList(Country.getAllCountries())
    
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
    if (country) {
      setStatesList(State.getStatesOfCountry(country))
      setStateCode("")
      setTaxRate(null)
      setShippingRate(null)
    } else {
      setStatesList([])
    }
  }, [country])

  useEffect(() => {
    const fetchRates = async () => {
      if (!country || !stateCode) {
        setTaxRate(null)
        setShippingRate(null)
        return
      }
      
      setFetchingRates(true)
      try {
        const docId = `${country}_${stateCode}`
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
      } catch (error) {
        console.error("Error fetching rates", error)
        toast.error("Error fetching regional rates")
      } finally {
        setFetchingRates(false)
      }
    }
    fetchRates()
  }, [country, stateCode])

  useEffect(() => {
    const storedItem = sessionStorage.getItem('directCheckoutItem')
    if (storedItem) {
      setDirectItem(JSON.parse(storedItem))
    } else {
      toast.error("No item selected for checkout")
      router.push("/")
    }
  }, [router])

  useEffect(() => {
    if (user) {
      if (user.email && !email) setEmail(user.email)
      if (userData) {
        if (userData.phoneNumber && !phone) setPhone(userData.phoneNumber)
      }

      const fetchDefaultAddress = async () => {
        if (!address) {
          try {
            const q = query(collection(db, "users", user.uid, "addresses"), where("isDefault", "==", true))
            const snap = await getDocs(q)
            if (!snap.empty) {
              const defAddr = snap.docs[0].data()
              if (!firstName && !lastName) {
                const parts = defAddr.name.split(" ")
                setFirstName(parts[0] || "")
                setLastName(parts.slice(1).join(" ") || "")
              }
              if (defAddr.street) setAddress(defAddr.street)
              if (defAddr.city) setCity(defAddr.city)
              if (defAddr.zip) setZip(defAddr.zip)
              if (defAddr.country) setCountry(defAddr.country)
              if (defAddr.state) setStateCode(defAddr.state)
            } else if (userData?.address && !address) {
              const parts = userData.address.split(",")
              setAddress(parts[0]?.trim() || "")
              if (parts.length > 1) {
                setCity(parts[1]?.trim() || "")
              }
            }
          } catch (e) {
            console.error("Failed to fetch address", e)
          }
        }
      }

      fetchDefaultAddress()
    }
  }, [user, userData, email, firstName, lastName, phone, address, city])

  if (!directItem) return null

  const subtotal = directItem.price * directItem.quantity
  
  let shipping = 0
  let tax = 0
  
  const isShippingBlocked = shippingRate === null
  const isTaxBlocked = taxRate !== null && taxRate.percentage === null && taxRate.amount === null
  const isRegionSupported = !!country && !!stateCode && !isShippingBlocked && !isTaxBlocked
  
  if (isRegionSupported) {
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

  const total = subtotal + shipping + tax

  const steps = [
    { id: "shipping" as const, label: "Shipping" },
    { id: "payment" as const, label: "Payment" },
    { id: "review" as const, label: "Review" },
  ]

  const handleGuestCheckout = async () => {
    try {
      const userCredential = await signInAnonymously(auth)
      const anonymousUser = userCredential.user

      await setDoc(doc(db, "users", anonymousUser.uid), {
        isAnonymous: true,
        createdAt: new Date().toISOString()
      }, { merge: true })

      setCheckoutType("guest")
      setStep("shipping")
    } catch (error: any) {
      console.error("Anonymous sign-in failed:", error)
      toast.error("Failed to initialize guest checkout. Please try again.")
    }
  }

  const handleContinue = async () => {
    if (step === "shipping") {
      if (!email || !firstName || !lastName || !address || !city || !zipCode || !phone || !country || !stateCode) {
        toast.error("Please fill out all shipping fields")
        return
      }

      if (!isRegionSupported) {
        toast.error("We currently do not offer shipping or tax support for this region.")
        return
      }

      if (user) {
        try {
          await updateDoc(doc(db, "users", user.uid), {
            name: `${firstName} ${lastName}`.trim(),
            email,
            address: `${address}, ${city}, ${zipCode}`,
            phoneNumber: phone,
          })
        } catch (error) {
          console.error("Error updating user info:", error)
        }
      }

      setStep("payment")
    } else if (step === "payment") {
      setStep("review")
    }
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please log in to complete your order")
      return
    }

    if (!user.isAnonymous && !user.emailVerified) {
      toast.error("Action restricted: Please verify your email address using the link we sent you before proceeding.")
      return
    }
    
    setProcessing(true)
    
    try {
      const endpoint = paymentMethod === "paystack" 
        ? "/api/checkout/paystack" 
        : "/api/checkout/lemonsqueezy"

      const idToken = await auth.currentUser?.getIdToken()

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email || email,
          directItem: directItem
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize checkout")
      }

      if (data.url) {
        sessionStorage.removeItem('directCheckoutItem')
        window.location.href = data.url
      }
    } catch (error: any) {
      toast.error("An error occurred during checkout. Please verify your details and try again.")
      setProcessing(false)
    }
  }

  const renderLoginChoice = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleGuestCheckout}
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
      {step === "shipping" && !user && renderLoginChoice()}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Country</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select 
              className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Select a country</option>
              {countriesList.map(c => (
                <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">State / Province</label>
          <div className="relative">
            <MapIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select 
              className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              disabled={!country || statesList.length === 0}
            >
              <option value="">{statesList.length === 0 && country ? "No states found" : "Select a state"}</option>
              {statesList.map(s => (
                <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
              ))}
            </select>
          </div>
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
          {city}, {stateCode} {zipCode}<br />
          {country}
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
        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{directItem.name}</p>
            {directItem.selectedColor && (
              <p className="text-xs text-muted-foreground mt-0.5">Color: {directItem.selectedColor.name}</p>
            )}
            {directItem.selectedVariants && directItem.selectedVariants.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {directItem.selectedVariants.map((v: any) => `${v.groupName}: ${v.choiceName}`).join(' | ')}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">Qty: {directItem.quantity}</p>
          </div>
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            ${(directItem.price * directItem.quantity).toLocaleString()}
          </span>
        </div>
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
            href={`/product/${directItem.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors duration-200 mb-6 bg-destructive/10 hover:bg-destructive/20 px-4 py-2 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel Checkout
          </Link>

          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight mb-8">Direct Checkout</h1>

          <div className="flex items-center gap-2 sm:gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 sm:gap-4 shrink-0">
                <button
                  onClick={() => {
                    if (steps.findIndex(x => x.id === s.id) >= steps.findIndex(x => x.id === step)) return
                    setStep(s.id)
                  }}
                  disabled={steps.findIndex(x => x.id === s.id) > steps.findIndex(x => x.id === step)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed",
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
                    if (step === "shipping") router.push(`/product/${directItem.slug}`)
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
                    onClick={handleContinue}
                    className="w-full sm:w-auto transition-all duration-200 hover:scale-105"
                  >
                    Continue to {step === "shipping" ? "Payment" : "Review"}
                    {fetchingRates && step === "shipping" && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    {!fetchingRates && <ChevronRight className="ml-2 h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm sticky top-24">
                <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{directItem.name}</p>
                      {directItem.selectedColor && (
                        <p className="text-xs text-muted-foreground mt-0.5">Color: {directItem.selectedColor.name}</p>
                      )}
                      {directItem.selectedVariants && directItem.selectedVariants.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {directItem.selectedVariants.map((v: any) => `${v.groupName}: ${v.choiceName}`).join(' | ')}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">Qty: {directItem.quantity}</p>
                    </div>
                    <span className="text-sm text-foreground">${directItem.price.toLocaleString()}</span>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>
                      {!country || !stateCode ? (
                        <span className="text-xs text-muted-foreground italic">(enter address)</span>
                      ) : fetchingRates ? (
                        <span className="animate-pulse">...</span>
                      ) : !isRegionSupported ? (
                        <span className="text-destructive font-medium">Not Supported</span>
                      ) : shipping === 0 ? (
                        <span className="text-accent">Free</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>
                      {!country || !stateCode ? (
                        <span className="text-xs text-muted-foreground italic">(enter address)</span>
                      ) : fetchingRates ? (
                        <span className="animate-pulse">...</span>
                      ) : !isRegionSupported ? (
                        <span className="text-destructive font-medium">Not Supported</span>
                      ) : (
                        `$${tax.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between text-foreground">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold">${total.toLocaleString()}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {freeShippingThreshold !== null && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Truck className="h-3.5 w-3.5 text-accent" />
                      Free shipping on orders over ${freeShippingThreshold}
                    </div>
                  )}
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
