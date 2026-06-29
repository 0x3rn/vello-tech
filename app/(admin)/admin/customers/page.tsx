'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Mail, User as UserIcon, DollarSign, ShoppingBag, Eye } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatDistanceToNow } from 'date-fns'

interface Customer {
  id: string
  name: string
  email: string
  phoneNumber?: string
  role?: string
  isAnonymous: boolean
  createdAt?: string
  totalSpend: number
  totalOrders: number
  orders: any[]
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showTop100, setShowTop100] = useState<'spend' | 'orders' | null>(null)

  useEffect(() => {
    const fetchCustomersAndOrders = async () => {
      try {
        // Fetch Users
        const usersSnap = await getDocs(collection(db, 'users'))
        const usersMap = new Map<string, Partial<Customer>>()
        
        usersSnap.forEach((doc) => {
          const data = doc.data()
          usersMap.set(data.email?.toLowerCase() || doc.id, {
            id: doc.id,
            name: data.name || 'Anonymous User',
            email: data.email || '',
            phoneNumber: data.phoneNumber,
            role: data.role || 'user',
            isAnonymous: data.isAnonymous || false,
            createdAt: data.createdAt,
            totalSpend: 0,
            totalOrders: 0,
            orders: []
          })
        })

        // Fetch Orders
        const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')))
        
        ordersSnap.forEach((doc) => {
          const order = { id: doc.id, ...doc.data() } as any
          const emailKey = order.email?.toLowerCase()
          
          if (!emailKey) return // Skip orders without email

          if (usersMap.has(emailKey)) {
            const user = usersMap.get(emailKey)!
            user.totalOrders! += 1
            user.totalSpend! += (order.totalPaid || 0)
            user.orders!.push(order)
          } else {
            // Guest User
            usersMap.set(emailKey, {
              id: `guest_${doc.id}`,
              name: order.shippingAddress?.name || 'Guest User',
              email: order.email,
              role: 'guest',
              isAnonymous: true,
              totalSpend: order.totalPaid || 0,
              totalOrders: 1,
              orders: [order]
            })
          }
        })

        const fetched = Array.from(usersMap.values()) as Customer[]
        fetched.sort((a, b) => b.totalSpend - a.totalSpend)
        setCustomers(fetched)

      } catch (error) {
        console.error("Error fetching customers/orders:", error)
        toast.error('Failed to load customers.')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomersAndOrders()
  }, [])

  let filteredCustomers = customers.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (showTop100 === 'spend') {
    filteredCustomers = [...customers].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 100)
  } else if (showTop100 === 'orders') {
    filteredCustomers = [...customers].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 100)
  }

  const highestSpendCustomer = [...customers].sort((a, b) => b.totalSpend - a.totalSpend)[0]
  const mostOrdersCustomer = [...customers].sort((a, b) => b.totalOrders - a.totalOrders)[0]

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Customers & Guests</h1>
        <p className="text-muted-foreground mt-1">View registered users and guest checkout records.</p>
      </div>

      {!loading && customers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Highest Spend</p>
                  <h3 className="text-2xl font-bold text-foreground truncate max-w-[200px]" title={highestSpendCustomer?.name}>
                    {highestSpendCustomer?.name}
                  </h3>
                  <p className="text-lg font-medium text-primary mt-1">
                    ${highestSpendCustomer?.totalSpend.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
              <Button 
                variant="link" 
                className="px-0 mt-4 text-primary h-auto"
                onClick={() => setShowTop100(showTop100 === 'spend' ? null : 'spend')}
              >
                {showTop100 === 'spend' ? 'Clear Filter' : 'Show Top 100 Spenders'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Most Orders</p>
                  <h3 className="text-2xl font-bold text-foreground truncate max-w-[200px]" title={mostOrdersCustomer?.name}>
                    {mostOrdersCustomer?.name}
                  </h3>
                  <p className="text-lg font-medium text-blue-500 mt-1">
                    {mostOrdersCustomer?.totalOrders} Orders
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <Button 
                variant="link" 
                className="px-0 mt-4 text-blue-500 h-auto"
                onClick={() => setShowTop100(showTop100 === 'orders' ? null : 'orders')}
              >
                {showTop100 === 'orders' ? 'Clear Filter' : 'Show Top 100 by Orders'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>
              {showTop100 === 'spend' ? 'Top 100 Spenders' : showTop100 === 'orders' ? 'Top 100 by Orders' : `All Customers (${filteredCustomers.length})`}
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowTop100(null)
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No customers found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Total Spend</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => setSelectedCustomer(customer)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            {!customer.isAnonymous && customer.id && (
                              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]" title={customer.id}>
                                ID: {customer.id.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          {customer.email ? (
                            <span className="text-sm flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {customer.email}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">No email</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-foreground">
                        ${customer.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer.totalOrders}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant={customer.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                            {customer.role || 'user'}
                          </Badge>
                          {customer.isAnonymous && (
                            <Badge variant="outline" className="text-muted-foreground border-dashed">
                              Guest
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); }}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Customer Details</SheetTitle>
            <SheetDescription>
              Viewing order history for {selectedCustomer?.name}
            </SheetDescription>
          </SheetHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              <div className="bg-secondary/30 rounded-xl p-4 flex gap-4 items-center border border-border">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <UserIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="capitalize">{selectedCustomer.role}</Badge>
                    <Badge variant="outline">Total Spend: ${selectedCustomer.totalSpend.toLocaleString()}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" /> 
                  Order History ({selectedCustomer.totalOrders})
                </h4>
                
                {selectedCustomer.orders.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No orders found for this customer.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedCustomer.orders.map(order => (
                      <div key={order.id} className="border border-border rounded-xl p-4 bg-card shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground font-mono">Order #{order.id}</p>
                            <p className="text-sm font-medium mt-1">
                              {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : 'Unknown date'}
                            </p>
                          </div>
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">
                            {order.status || 'Processing'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-muted-foreground truncate pr-4">
                                {item.quantity}x {item.name}
                                {item.selectedColor && ` (${item.selectedColor.name})`}
                              </span>
                              <span className="font-medium">${(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-border pt-3 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground capitalize">
                            Paid via {order.paymentMethod}
                          </span>
                          <span className="font-bold text-foreground">
                            ${(order.totalPaid || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
