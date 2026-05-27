'use client'

import { useState } from 'react'
import { ArrowRight, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => {
      setIsSubmitted(false)
      setEmail('')
    }, 3000)
  }

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="bg-secondary rounded-3xl p-8 lg:p-16 text-center relative overflow-hidden">
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
              Stay Updated
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Subscribe to our newsletter for exclusive deals, new arrivals, and tech tips delivered straight to your inbox.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <div className="relative flex-1">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full transition-all duration-200 focus:scale-[1.01]"
                  required
                  disabled={isSubmitted}
                />
              </div>
              <Button 
                type="submit" 
                className="group transition-all duration-300 hover:scale-105"
                disabled={isSubmitted}
              >
                {isSubmitted ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Subscribed!
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-4 text-sm text-muted-foreground">
              No spam, unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
