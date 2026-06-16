'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ShoppingBag, Package, AlertTriangle, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Order {
  id: string
  orderNumber: string
  customerEmail: string
  totalAmount: number
  status: string
  createdAt: string
}

interface Product {
  id: string
  name: string
  stockQuantity: number
  price: number
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({ revenue: 0, ordersCount: 0 })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])



  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all orders for metrics
        // In a massive production app, you'd use Firebase Aggregation queries here
        const ordersSnap = await getDocs(collection(db, 'orders'))
        let totalRevenue = 0
        let totalOrders = 0
        const allOrders: Order[] = []

        ordersSnap.forEach((doc) => {
          const data = doc.data()
          allOrders.push({ id: doc.id, ...data } as Order)
          if (data.status !== 'cancelled') {
            totalRevenue += data.totalAmount || 0
            totalOrders += 1
          }
        })

        setMetrics({ revenue: totalRevenue, ordersCount: totalOrders })

        // Sort for recent orders manually since we fetched all
        allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setRecentOrders(allOrders.slice(0, 5))

        // Filter pending orders
        setPendingOrders(allOrders.filter(o => o.status === 'pending'))

        // Fetch low stock products
        const lowStockQuery = query(collection(db, 'products'), where('stockQuantity', '<', 5))
        const lowStockSnap = await getDocs(lowStockQuery)
        const lowStock: Product[] = []
        lowStockSnap.forEach((doc) => {
          lowStock.push({ id: doc.id, ...doc.data() } as Product)
        })
        setLowStockProducts(lowStock)

      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">
          High-level metrics and urgent tasks for your store.
        </p>
      </div>

      {/* Pending Orders Alert Widget */}
      {pendingOrders.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-amber-700 dark:text-amber-500">Action Required: Pending Orders</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-foreground">
                You have <span className="font-bold">{pendingOrders.length}</span> order(s) waiting to be processed and shipped.
              </p>
              <Button asChild className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white">
                <Link href="/admin/orders">
                  Review Orders
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Excludes cancelled orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{metrics.ordersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Successful transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Items requiring restock</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/admin/orders" className="text-sm text-primary hover:underline">View All</Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">No recent orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber || order.id.slice(0, 8)}</TableCell>
                        <TableCell>{order.customerEmail}</TableCell>
                        <TableCell>${order.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Low Stock Alerts</CardTitle>
              <Link href="/admin/products" className="text-sm text-primary hover:underline">Manage Products</Link>
            </div>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">All products are adequately stocked.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>${product.price?.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="text-destructive font-bold">{product.stockQuantity}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




