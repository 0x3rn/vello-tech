'use client'

import { useState } from 'react'
import { ArrowRight, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'

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
    <section className="py-16 lg:py-20 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-primary/5" />
      <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-card/40 backdrop-blur-xl border border-border shadow-md rounded-2xl p-8 lg:p-16 text-center relative overflow-hidden"
        >
          {/* Decorative elements */}


          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8 border border-primary/20 shadow-inner"
            >
              <Mail className="h-10 w-10 text-primary drop-shadow-md" />
            </motion.div>
            
            <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
              Stay <span className="text-primary">Updated</span>
            </h2>
            <p className="mt-6 text-muted-foreground max-w-xl mx-auto text-lg">
              Subscribe to our newsletter for exclusive deals, new arrivals, and tech tips delivered straight to your inbox.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 rounded-2xl bg-background/50 backdrop-blur-sm border-white/10 transition-all duration-300 focus:scale-[1.02] focus:border-primary focus:ring-primary/20 px-6 text-lg placeholder:text-muted-foreground/70"
                  required
                  disabled={isSubmitted}
                />
              </div>
              <Button 
                type="submit" 
                className="h-14 px-8 rounded-2xl group transition-all duration-300 shadow-sm hover:opacity-90"
                disabled={isSubmitted}
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
                    <span className="font-bold text-base">Subscribe</span>
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-sm font-medium text-muted-foreground/80">
              No spam, unsubscribe at any time.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
