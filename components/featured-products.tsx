'use client'

import { useState } from 'react'
import { Star, Heart, ShoppingCart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const products = [
  {
    id: 1,
    name: 'ProMax Smartphone X1',
    category: 'Smartphones',
    price: 1299,
    originalPrice: 1499,
    rating: 4.9,
    reviews: 234,
    badge: 'New',
    color: 'bg-blue-500/10',
    hoverColor: 'group-hover:bg-blue-500/20',
  },
  {
    id: 2,
    name: 'UltraBook Pro 16"',
    category: 'Laptops',
    price: 2499,
    originalPrice: null,
    rating: 4.8,
    reviews: 156,
    badge: 'Best Seller',
    color: 'bg-purple-500/10',
    hoverColor: 'group-hover:bg-purple-500/20',
  },
  {
    id: 3,
    name: 'SoundWave Elite ANC',
    category: 'Audio',
    price: 349,
    originalPrice: 449,
    rating: 4.7,
    reviews: 423,
    badge: 'Sale',
    color: 'bg-orange-500/10',
    hoverColor: 'group-hover:bg-orange-500/20',
  },
  {
    id: 4,
    name: 'SmartWatch Series 8',
    category: 'Wearables',
    price: 499,
    originalPrice: null,
    rating: 4.9,
    reviews: 312,
    badge: null,
    color: 'bg-teal-500/10',
    hoverColor: 'group-hover:bg-teal-500/20',
  },
  {
    id: 5,
    name: 'ActionCam 4K Pro',
    category: 'Cameras',
    price: 599,
    originalPrice: 699,
    rating: 4.6,
    reviews: 189,
    badge: 'Sale',
    color: 'bg-red-500/10',
    hoverColor: 'group-hover:bg-red-500/20',
  },
  {
    id: 6,
    name: 'GamePad Elite X',
    category: 'Gaming',
    price: 179,
    originalPrice: null,
    rating: 4.8,
    reviews: 567,
    badge: 'Popular',
    color: 'bg-green-500/10',
    hoverColor: 'group-hover:bg-green-500/20',
  },
  {
    id: 7,
    name: 'WirelessBuds Pro',
    category: 'Audio',
    price: 249,
    originalPrice: 299,
    rating: 4.7,
    reviews: 891,
    badge: 'Sale',
    color: 'bg-pink-500/10',
    hoverColor: 'group-hover:bg-pink-500/20',
  },
  {
    id: 8,
    name: 'TabletPro 12.9"',
    category: 'Tablets',
    price: 1099,
    originalPrice: null,
    rating: 4.9,
    reviews: 234,
    badge: 'New',
    color: 'bg-indigo-500/10',
    hoverColor: 'group-hover:bg-indigo-500/20',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
}

function ProductCard({ product }: { product: typeof products[0] }) {
  const [isLiked, setIsLiked] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div 
      variants={itemVariants}
      className="group bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className={cn("relative aspect-square p-6 overflow-hidden transition-colors duration-500", product.color, product.hoverColor)}>
        <div className={cn(
          'w-full h-full rounded-2xl flex items-center justify-center transition-colors duration-300'
        )}>
          <div className="w-32 h-32 bg-foreground/5 rounded-xl shadow-inner transition-colors duration-300" />
        </div>
        
        {/* Badges */}
        {product.badge && (
          <Badge 
            className={cn(
              'absolute top-4 left-4 border-none shadow-sm font-bold px-3 py-1 text-xs',
              product.badge === 'Sale' && 'bg-destructive/90 text-destructive-foreground',
              product.badge === 'New' && 'bg-primary/90 text-primary-foreground',
              product.badge === 'Best Seller' && 'bg-foreground/90 text-background',
              product.badge === 'Popular' && 'bg-accent/90 text-accent-foreground'
            )}
          >
            {product.badge}
          </Badge>
        )}

        {/* Action buttons */}
        <div className={cn(
          'absolute top-4 right-4 flex flex-col gap-3 transition-all duration-500 ease-out',
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
        )}>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              'w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border shadow-sm transition-colors duration-300 hover:bg-secondary',
              isLiked && 'bg-destructive/10 border-destructive/20 text-destructive'
            )}
          >
            <Heart className={cn(
              'h-5 w-5 transition-colors duration-300',
              isLiked ? 'fill-destructive text-destructive' : 'text-foreground'
            )} />
          </button>
          <button className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border shadow-sm transition-colors duration-300 hover:bg-secondary">
            <Eye className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Quick add button */}
        <div className={cn(
          'absolute bottom-4 left-4 right-4 transition-all duration-500 ease-out',
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        )}>
          <Button className="w-full rounded-xl shadow-lg transition-transform duration-300 hover:scale-[1.02]" size="default">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{product.category}</p>
        <h3 className="font-bold text-foreground mt-2 text-lg transition-colors duration-300 group-hover:text-primary">
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  'h-4 w-4 transition-colors duration-300',
                  i < Math.floor(product.rating) 
                    ? 'fill-amber-400 text-amber-400' 
                    : 'fill-muted text-muted'
                )} 
              />
            ))}
          </div>
          <span className="text-sm font-bold text-foreground ml-1">{product.rating}</span>
          <span className="text-sm text-muted-foreground">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-xl font-extrabold text-foreground">
            ${product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/50">
              ${product.originalPrice.toLocaleString()}
            </span>
          )}
          {product.originalPrice && (
            <Badge variant="secondary" className="ml-auto text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              Save ${(product.originalPrice - product.price).toLocaleString()}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function FeaturedProducts() {
  const [activeFilter, setActiveFilter] = useState('All')
  const filters = ['All', 'New', 'Sale', 'Best Seller', 'Popular']

  const filteredProducts = activeFilter === 'All' 
    ? products 
    : products.filter(p => p.badge === activeFilter || (activeFilter === 'Sale' && p.originalPrice))

  return (
    <section id="products" className="py-24 lg:py-32 bg-background relative">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Featured <span className="text-primary">Products</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl text-lg">
              Handpicked selection of our best-selling and most-loved tech products.
            </p>
          </div>
          <Button variant="outline" className="rounded-full px-8 transition-transform duration-300 hover:scale-105 border-primary/20 hover:bg-primary/5 hover:text-primary">
            View All Products
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center gap-3 mb-10 overflow-x-auto pb-4 scrollbar-hide"
        >
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors border',
                activeFilter === filter
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
              )}
            >
              {filter}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeFilter}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
