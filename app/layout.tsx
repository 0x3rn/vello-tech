import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/contexts/auth-context'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Vello Tech | Premium Tech Gadgets & Electronics',
  description: 'Discover the latest tech gadgets, electronics, and accessories at Vello Tech. Premium quality, competitive prices, and exceptional customer service.',
  keywords: ['tech gadgets', 'electronics', 'smartphones', 'laptops', 'accessories', 'vello tech'],
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster position="bottom-right" />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  )
}
