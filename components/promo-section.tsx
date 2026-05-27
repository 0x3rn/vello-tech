'use client'

import { ArrowRight, Zap, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

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
    <section id="deals" className="py-20 lg:py-28 bg-foreground relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 text-background text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Limited Time Offer
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-background tracking-tight leading-tight text-balance">
              Summer Tech Sale
              <span className="block text-primary">Up to 40% Off</span>
            </h2>
            
            <p className="mt-6 text-lg text-background/70 max-w-xl mx-auto lg:mx-0">
              Don&apos;t miss out on our biggest sale of the year. Premium gadgets at unbeatable prices.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="group transition-transform duration-300 hover:scale-105">
                Shop the Sale
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>

            {/* Countdown */}
            <div className="mt-12">
              <div className="flex items-center gap-2 text-background/60 mb-4 justify-center lg:justify-start">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Sale ends in:</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-3">
                {[
                  { value: String(timeLeft.days).padStart(2, '0'), label: 'Days' },
                  { value: String(timeLeft.hours).padStart(2, '0'), label: 'Hours' },
                  { value: String(timeLeft.minutes).padStart(2, '0'), label: 'Min' },
                  { value: String(timeLeft.seconds).padStart(2, '0'), label: 'Sec' },
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-background/10 border border-background/20 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-105">
                      <span className="text-2xl font-bold text-background tabular-nums">{item.value}</span>
                    </div>
                    <span className="text-xs text-background/50 mt-2 block">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Promo Visual */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              <div className="bg-background/5 backdrop-blur-sm rounded-3xl p-8 border border-background/10 transition-transform duration-500 hover:scale-[1.02]">
                <div className="aspect-square bg-background/5 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-40 h-40 mx-auto bg-background/10 rounded-full flex items-center justify-center border-4 border-background/20">
                      <span className="text-6xl font-bold text-background">40%</span>
                    </div>
                    <p className="mt-4 text-xl font-semibold text-background">OFF</p>
                    <p className="text-background/60">Select Items</p>
                  </div>
                </div>
                
                {/* Product highlights */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {['Smartphones', 'Laptops', 'Audio', 'Wearables'].map((category) => (
                    <div 
                      key={category}
                      className="px-4 py-2 bg-background/10 rounded-lg text-center text-sm text-background/80 transition-all duration-200 hover:bg-background/20"
                    >
                      {category}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-bold shadow-lg">
                Hot Deal
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
