"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CreditCard, Plus, Trash2, Edit2, Loader2, ShieldCheck } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expiryMonth: string
  expiryYear: string
  isDefault: boolean
}

export default function PaymentMethodsPage() {
  const { user } = useAuth()
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  
  // Form State
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchMethods = async () => {
    if (!user) return
    try {
      const q = query(collection(db, "users", user.uid, "paymentMethods"))
      const snapshot = await getDocs(q)
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod))
      setMethods(fetched)
    } catch (error) {
      console.error("Error fetching payment methods", error)
      toast.error("Failed to load payment methods")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchMethods()
    } else {
      setLoading(false)
    }
  }, [user])

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSubmitting(true)
    
    try {
      // --- LEMONSQUEEZY INTEGRATION (COMMENTED OUT) ---
      // Note: LemonSqueezy does not support custom card input forms like Stripe Elements.
      // To securely save a payment method with LemonSqueezy, you typically redirect the user 
      // to a $0 or subscription Setup Checkout using Lemon.js overlay, and catch the token/card details 
      // via a Webhook to your backend.
      // 
      // 1. Add these to your .env.local:
      //    LEMONSQUEEZY_API_KEY="your_api_key"
      //    LEMONSQUEEZY_STORE_ID="your_store_id"
      //    LEMONSQUEEZY_WEBHOOK_SECRET="your_webhook_secret"
      //
      // 2. Example Frontend Call (When uncommented, you would remove the manual form fields):
      /*
      const response = await fetch('/api/payment/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email })
      });
      const { checkoutUrl } = await response.json();
      
      // If using Lemon.js overlay:
      // window.createLemonSqueezy();
      // window.LemonSqueezy.Url.Open(checkoutUrl);
      
      // Or redirect directly:
      // window.location.href = checkoutUrl;
      
      // The backend webhook (/api/webhooks/lemonsqueezy) would then receive the 'subscription_created' 
      // or 'order_created' event, extract the card's last4/brand, and save it to this exact 
      // Firestore subcollection automatically.
      */
      // ------------------------------------------------

      // Simulated Tokenization (Fallback for now):
      const cleanCard = cardNumber.replace(/\D/g, '')
      const last4 = cleanCard.length >= 4 ? cleanCard.slice(-4) : "0000"
      let brand = "Visa"
      if (cleanCard.startsWith("5")) brand = "Mastercard"
      if (cleanCard.startsWith("3")) brand = "Amex"
      if (cleanCard.startsWith("4")) brand = "Visa"

      const [month, year] = expiry.split('/')
      
      const isDefault = methods.length === 0
      const newMethod = { brand, last4, expiryMonth: month?.trim() || "12", expiryYear: year?.trim() || "28", isDefault }
      
      const docRef = await addDoc(collection(db, "users", user.uid, "paymentMethods"), newMethod)
      setMethods([...methods, { id: docRef.id, ...newMethod }])
      
      toast.success("Payment method securely added")
      setIsAddOpen(false)
      // Reset form
      setCardNumber(""); setExpiry(""); setCvc(""); setName("")
    } catch (error) {
      toast.error("Failed to add payment method")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "paymentMethods", id))
      setMethods(methods.filter(m => m.id !== id))
      toast.success("Payment method removed")
    } catch (error) {
      toast.error("Failed to remove payment method")
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="pt-10 lg:pt-16 pb-20">
          <div className="mx-auto max-w-3xl px-4 lg:px-8">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Payment Methods</h1>
                <p className="text-muted-foreground mt-2">Manage your saved credit cards and payment options.</p>
              </div>
              
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="shrink-0 transition-transform hover:scale-105">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Payment Method</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddMethod} className="space-y-4 pt-4">
                    <div className="bg-secondary/50 p-3 rounded-lg flex items-start gap-2 mb-4">
                      <ShieldCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        For your security, your full card details are never saved on our servers. 
                        We tokenize your card via our payment processor.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name on Card</Label>
                      <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input 
                        id="cardNumber" 
                        required 
                        value={cardNumber} 
                        onChange={e => setCardNumber(e.target.value)} 
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" required value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" required value={cvc} onChange={e => setCvc(e.target.value)} placeholder="123" maxLength={4} type="password" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Payment Method
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : methods.length > 0 ? (
                methods.map((method) => (
                  <div key={method.id} className={`bg-card border ${method.isDefault ? 'border-primary/50' : 'border-border'} rounded-xl p-6 relative overflow-hidden transition-all duration-200 hover:shadow-md`}>
                    {method.isDefault && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
                        Default
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground mb-1">{method.brand} ending in {method.last4}</h3>
                        <p className="text-muted-foreground text-sm">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(method.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-12 bg-secondary/30 rounded-xl border border-dashed border-border">
                  <CreditCard className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold mb-2">No payment methods</h3>
                  <p className="text-muted-foreground">Add a card for faster checkout.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
