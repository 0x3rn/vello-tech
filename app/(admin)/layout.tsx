'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { useUserStore } from '@/lib/store/user'
import { AdminSidebar } from '@/components/admin/sidebar'
import { Loader2, Menu } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { loading } = useAuth()
  const userData = useUserStore((state) => state.userData)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!userData || userData.role !== 'admin') {
        toast.error('Access Denied', {
          description: 'You do not have permission to view the Admin Dashboard.',
        })
        router.push('/')
      } else {
        setIsAuthorized(true)
      }
    }
  }, [loading, userData, router])

  // While checking auth state or if not authorized (to prevent flash of content)
  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-secondary/20 overflow-y-auto">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:shrink-0">
        <AdminSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-2 text-xl font-black tracking-tighter">
            <span className="text-primary">VELLO</span>
            <span className="text-foreground">ADMIN</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Admin Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-card border-r border-border">
              <div onClick={() => setIsMobileMenuOpen(false)} className="h-full">
                <AdminSidebar />
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Page Content Scroll Area */}
        <main className="flex-1 w-full p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
