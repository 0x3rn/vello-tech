'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart, Search, User, Heart, ChevronDown, Phone, Mail, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cart'
import { useAuth } from '@/lib/contexts/auth-context'
import { useUserStore } from '@/lib/store/user'

const navigation = [
  { 
    name: 'Shop', 
    href: '#products',
    submenu: [
      { name: 'All Products', href: '#products' },
      { name: 'New Arrivals', href: '#new' },
      { name: 'Best Sellers', href: '#bestsellers' },
      { name: 'On Sale', href: '#sale' },
    ]
  },
  { 
    name: 'Categories', 
    href: '/categories',
    submenu: [
      { name: 'Smartphones', href: '/category/smartphones' },
      { name: 'Laptops', href: '/category/laptops' },
      { name: 'Audio', href: '/category/audio' },
      { name: 'Wearables', href: '/category/wearables' },
      { name: 'Cameras', href: '/category/cameras' },
      { name: 'Gaming', href: '/category/gaming' },
      { name: 'Storage & Memory', href: '/category/storage-and-memory' },
      { name: 'PC Components', href: '/category/pc-components' },
      { name: 'Networking', href: '/category/networking' },
      { name: 'Accessories', href: '/category/accessories' },
    ]
  },
  { name: 'Deals', href: '#deals' },
  { name: 'New Arrivals', href: '#new' },
  { name: 'Support', href: '#support' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const cartCount = useCartStore((state) => state.totalItems())
  const wishlistCount = useUserStore((state) => state.userData?.wishlist?.length || 0)
  const { user } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  useEffect(() => {
    setIsMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Top Bar */}
      <div className="relative z-50 bg-foreground text-background text-sm hidden lg:block">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="tel:+1234567890" className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80">
                <Phone className="h-3.5 w-3.5" />
                <span>0800-VELLO-TECH</span>
              </a>
              <a href="mailto:support@vellotech.com" className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80">
                <Mail className="h-3.5 w-3.5" />
                <span>support@vellotech.store</span>
              </a>
            </div>
            <div className="flex items-center gap-6">
              <span>Free shipping on orders over ₦150,000</span>
              <span className="w-px h-4 bg-background/30" />
              <a href="#track" className="transition-opacity duration-200 hover:opacity-80">Track Order</a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header 
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-300',
          isScrolled 
            ? 'bg-background/95 backdrop-blur-md shadow-sm py-2' 
            : 'bg-background/80 backdrop-blur-md py-4',
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl transition-transform duration-300 group-hover:scale-105">
              <span className="text-primary-foreground font-bold text-xl">V</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                Vello<span className="text-primary">Tech</span>
              </span>
              <span className="text-xs text-muted-foreground leading-none hidden sm:block">Premium Gadgets</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navigation.map((item) => (
              <div 
                key={item.name}
                className="relative"
                onMouseEnter={() => item.submenu && setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {item.name}
                  {item.submenu && <ChevronDown className="h-4 w-4 transition-transform duration-200" />}
                </Link>
                
                {/* Dropdown */}
                {item.submenu && (
                  <div 
                    className={cn(
                      'absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-lg py-2 transition-all duration-200',
                      activeDropdown === item.name 
                        ? 'opacity-100 visible translate-y-0' 
                        : 'opacity-0 invisible -translate-y-2'
                    )}
                  >
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.name}
                        href={subitem.href}
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
                      >
                        {subitem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full h-10 pl-11 pr-4 rounded-full bg-secondary border border-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </form>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {user && (
              <Link href="/wishlist" className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
                >
                  <Heart className="h-5 w-5" />
                  {isMounted && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {wishlistCount}
                    </span>
                  )}
                  <span className="sr-only">Wishlist</span>
                </Button>
              </Link>
            )}
            <Link href={user ? "/account" : "/auth/login"}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
              >
                <User className="h-5 w-5" />
                <span className="sr-only">Account</span>
              </Button>
            </Link>
            <Link href="/cart" className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
              >
                <ShoppingCart className="h-5 w-5" />
                {isMounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <Link href="/wishlist" className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative text-muted-foreground transition-transform duration-200 hover:scale-105"
                >
                  <Heart className="h-5 w-5" />
                  {isMounted && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            <Link href="/cart" className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-muted-foreground transition-transform duration-200 hover:scale-105"
              >
                <ShoppingCart className="h-5 w-5" />
                {isMounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="transition-transform duration-200 hover:scale-105"
            >
              <span className={cn(
                'transition-transform duration-300',
                mobileMenuOpen ? 'rotate-90' : 'rotate-0'
              )}>
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </span>
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </nav>

        {/* Mobile menu */}
        <div
          className={cn(
            'lg:hidden absolute top-full left-0 right-0 bg-background border-b border-border/50 shadow-lg transition-all duration-300 ease-out overflow-auto',
            mobileMenuOpen ? 'max-h-[85vh] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="px-4 py-6 space-y-2">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-secondary border border-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all duration-200"
              />
            </form>

            {/* Nav Links */}
            <div className="space-y-1">
              {navigation.map((item) => (
                <div key={item.name} className="flex flex-col">
                  <Link
                    href={item.href}
                    className="flex items-center justify-between px-4 py-3 text-base font-bold text-foreground hover:bg-secondary rounded-xl transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.submenu && (
                    <div className="flex flex-col pl-4 mt-1 space-y-1 border-l-2 border-border/50 ml-6 mb-2">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          href={subitem.href}
                          className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all duration-200"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 mt-2 border-t border-border/50 space-y-1">
              {user && (
                <>
                  <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">My Account</p>
                  <Link
                    href="/account"
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    My Dashboard
                  </Link>
                  <Link
                    href="/account/orders"
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package className="h-5 w-5" />
                    Order History
                  </Link>
                  <Link
                    href="/wishlist"
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart className="h-5 w-5" />
                    Wishlist {isMounted ? `(${wishlistCount})` : ''}
                  </Link>
                </>
              )}
            </div>

            {!user && (
              <div className="pt-2 mt-2 border-t border-border/50">
                <Link
                  href="/auth/login"
                  className="block w-full text-center px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium transition-all duration-200 hover:bg-primary/90"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="block w-full text-center px-4 py-3 mt-2 border border-border/50 text-foreground rounded-xl font-medium transition-all duration-200 hover:bg-secondary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
