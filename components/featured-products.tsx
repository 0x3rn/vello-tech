'use client'

import { useState } from 'react'
import { Star, Heart, ShoppingCart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
  },
]

function ProductCard({ product }: { product: typeof products[0] }) {
  const [isLiked, setIsLiked] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className="group bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-square bg-secondary p-6 overflow-hidden">
        <div className={cn(
          'w-full h-full rounded-xl flex items-center justify-center transition-transform duration-500',
          product.color,
          isHovered ? 'scale-110' : 'scale-100'
        )}>
          <div className="w-24 h-24 bg-foreground/5 rounded-2xl transition-transform duration-300 group-hover:rotate-3" />
        </div>
        
        {/* Badges */}
        {product.badge && (
          <Badge 
            className={cn(
              'absolute top-4 left-4 transition-transform duration-300',
              isHovered ? 'scale-105' : 'scale-100',
              product.badge === 'Sale' && 'bg-destructive text-destructive-foreground',
              product.badge === 'New' && 'bg-primary text-primary-foreground',
              product.badge === 'Best Seller' && 'bg-foreground text-background',
              product.badge === 'Popular' && 'bg-accent text-accent-foreground'
            )}
          >
            {product.badge}
          </Badge>
        )}

        {/* Action buttons */}
        <div className={cn(
          'absolute top-4 right-4 flex flex-col gap-2 transition-all duration-300',
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
        )}>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              'w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center border border-border transition-all duration-200 hover:scale-110',
              isLiked && 'bg-destructive/10 border-destructive/20'
            )}
          >
            <Heart className={cn(
              'h-5 w-5 transition-colors duration-200',
              isLiked ? 'fill-destructive text-destructive' : 'text-muted-foreground'
            )} />
          </button>
          <button className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center border border-border transition-all duration-200 hover:scale-110">
            <Eye className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Quick add button */}
        <div className={cn(
          'absolute bottom-4 left-4 right-4 transition-all duration-300',
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}>
          <Button className="w-full transition-transform duration-200 hover:scale-[1.02]" size="sm">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-muted-foreground">{product.category}</p>
        <h3 className="font-semibold text-foreground mt-1 transition-colors duration-200 group-hover:text-primary">
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  'h-3.5 w-3.5 transition-colors duration-200',
                  i < Math.floor(product.rating) 
                    ? 'fill-amber-400 text-amber-400' 
                    : 'fill-muted text-muted'
                )} 
              />
            ))}
          </div>
          <span className="text-sm font-medium text-foreground ml-1">{product.rating}</span>
          <span className="text-sm text-muted-foreground">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-lg font-bold text-foreground">
            ${product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toLocaleString()}
            </span>
          )}
          {product.originalPrice && (
            <Badge variant="secondary" className="ml-auto text-xs">
              Save ${(product.originalPrice - product.price).toLocaleString()}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

export function FeaturedProducts() {
  const [activeFilter, setActiveFilter] = useState('All')
  const filters = ['All', 'New', 'Sale', 'Best Seller', 'Popular']

  return (
    <section id="products" className="py-20 lg:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
              Featured Products
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Handpicked selection of our best-selling and most-loved tech products.
            </p>
          </div>
          <Button variant="outline" className="transition-transform duration-200 hover:scale-105">
            View All Products
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                activeFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
