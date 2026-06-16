'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import { toast } from 'sonner'

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/shop' },
    { name: 'New Arrivals', href: '/new-arrivals' },
    { name: 'Best Sellers', href: '/best-sellers' },
    { name: 'Deals', href: '/shop?sale=true' },
    { name: 'Gift Cards', href: '#' },
  ],
  support: [
    { name: 'Help Center', href: '#' },
    { name: 'Track Order', href: '#' },
    { name: 'Returns', href: '#' },
    { name: 'Shipping Info', href: '#' },
    { name: 'Contact Us', href: 'mailto:support@vellotech.com' },
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
  return (
    <footer id="support" className="bg-background border-t border-border relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5" />
      <div className="mx-auto max-w-7xl px-4 lg:px-8 pt-12 lg:pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg transition-transform duration-300 group-hover:scale-105">
                <span className="text-primary-foreground font-bold text-xl">V</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Vello<span className="text-primary">Tech</span>
              </span>
            </Link>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed max-w-xs">
              Your trusted destination for premium tech gadgets and electronics. Quality products, competitive prices, exceptional service.
            </p>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <a href="mailto:support@vellotech.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                <Mail className="h-4 w-4" />
                support@vellotech.store
              </a>
              <a href="tel:+1-800-VELLO" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                <Phone className="h-4 w-4" />
                0800-VELLOTECH
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Lagos, Nigeria
              </div>
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
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Vello Tech. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
