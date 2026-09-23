'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message || 'Could not subscribe right now.')
      setIsSubmitted(true)
      setEmail('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not subscribe right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="border-t border-[#E7E9ED] bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.22 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Newsletter</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#111214] md:text-4xl">
              New arrivals and offers by email
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#656A73]">
              Get updates on new products and price drops from VelloTech.
            </p>

            <form onSubmit={handleSubmit} className="mx-auto mt-9 flex max-w-xl flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Input
                  type="email"
                  aria-label="Email address"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-[11px] border-[#E7E9ED] bg-[#F5F6F8] px-4 text-sm placeholder:text-[#8A8F98] focus-visible:ring-primary/20"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button 
                type="submit" 
                className="h-12 rounded-[11px] px-6 transition-colors duration-[220ms] hover:bg-primary/90"
                disabled={isSubmitting || isSubmitted}
              >
                {isSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Subscribed!
                  </motion.div>
                ) : (
                  <>
                    <span className="text-sm font-semibold">{isSubmitting ? 'Subscribing…' : 'Subscribe'}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}

            <p className="mt-4 text-xs text-[#8A8F98]">
              Only occasional updates about new arrivals and offers.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
