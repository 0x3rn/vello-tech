import Link from 'next/link'
import { Laptop, Smartphone, Headphones, Watch, Camera, Gamepad, HardDrive, Cpu, Wifi, Cable } from 'lucide-react'

const categories = [
  { name: 'Smartphones', slug: 'smartphones', icon: Smartphone, count: 24, color: 'bg-blue-500/10 text-blue-600' },
  { name: 'Laptops', slug: 'laptops', icon: Laptop, count: 18, color: 'bg-purple-500/10 text-purple-600' },
  { name: 'Audio', slug: 'audio', icon: Headphones, count: 32, color: 'bg-pink-500/10 text-pink-600' },
  { name: 'Wearables', slug: 'wearables', icon: Watch, count: 15, color: 'bg-orange-500/10 text-orange-600' },
  { name: 'Cameras', slug: 'cameras', icon: Camera, count: 12, color: 'bg-teal-500/10 text-teal-600' },
  { name: 'Gaming', slug: 'gaming', icon: Gamepad, count: 28, color: 'bg-red-500/10 text-red-600' },
  { name: 'Storage & Memory', slug: 'storage-and-memory', icon: HardDrive, count: 45, color: 'bg-indigo-500/10 text-indigo-600' },
  { name: 'PC Components', slug: 'pc-components', icon: Cpu, count: 56, color: 'bg-cyan-500/10 text-cyan-600' },
  { name: 'Networking', slug: 'networking', icon: Wifi, count: 14, color: 'bg-green-500/10 text-green-600' },
  { name: 'Accessories', slug: 'accessories', icon: Cable, count: 89, color: 'bg-yellow-500/10 text-yellow-600' },
]

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16 pb-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-4">
              All Categories
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Browse our complete collection of premium tech products across all categories.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link 
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${category.color}`}>
                    <category.icon className="h-7 w-7" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                    {category.count} items
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
                  {category.name}
                </h3>
                <div className="flex items-center text-sm font-medium text-primary opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  Browse Category <span className="ml-2">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
