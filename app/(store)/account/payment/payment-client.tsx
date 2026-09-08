"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CreditCard, Trash2, ShieldCheck } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { toast } from "sonner"

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expiryMonth: string
  expiryYear: string
  isDefault: boolean
}

export function PaymentClient({ initialMethods }: { initialMethods: PaymentMethod[] }) {
  const { user } = useAuth()
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods)

  const handleDelete = async (id: string) => {
    if (!user) return
    try {
      const response = await fetch('/api/me/resources', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'payment-methods', id }) })
      if (!response.ok) throw new Error('Unable to remove payment method')
      setMethods(methods.filter(m => m.id !== id))
      toast.success("Payment method removed")
    } catch (error) {
      toast.error("Failed to remove payment method")
    }
  }

  return (
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
              <p className="text-muted-foreground mt-2">View saved payment references from your payment provider.</p>
            </div>
          </div>

          <div className="mb-6 bg-secondary/50 p-4 rounded-xl flex items-start gap-3 border border-border">
            <ShieldCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">Card numbers and CVCs are entered only on the Paystack or Lemon Squeezy checkout page. VelloTech does not collect or store raw card details.</p>
          </div>

          <div className="space-y-4">
            {methods.length > 0 ? (
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
                <p className="text-muted-foreground">Payment details will be entered securely with the selected provider during checkout.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
