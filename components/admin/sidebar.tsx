'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Users,
  LogOut,
  ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Customers', href: '/admin/customers', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      {/* Brand & Back to Store */}
      <div className="flex flex-col p-6 space-y-4">
        <div className="flex items-center gap-2 text-2xl font-black tracking-tighter">
          <span className="text-primary">VELLO</span>
          <span className="text-foreground">ADMIN</span>
        </div>
        <Link href="/">
          <Button variant="outline" className="w-full justify-start text-xs rounded-full h-8 px-3 text-muted-foreground border-border/50">
            <ChevronLeft className="mr-2 h-3 w-3" />
            Back to Storefront
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/admin' 
            ? pathname === '/admin' 
            : pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer Area */ }
      <div className="p-4 border-t border-border mt-auto">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
