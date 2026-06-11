"use client"

import Link from "next/link"
import {
  User,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  ShoppingBag,
  Clock,
  ChevronRight,
  ArrowLeft,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const stats = [
  { label: "Orders", value: "12", icon: Package },
  { label: "Wishlist", value: "8", icon: Heart },
  { label: "Reviews", value: "5", icon: ShoppingBag },
  { label: "Rewards", value: "1,240", icon: Clock },
]

const recentOrders = [
  {
    id: "VT-2026-001",
    date: "May 20, 2026",
    status: "Delivered",
    total: "$1,299.00",
    items: 1,
  },
  {
    id: "VT-2026-002",
    date: "May 15, 2026",
    status: "Shipped",
    total: "$498.00",
    items: 2,
  },
  {
    id: "VT-2026-003",
    date: "May 10, 2026",
    status: "Processing",
    total: "$179.00",
    items: 1,
  },
]

const accountLinks = [
  { icon: Package, label: "Orders", href: "/account/orders", color: "bg-blue-500/10 text-blue-600" },
  { icon: Heart, label: "Wishlist", href: "/wishlist", color: "bg-red-500/10 text-red-600" },
  { icon: MapPin, label: "Addresses", href: "/account/addresses", color: "bg-green-500/10 text-green-600" },
  { icon: CreditCard, label: "Payment Methods", href: "/account/payment", color: "bg-purple-500/10 text-purple-600" },
  { icon: Settings, label: "Settings", href: "/account/settings", color: "bg-orange-500/10 text-orange-600" },
]

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16 pb-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </Link>

          {/* Profile Header */}
          <div className="bg-card border border-border rounded-xl p-5 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold text-2xl">JD</span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">
                  John Doe
                </h1>
                <p className="text-muted-foreground">john.doe@example.com</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/account/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-card border-border transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quick Links */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Account Overview
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {accountLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="group bg-card border border-border rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${link.color}`}>
                        <link.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
                          {link.label}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Manage your {link.label.toLowerCase()}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Recent Orders
                </h2>
                <Link
                  href="/account/orders"
                  className="text-sm text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="block bg-card border border-border rounded-lg p-3 sm:p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground text-sm">
                        {order.id}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          order.status === "Delivered"
                            ? "bg-accent/10 text-accent"
                            : order.status === "Shipped"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items} {order.items === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <span className="font-bold text-foreground">{order.total}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}