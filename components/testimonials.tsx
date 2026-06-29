'use client'

import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export interface TestimonialData {
  name: string
  role: string
  content: string
  rating: number
  avatar: string
}
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const }
  }
}

export function Testimonials({ initialTestimonials }: { initialTestimonials: TestimonialData[] }) {
  if (!initialTestimonials || initialTestimonials.length === 0) return null;

  return (
    <section className="py-10 lg:py-14 bg-secondary/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5" />
      <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            What Our <span className="text-primary">Customers Say</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-sm">
            Join thousands of satisfied customers who trust Vello Tech for their tech needs.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex overflow-x-auto pb-6 gap-4 md:gap-6 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {initialTestimonials.map((testimonial, index) => (
            <motion.div 
              variants={itemVariants} 
              key={index} 
              className="flex-none w-[90vw] md:w-[calc(33.333%-1rem)] snap-center"
            >
              <Card 
                className="bg-card/80 backdrop-blur-sm border-white/5 transition-all duration-500 hover:shadow-lg group rounded-xl md:rounded-2xl overflow-hidden h-full"
              >
                <CardContent className="p-6 relative h-full flex flex-col">
                  {/* Quote icon */}
                  <Quote className="absolute top-4 right-4 h-6 w-6 text-primary/10 transition-colors duration-500 group-hover:text-primary/20" />
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star 
                        key={i} 
                        className="h-4 w-4 fill-amber-400 text-amber-400" 
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-foreground leading-relaxed mb-6 text-sm font-medium italic flex-grow relative z-10">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
                      <span className="text-xs font-bold text-white">
                        {testimonial.avatar}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
