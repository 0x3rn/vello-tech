'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Package, User, MapPin, CreditCard } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { resolveImageUrl } from '@/lib/utils'
import { toast } from 'sonner'

export default function OrderDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, 'orders', id as string)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() })
        } else {
          toast.error("Order not found")
          router.push('/admin/orders')
        }
      } catch (error) {
        console.error("Error fetching order:", error)
        toast.error("Failed to load order data")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchOrder()
  }, [id, router])

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/orders/${id as string}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error("Failed to update status")
      setOrder({ ...order, status: newStatus })
      toast.success(`Order status updated to ${newStatus}`)
    } catch (error) {
      console.error("Failed to update status:", error)
      toast.error("Failed to update order status")
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'default'
      case 'cancelled': return 'destructive'
      case 'processing': return 'secondary'
      case 'shipped': return 'secondary'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 hover:text-foreground transition-colors cursor-pointer" onClick={() => router.push('/admin/orders')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Order {order.orderNumber || order.id.slice(0, 8)}
            <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize text-sm ml-2">
              {order.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border shadow-sm">
          <span className="text-sm font-medium">Update Status:</span>
          <select 
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 capitalize"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {updating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Customer & Shipping */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Email Address</p>
                <p className="font-medium">{order.customerEmail || 'Guest User'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">User ID</p>
                <p className="font-mono text-xs">{order.userId || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                Shipping Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Full Name</p>
                <p className="font-medium">{order.shippingDetails?.fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Address</p>
                <p className="font-medium">
                  {order.shippingDetails?.address}<br/>
                  {order.shippingDetails?.city}, {order.shippingDetails?.state} {order.shippingDetails?.zipCode}<br/>
                  {order.shippingDetails?.country}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">{order.shippingDetails?.phone || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Items */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-muted-foreground" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center p-6 gap-4">
                    <div className="relative w-16 h-16 bg-secondary/30 rounded-md border border-border flex items-center justify-center shrink-0">
                      {item.image ? (
                        <Image src={resolveImageUrl(item.image)} alt={item.name} fill className="object-contain p-2" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.slug}`} className="font-medium hover:text-primary transition-colors hover:underline truncate block">
                        {item.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        Qty: {item.quantity} × ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right font-bold text-lg">
                      ${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>$0.00</span>
              </div>
              <div className="pt-4 mt-4 border-t border-border flex justify-between">
                <span className="font-bold text-lg">Total Paid</span>
                <span className="font-black text-2xl text-primary">${order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
