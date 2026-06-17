'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Smartphone, Laptop, Headphones, Watch, Camera, Gamepad2, ArrowRight, HardDrive, Cpu, Wifi, Cable } from 'lucide-react'
import { cn } from '@/lib/utils'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const iconMap: Record<string, any> = {
  'smartphones': Smartphone,
  'laptops': Laptop,
  'audio': Headphones,
  'wearables': Watch,
  'cameras': Camera,
  'gaming': Gamepad2,
  'storage-and-memory': HardDrive,
  'pc-components': Cpu,
  'networking': Wifi,
  'accessories': Cable,
}
const defaultIcon = Smartphone

const colors = [
  { color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', hoverColor: 'hover:bg-blue-500/20 hover:border-blue-500/30 hover:shadow-blue-500/10' },
  { color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', hoverColor: 'hover:bg-purple-500/20 hover:border-purple-500/30 hover:shadow-purple-500/10' },
  { color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', hoverColor: 'hover:bg-orange-500/20 hover:border-orange-500/30 hover:shadow-orange-500/10' },
  { color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400', hoverColor: 'hover:bg-teal-500/20 hover:border-teal-500/30 hover:shadow-teal-500/10' },
  { color: 'bg-red-500/10 text-red-600 dark:text-red-400', hoverColor: 'hover:bg-red-500/20 hover:border-red-500/30 hover:shadow-red-500/10' },
  { color: 'bg-green-500/10 text-green-600 dark:text-green-400', hoverColor: 'hover:bg-green-500/20 hover:border-green-500/30 hover:shadow-green-500/10' },
  { color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', hoverColor: 'hover:bg-yellow-500/20 hover:border-yellow-500/30 hover:shadow-yellow-500/10' },
  { color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', hoverColor: 'hover:bg-cyan-500/20 hover:border-cyan-500/30 hover:shadow-cyan-500/10' },
  { color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400', hoverColor: 'hover:bg-pink-500/20 hover:border-pink-500/30 hover:shadow-pink-500/10' },
]

export function Categories() {
  const [categories, setCategories] = useState<{id: string, name: string, slug: string}[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch valid categories
        const catSnap = await getDocs(collection(db, 'categories'))
        const fetchedCats: {id: string, name: string, slug: string}[] = []
        const ignoreNames = ['new', 'used', 'refurbished']
        catSnap.forEach(doc => {
          const data = doc.data()
          if (!ignoreNames.includes((data.name || '').toLowerCase()) && !data.parentCategoryId) {
            fetchedCats.push({ id: doc.id, name: data.name, slug: data.slug })
          }
        })
        
        // Sort by predefined "commonness" order
        const commonOrder = [
          'smartphones', 'laptops', 'audio', 'wearables', 'cameras', 
          'gaming', 'storage-and-memory', 'pc-components', 'networking', 'accessories'
        ]
        
        fetchedCats.sort((a, b) => {
          const indexA = commonOrder.indexOf(a.slug)
          const indexB = commonOrder.indexOf(b.slug)
          if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name)
          if (indexA === -1) return 1
          if (indexB === -1) return -1
          return indexA - indexB
        })
        
        setCategories(fetchedCats)

        // Fetch products to compute counts per category
        const prodSnap = await getDocs(collection(db, 'products'))
        const newCounts: Record<string, number> = {}
        
        prodSnap.forEach(doc => {
          const catId = doc.data().categoryId
          if (catId) {
            newCounts[catId] = (newCounts[catId] || 0) + 1
          }
        })
        
        setCounts(newCounts)
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }
    
    fetchData()
  }, [])

  return (
    <section id="categories" className="py-16 lg:py-20 bg-secondary/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-px bg-primary/20" />
      
      <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
            Shop by <span className="text-primary">Category</span>
          </h2>
          <p className="mt-6 text-muted-foreground max-w-2xl mx-auto text-base">
            Browse our extensive collection organized by category for easy navigation and discovering exactly what you need.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-6">
          {categories.map((category, index) => {
            const Icon = iconMap[category.slug] || defaultIcon
            const count = counts[category.id] || 0
            const colorTheme = colors[index % colors.length]
            
            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className={cn(
                  'group relative block bg-card/80 backdrop-blur-sm rounded-3xl sm:rounded-[2rem] p-4 sm:p-6 border border-white/10 dark:border-white/5 transition-colors transform duration-300',
                  'hover:shadow-lg',
                  colorTheme.hoverColor
                )}
              >
                <div className={cn(
                  'w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-colors duration-300 shadow-inner',
                  colorTheme.color
                )}>
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <h3 className="font-bold text-foreground mb-1 sm:mb-1.5 transition-colors duration-200 group-hover:text-primary text-base sm:text-lg">
                  {category.name}
                </h3>
                <p className="text-sm font-medium text-muted-foreground">{count} Products</p>
                
                <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
