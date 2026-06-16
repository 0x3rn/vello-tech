'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Mail, User as UserIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Customer {
  id: string
  name?: string
  email?: string
  phoneNumber?: string
  role?: string
  isAnonymous?: boolean
  createdAt?: string
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'))
        const fetched: Customer[] = []
        snap.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as Customer)
        })
        
        // Sort by newest first (assuming createdAt might be a string or timestamp)
        // We'll just do a basic sort or leave it as fetched if dates are missing
        fetched.sort((a, b) => {
          if (!a.createdAt) return 1
          if (!b.createdAt) return -1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        
        setCustomers(fetched)
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast.error('Failed to load customers')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Customers</h1>
        <p className="text-muted-foreground mt-1">View all registered users and guest accounts.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, or ID..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                    <TableHead>Role / Type</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name || 'Anonymous User'}</span>
                            <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]" title={customer.id}>
                              {customer.id}
                            </span>
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
                          {customer.phoneNumber && (
                            <span className="text-xs text-muted-foreground">{customer.phoneNumber}</span>
                          )}
                        </div>
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
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.createdAt 
                          ? new Date(customer.createdAt).toLocaleDateString() 
                          : 'N/A'}
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
  )
}
