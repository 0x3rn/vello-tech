'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Menu, X, ShoppingCart, Search, User, Heart, ChevronDown, Mail, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cart'
import { useAuth } from '@/lib/contexts/auth-context'
import { useUserStore } from '@/lib/store/user'
import { resolveImageUrl } from '@/lib/utils'
import type { ProductData } from '@/components/product-card'

const navigation = [
  { name: 'Home', href: '/' },
  { 
    name: 'Shop', 
    href: '/shop',
    submenu: [
      { name: 'All Products', href: '/shop' },
      { name: 'New Arrivals', href: '/new-arrivals' },
      { name: 'Best Sellers', href: '/best-sellers' },
      { name: 'On Sale', href: '/shop?sale=true' },
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
  { name: 'Deals', href: '/shop?sale=true' },
  { name: 'New Arrivals', href: '/new-arrivals' },
  { name: 'Support', href: 'mailto:support@vellotech.store' },
]

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const cartCount = useCartStore((state) => state.totalItems())
  const wishlistCount = useUserStore((state) => state.userData?.wishlist?.length || 0)
  const userData = useUserStore((state) => state.userData)
  const { user } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<ProductData[]>([])
  const [isMounted, setIsMounted] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSearchFocused(false)
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
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

  useEffect(() => {
    const query = searchQuery.trim()
    if (!searchFocused || query.length < 2) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/catalog?resource=products&q=${encodeURIComponent(query)}`, { signal: controller.signal })
        if (response.ok) setSuggestions((await response.json() as ProductData[]).slice(0, 3))
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setSuggestions([])
      }
    }, 180)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [searchFocused, searchQuery])

  if (pathname.startsWith('/checkout')) {
    return (
      <header className="border-b border-[#E7E9ED] bg-white">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-4 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#111214]">Vello<span className="text-primary">Tech</span></Link>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-[#656A73]">Secure checkout <span aria-hidden>🔒</span></span>
        </div>
      </header>
    )
  }

  return (
    <>
      {/* Top Bar */}
      <div className="relative z-50 hidden h-[34px] bg-[#111214] text-white/75 lg:block">
        <div className="mx-auto flex h-full max-w-[1440px] items-center px-4 text-xs lg:px-8">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="mailto:support@vellotech.store" className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80">
                <Mail className="h-3.5 w-3.5" />
                <span>Support: support@vellotech.store</span>
              </a>
            </div>
            <div className="flex items-center gap-6">
              <span>Free shipping on orders over $100</span>
              <span className="h-3 w-px bg-white/25" />
              <Link href="/account/orders" className="transition-opacity duration-200 hover:opacity-80">Track order</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header 
        className={cn(
          'sticky top-0 z-40 w-full border-b border-[#E7E9ED] transition-colors duration-200',
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md'
            : 'bg-white',
        )}
      >
        <nav className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 lg:h-[76px] lg:px-8">
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
            <form onSubmit={handleSearch} onFocus={() => setSearchFocused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchFocused(false) }} onKeyDown={(event) => { if (event.key === 'Escape') setSearchFocused(false) }} className="group relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="h-10 w-full rounded-[10px] border border-transparent bg-[#F4F5F7] pl-11 pr-4 text-sm placeholder:text-muted-foreground transition-[background-color,border-color] duration-200 focus:border-primary/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                suppressHydrationWarning
              />
              {searchFocused && (
                <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#E7E9ED] bg-white p-4 shadow-[0_16px_40px_rgba(17,24,39,0.10)]">
                  {searchQuery.trim().length < 2 ? (
                    <>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8A8F98]">Popular searches</p>
                      {['iPhone 17 Pro Max', 'MacBook Pro', 'PlayStation 5'].map((term) => (
                        <button key={term} type="button" onClick={() => { setSearchQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); setSearchFocused(false) }} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-[#35383D] hover:bg-[#F5F6F8]">
                          <Search className="h-3.5 w-3.5 text-[#8A8F98]" />{term}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8A8F98]">Products</p>
                      {suggestions.map((product) => (
                        <Link key={product.id} href={`/product/${product.slug}`} onClick={() => setSearchFocused(false)} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#F5F6F8]">
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#F5F6F8]"><Image src={resolveImageUrl(product.imageUrls?.[0])} alt="" fill sizes="48px" className="object-contain p-1" /></span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#111214]">{product.name}</span>
                          <span className="text-xs font-semibold text-[#111214]">${(product.discountPrice ?? product.price).toLocaleString()}</span>
                        </Link>
                      ))}
                      {suggestions.length === 0 && <p className="px-2 py-3 text-sm text-[#656A73]">No matching products yet.</p>}
                      <button type="submit" className="mt-2 flex w-full items-center justify-between border-t border-[#E7E9ED] px-2 pt-3 text-sm font-semibold text-primary">View all results for “{searchQuery.trim()}” <span aria-hidden>→</span></button>
                    </>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {isMounted && user && (
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
            {isMounted && user && (
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
                suppressHydrationWarning
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
              {isMounted && userData?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center justify-between px-4 py-3 mb-2 text-base font-bold text-amber-600 dark:text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              {isMounted && user && (
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
            {isMounted && !user && (
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
