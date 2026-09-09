import Link from "next/link"
import { ArrowLeft, CheckCircle, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { requireFirebaseUser } from "@/lib/neon/auth"
import { getOrderForUser } from "@/lib/neon/commerce"

export const dynamic = "force-dynamic"

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order: orderId } = await searchParams
  let order: Awaited<ReturnType<typeof getOrderForUser>> = null

  if (orderId) {
    try {
      const identity = await requireFirebaseUser()
      order = await getOrderForUser(orderId, identity.uid)
    } catch {
      // A callback URL is not proof of payment. Only show data belonging to
      // the authenticated user after the signed payment webhook updates it.
      order = null
    }
  }

  const paymentState = !order
    ? "missing"
    : order.status === "pending"
      ? "pending"
      : order.status === "cancelled"
        ? "cancelled"
        : "paid"

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-accent" />
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight mb-2">
          {paymentState === "paid"
            ? "Payment Successful!"
            : paymentState === "pending"
              ? "Payment Confirmation Pending"
              : paymentState === "cancelled"
                ? "Payment Not Completed"
                : "Payment Confirmation"}
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          {paymentState === "paid"
            ? "Your verified order has been confirmed."
            : paymentState === "pending"
              ? "Your payment provider is still confirming this order. Refresh this page shortly."
              : paymentState === "cancelled"
                ? "This order was cancelled before payment completed."
                : "We could not find a verified order for this confirmation link."}
        </p>

        {order && (
          <div className="bg-card rounded-2xl border border-border/50 p-6 mb-6 text-left">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-bold text-foreground mb-4">{order.id}</p>
            <p className="font-semibold text-foreground mb-3">
              Total: ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <p key={`${item.name}-${item.quantity}`} className="text-sm text-muted-foreground">
                  {item.name} × {item.quantity}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {order && (
            <Link href="/account/orders">
              <Button>
                <Package className="h-4 w-4 mr-2" />
                View Order
              </Button>
            </Link>
          )}
          <Link href="/shop">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
