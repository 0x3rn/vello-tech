'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/shop' },
    { name: 'New Arrivals', href: '/new-arrivals' },
    { name: 'Best Sellers', href: '/best-sellers' },
    { name: 'Deals', href: '/shop?sale=true' },
  ],
  support: [
    { name: 'Help Center', href: '#' },
    { name: 'Track Order', href: '/account/orders' },
    { name: 'Returns', href: '#' },
    { name: 'Shipping Info', href: '#' },
    { name: 'Contact Us', href: 'mailto:support@vellotech.store' },
  ],
  company: [
    { name: 'About Us', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Press', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Affiliates', href: '#' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Cookie Policy', href: '#' },
  ],
}

export function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith('/checkout')) return null

  return (
    <footer id="support" className="border-t border-[#E7E9ED] bg-[#F5F6F8]">
      <div className="mx-auto max-w-[1440px] px-4 pb-7 pt-12 lg:px-8 lg:pt-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-4 lg:grid-cols-6 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary">
                <span className="text-primary-foreground font-bold text-xl">V</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Vello<span className="text-primary">Tech</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Considered technology for everyday life.
            </p>

            {/* Contact Info */}
            <div className="mt-5">
              <a href="mailto:support@vellotech.store" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                <Mail className="h-4 w-4" />
                support@vellotech.store
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  {link.href === '#' ? (
                    <button onClick={() => toast.info('Coming soon!')} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.name}
                    </button>
                  ) : (
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  {link.href === '#' ? (
                    <button onClick={() => toast.info('Coming soon!')} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.name}
                    </button>
                  ) : link.href.startsWith('mailto:') ? (
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.name}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  {link.href === '#' ? (
                    <button onClick={() => toast.info('Coming soon!')} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.name}
                    </button>
                  ) : (
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  {link.href === '#' ? (
                    <button onClick={() => toast.info('Coming soon!')} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.name}
                    </button>
                  ) : (
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#E0E3E8] pt-6 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Vello Tech. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Secure payments · Quality checked products</p>
        </div>
      </div>
    </footer>
  )
}
