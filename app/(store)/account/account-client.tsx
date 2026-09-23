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
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { signOut, sendEmailVerification } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/contexts/auth-context"
import { useUserStore } from "@/lib/store/user"
import { useCartStore } from "@/lib/store/cart"
import { useState, useEffect } from "react"

const accountLinks = [
  { icon: Package, label: "Orders", href: "/account/orders", color: "bg-blue-500/10 text-blue-600" },
  { icon: Heart, label: "Wishlist", href: "/wishlist", color: "bg-red-500/10 text-red-600" },
  { icon: MapPin, label: "Addresses", href: "/account/addresses", color: "bg-green-500/10 text-green-600" },
  { icon: CreditCard, label: "Payment Methods", href: "/account/payment", color: "bg-purple-500/10 text-purple-600" },
  { icon: Settings, label: "Settings", href: "/account/settings", color: "bg-orange-500/10 text-orange-600" },
]

export function AccountClient({ initialRecentOrders, initialUserData }: { initialRecentOrders: any[], initialUserData: any }) {
  const router = useRouter()
  const { user } = useAuth()
  const { userData: storeUserData, clearUserData } = useUserStore()
  const clearCart = useCartStore((state) => state.clearCart)

  const userData = storeUserData || initialUserData

  const userStats = [
    { label: "Orders", value: userData?.ordersCount || "0", icon: Package },
    { label: "Wishlist", value: userData?.wishlist?.length || "0", icon: Heart },
    { label: "Reviews", value: userData?.reviewsCount || "0", icon: ShoppingBag },
    { label: "Rewards", value: userData?.rewardsPoints || "0", icon: Clock },
  ]

  const [sendingEmail, setSendingEmail] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleResendEmail = async () => {
    if (!auth.currentUser || cooldown > 0) return
    
    setSendingEmail(true)
    try {
      await sendEmailVerification(auth.currentUser)
      toast.success("Verification email sent! Please check your inbox.")
      setCooldown(60)
    } catch (error: any) {
      console.error(error)
      if (error.code === 'auth/too-many-requests') {
        toast.error("Too many requests. Please try again later.")
      } else {
        toast.error("Failed to send verification email.")
      }
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      clearCart()
      clearUserData()
      router.push("/auth/login")
    } catch (error) {
      console.error("Failed to sign out:", error)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
  }

  return (
    <div className="min-h-screen bg-background">
        <div className="pt-10 lg:pt-16 pb-20">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </Link>

          {/* Email Verification Banner */}
          {user && !user.emailVerified && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-amber-600">Verify your email</h3>
                <p className="text-sm text-amber-600/80 mt-1">Please check your inbox to verify your email address.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                onClick={handleResendEmail}
                disabled={sendingEmail || cooldown > 0}
              >
                {sendingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : cooldown > 0 ? (
                  `Wait ${cooldown}s`
                ) : (
                  "Resend Email"
                )}
              </Button>
            </div>
          )}

          {/* Profile Header */}
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold text-2xl">
                  {getInitials(userData?.name || "User")}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
                  Hello, {userData?.name?.split(" ")[0] || "there"}
                </h1>
                <p className="mt-2 text-muted-foreground">Manage your orders, account and preferences.</p>
                <p className="mt-1 text-sm text-muted-foreground">{userData?.email || user?.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {userData?.role === 'admin' && (
                  <Link href="/admin">
                    <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600">
                      Admin Dashboard
                    </Button>
                  </Link>
                )}
                <Link href="/account/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-12 grid grid-cols-2 border-y border-[#E7E9ED] py-6 lg:grid-cols-4">
            {userStats.map((stat) => (
              <div key={stat.label} className="px-4 py-2 first:pl-0 lg:border-r lg:border-[#E7E9ED] lg:last:border-r-0 lg:last:pr-0">
                <p className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quick Links */}
            <div className="lg:col-span-2">
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                Account
              </h2>
              <div className="divide-y divide-[#E7E9ED] overflow-hidden rounded-2xl border border-[#E7E9ED] bg-white">
                {accountLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="group block px-5 py-4 transition-colors duration-200 hover:bg-[#F5F6F8]"
                  >
                    <div className="flex items-center gap-4">
                      <link.icon className="h-5 w-5 text-[#656A73]" />
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground transition-colors duration-200 group-hover:text-primary">
                          {link.label}
                        </h3>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
                {initialRecentOrders.length > 0 ? (
                  initialRecentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="block border-b border-[#E7E9ED] py-4 transition-colors duration-200 hover:text-primary"
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
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No recent orders found</p>
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
