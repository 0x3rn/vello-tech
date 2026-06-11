'use client'

import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Tech Enthusiast',
    content: "Vello Tech has become my go-to store for all gadgets. The quality and customer service are exceptional!",
    rating: 5,
    avatar: 'SJ',
  },
  {
    name: 'Michael Chen',
    role: 'Software Developer',
    content: "Fast shipping, great prices, and authentic products. I've ordered multiple times and never been disappointed.",
    rating: 5,
    avatar: 'MC',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Content Creator',
    content: "The product selection is amazing. Found exactly what I needed for my setup at a competitive price.",
    rating: 5,
    avatar: 'ER',
  },
]

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

export function Testimonials() {
  return (
    <section className="py-24 lg:py-32 bg-secondary/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5" />
      <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            What Our <span className="text-primary">Customers Say</span>
          </h2>
          <p className="mt-6 text-muted-foreground max-w-2xl mx-auto text-lg">
            Join thousands of satisfied customers who trust Vello Tech for their tech needs.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div variants={itemVariants} key={index}>
              <Card 
                className="bg-card/80 backdrop-blur-sm border-white/5 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group rounded-2xl md:rounded-3xl"
              >
                <CardContent className="p-8 relative h-full flex flex-col">
                  {/* Quote icon */}
                  <Quote className="absolute top-6 right-6 h-10 w-10 text-primary/10 transition-colors duration-500 group-hover:text-primary/20" />
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-6">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star 
                        key={i} 
                        className="h-5 w-5 fill-amber-400 text-amber-400 transition-transform duration-300 group-hover:scale-110" 
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-foreground leading-relaxed mb-8 text-lg font-medium italic flex-grow relative z-10">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg">
                      <span className="text-sm font-bold text-white">
                        {testimonial.avatar}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground font-medium">{testimonial.role}</p>
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
