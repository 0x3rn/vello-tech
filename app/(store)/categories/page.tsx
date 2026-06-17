'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Laptop, Smartphone, Headphones, Watch, Camera, Gamepad, HardDrive, Cpu, Wifi, Cable, Smartphone as SmartphoneFallback } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'

const iconMap: Record<string, any> = {
  'smartphones': Smartphone,
  'laptops': Laptop,
  'audio': Headphones,
  'wearables': Watch,
  'cameras': Camera,
  'gaming': Gamepad,
  'storage-and-memory': HardDrive,
  'pc-components': Cpu,
  'networking': Wifi,
  'accessories': Cable,
}
const defaultIcon = SmartphoneFallback

const colors = [
  { color: 'bg-blue-500/10 text-blue-600', hoverColor: 'hover:bg-blue-500/20' },
  { color: 'bg-purple-500/10 text-purple-600', hoverColor: 'hover:bg-purple-500/20' },
  { color: 'bg-orange-500/10 text-orange-600', hoverColor: 'hover:bg-orange-500/20' },
  { color: 'bg-teal-500/10 text-teal-600', hoverColor: 'hover:bg-teal-500/20' },
  { color: 'bg-red-500/10 text-red-600', hoverColor: 'hover:bg-red-500/20' },
  { color: 'bg-green-500/10 text-green-600', hoverColor: 'hover:bg-green-500/20' },
  { color: 'bg-yellow-500/10 text-yellow-600', hoverColor: 'hover:bg-yellow-500/20' },
  { color: 'bg-cyan-500/10 text-cyan-600', hoverColor: 'hover:bg-cyan-500/20' },
  { color: 'bg-pink-500/10 text-pink-600', hoverColor: 'hover:bg-pink-500/20' },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<{id: string, name: string, slug: string}[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catSnap = await getDocs(collection(db, 'categories'))
        const fetchedCats: {id: string, name: string, slug: string}[] = []
        const ignoreNames = ['new', 'used', 'refurbished']
        catSnap.forEach(doc => {
          const data = doc.data()
          if (!ignoreNames.includes((data.name || '').toLowerCase()) && !data.parentCategoryId) {
            fetchedCats.push({ id: doc.id, name: data.name, slug: data.slug })
          }
        })
        
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
    <div className="min-h-screen bg-background">
      <div className="pt-16 pb-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-12">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight mb-4">
              All Categories
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Browse our complete collection of premium tech products across all categories.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const Icon = iconMap[category.slug] || defaultIcon
              const count = counts[category.id] || 0
              const colorTheme = colors[index % colors.length]

              return (
                <Link 
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110', colorTheme.color)}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
                    {category.name}
                  </h3>
                  <div className="flex items-center text-sm font-medium text-primary opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                    Browse Category <span className="ml-2">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
