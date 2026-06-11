import Link from 'next/link'
import { Globe, ExternalLink, Camera, Play, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  shop: [
    { name: 'All Products', href: '#' },
    { name: 'New Arrivals', href: '#' },
    { name: 'Best Sellers', href: '#' },
    { name: 'Deals', href: '#' },
    { name: 'Gift Cards', href: '#' },
  ],
  support: [
    { name: 'Help Center', href: '#' },
    { name: 'Track Order', href: '#' },
    { name: 'Returns', href: '#' },
    { name: 'Shipping Info', href: '#' },
    { name: 'Contact Us', href: '#' },
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

const socialLinks = [
  { name: 'Facebook', icon: Globe, href: '#' },
  { name: 'Twitter', icon: ExternalLink, href: '#' },
  { name: 'Instagram', icon: Camera, href: '#' },
  { name: 'YouTube', icon: Play, href: '#' },
]

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
                support@vellotech.com
              </a>
              <a href="tel:+1-800-VELLO" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                <Phone className="h-4 w-4" />
                1-800-VELLO
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                San Francisco, CA
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                    {link.name}
                  </Link>
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
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                    {link.name}
                  </Link>
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
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                    {link.name}
                  </Link>
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
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                    {link.name}
                  </Link>
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

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="w-12 h-12 rounded-full bg-secondary/50 backdrop-blur-sm border border-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-primary hover:border-primary transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20"
                aria-label={social.name}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
