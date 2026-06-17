'use client'

import { ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export function PromoSection() {
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 12,
    minutes: 45,
    seconds: 30,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) {
          seconds = 59
          minutes--
          if (minutes < 0) {
            minutes = 59
            hours--
            if (hours < 0) {
              hours = 23
              days--
              if (days < 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0 }
              }
            }
          }
        }
        return { days, hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="deals" className="py-16 bg-secondary/20 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Content */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight">
              Summer Tech Sale
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              Don&apos;t miss out on our biggest sale of the year. Premium gadgets at unbeatable prices. Up to 40% Off on select items.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="rounded-none">
                <Link href="/shop?sale=true">
                  Shop the Sale
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Countdown Block */}
          <div className="flex-shrink-0 w-full lg:w-auto lg:min-w-[320px] bg-background border border-border p-6 sm:p-8 text-center rounded-2xl lg:rounded-none">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium uppercase tracking-wider">Offer Ends In</span>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              {[
                { value: String(timeLeft.days).padStart(2, '0'), label: 'Days' },
                { value: String(timeLeft.hours).padStart(2, '0'), label: 'Hours' },
                { value: String(timeLeft.minutes).padStart(2, '0'), label: 'Min' },
                { value: String(timeLeft.seconds).padStart(2, '0'), label: 'Sec' },
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <span className="text-2xl sm:text-2xl lg:text-3xl font-light text-foreground tabular-nums tracking-tight">
                    {item.value}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest mt-2">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
