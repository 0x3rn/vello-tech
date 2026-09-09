import Link from "next/link"
import {
  Cable,
  Camera,
  Cpu,
  Gamepad2,
  HardDrive,
  Headphones,
  Laptop,
  Smartphone,
  Watch,
  Wifi,
  type LucideIcon,
} from "lucide-react"

import { categorySummaries } from "@/components/categories"
import { listCategories, listStoreProducts } from "@/lib/neon/catalog"
import { cn } from "@/lib/utils"

const iconMap: Record<string, LucideIcon> = {
  smartphones: Smartphone,
  laptops: Laptop,
  audio: Headphones,
  wearables: Watch,
  cameras: Camera,
  gaming: Gamepad2,
  "storage-and-memory": HardDrive,
  "pc-components": Cpu,
  networking: Wifi,
  accessories: Cable,
}

const colors = [
  { color: "bg-blue-500/10 text-blue-600", hoverColor: "hover:bg-blue-500/20" },
  { color: "bg-purple-500/10 text-purple-600", hoverColor: "hover:bg-purple-500/20" },
  { color: "bg-orange-500/10 text-orange-600", hoverColor: "hover:bg-orange-500/20" },
  { color: "bg-teal-500/10 text-teal-600", hoverColor: "hover:bg-teal-500/20" },
  { color: "bg-red-500/10 text-red-600", hoverColor: "hover:bg-red-500/20" },
  { color: "bg-green-500/10 text-green-600", hoverColor: "hover:bg-green-500/20" },
  { color: "bg-yellow-500/10 text-yellow-600", hoverColor: "hover:bg-yellow-500/20" },
  { color: "bg-cyan-500/10 text-cyan-600", hoverColor: "hover:bg-cyan-500/20" },
  { color: "bg-pink-500/10 text-pink-600", hoverColor: "hover:bg-pink-500/20" },
]

export const revalidate = 60

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([listCategories(), listStoreProducts()])
  const summaries = categorySummaries(categories, products)

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16 pb-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-12">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight mb-4">All Categories</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">Browse our complete collection of premium tech products across all categories.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {summaries.map((category, index) => {
              const Icon = iconMap[category.slug] ?? Smartphone
              const colorTheme = colors[index % colors.length]
              return (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", colorTheme.color)}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                      {category.count} {category.count === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">{category.name}</h3>
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
