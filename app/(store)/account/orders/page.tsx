"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Package,
  Search,
  ChevronDown,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useState } from "react"

const orders = [
  {
    id: "VT-2026-001",
    date: "May 20, 2026",
    status: "Delivered",
    total: 1299.00,
    items: 1,
    products: ["ProMax Smartphone X1"],
    tracking: "TRK-123456789",
  },
  {
    id: "VT-2026-002",
    date: "May 15, 2026",
    status: "Shipped",
    total: 498.00,
    items: 2,
    products: ["WirelessBuds Pro", "GamePad Elite X"],
    tracking: "TRK-987654321",
  },
  {
    id: "VT-2026-003",
    date: "May 10, 2026",
    status: "Processing",
    total: 179.00,
    items: 1,
    products: ["SmartWatch Series 8"],
    tracking: null,
  },
  {
    id: "VT-2026-004",
    date: "May 5, 2026",
    status: "Delivered",
    total: 2499.00,
    items: 1,
    products: ["UltraBook Pro 16\""],
    tracking: "TRK-456789123",
  },
  {
    id: "VT-2026-005",
    date: "April 28, 2026",
    status: "Cancelled",
    total: 349.00,
    items: 1,
    products: ["SoundWave Elite ANC"],
    tracking: null,
  },
]

const statusIcons: Record<string, typeof Package> = {
  Delivered: CheckCircle,
  Shipped: Truck,
  Processing: Clock,
  Cancelled: AlertCircle,
}

const statusColors: Record<string, string> = {
  Delivered: "bg-accent/10 text-accent border-accent/20",
  Shipped: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Processing: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Cancelled: "bg-muted text-muted-foreground border-border",
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.products.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "All" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
                Order History
              </h1>
              <p className="mt-2 text-muted-foreground">
                Track and manage your orders
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by order ID or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {["All", "Delivered", "Shipped", "Processing", "Cancelled"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                      statusFilter === status
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    )}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-20">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No orders found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const StatusIcon = statusIcons[order.status]
                return (
                  <div
                    key={order.id}
                    className="bg-card border border-border rounded-2xl p-6 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0",
                            statusColors[order.status]
                          )}
                        >
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {order.id}
                            </h3>
                            <Badge
                              className={cn(
                                "text-xs border",
                                statusColors[order.status]
                              )}
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {order.date} · {order.items}{" "}
                            {order.items === 1 ? "item" : "items"}
                          </p>
                          <p className="text-sm text-foreground">
                            {order.products.join(", ")}
                          </p>
                          {order.tracking && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Tracking: {order.tracking}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex items-center gap-4 ml-16 lg:ml-0">
                        <span className="text-xl font-bold text-foreground whitespace-nowrap">
                          ${order.total.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link href={`/account/orders/${order.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="transition-all duration-200 hover:scale-105"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Details
                            </Button>
                          </Link>
                          {order.status === "Shipped" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="transition-all duration-200 hover:scale-105"
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Track
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}