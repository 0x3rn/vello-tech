import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
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

import type { StoreCategory, StoreProduct } from "@/lib/neon/catalog"
import { resolveImageUrl } from "@/lib/utils"

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

const commonOrder = [
  "smartphones", "laptops", "audio", "wearables", "cameras",
  "gaming", "storage-and-memory", "pc-components", "networking", "accessories",
]

const ignoredNames = new Set(["new", "used", "refurbished"])

export function categorySummaries(categories: StoreCategory[], products: StoreProduct[]) {
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const topLevel = categories
    .filter((category) => !category.parentCategoryId && !ignoredNames.has(category.name.toLowerCase()))
    .sort((a, b) => {
      const aIndex = commonOrder.indexOf(a.slug)
      const bIndex = commonOrder.indexOf(b.slug)
      if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })

  const counts = new Map<string, number>()
  for (const product of products) {
    const productTopCategories = new Set<string>()
    for (const id of [product.categoryId, product.subcategoryId]) {
      let current = id ? categoryById.get(id) : undefined
      while (current?.parentCategoryId) current = categoryById.get(current.parentCategoryId)
      if (current && !ignoredNames.has(current.name.toLowerCase())) productTopCategories.add(current.id)
    }
    for (const id of productTopCategories) counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  return topLevel.map((category) => ({ ...category, count: counts.get(category.id) ?? 0 }))
}

export function Categories({
  initialCategories,
  initialProducts,
}: {
  initialCategories: StoreCategory[]
  initialProducts: StoreProduct[]
}) {
  const summaries = categorySummaries(initialCategories, initialProducts)
  const preferred = ["laptops", "smartphones", "gaming", "wearables"]
  const categories = [
    ...preferred.map((slug) => summaries.find((category) => category.slug === slug)),
    ...summaries.filter((category) => !preferred.includes(category.slug)),
  ].filter((category): category is (typeof summaries)[number] => Boolean(category)).slice(0, 4)
  const categoryById = new Map(initialCategories.map((category) => [category.id, category]))

  function belongsToCategory(product: StoreProduct, categoryId: string) {
    let current = categoryById.get(product.subcategoryId || product.categoryId)
    while (current?.parentCategoryId) current = categoryById.get(current.parentCategoryId)
    return current?.id === categoryId || product.categoryId === categoryId
  }

  return (
    <section id="categories" className="py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <div className="mb-9 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Shop by category</h2>
          </div>
          <Link href="/categories" className="hidden items-center gap-2 text-sm font-medium text-foreground hover:text-primary sm:flex">
            All categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4 lg:grid-rows-2">
          {categories.map((category, index) => {
            const Icon = iconMap[category.slug] ?? Smartphone
            const product = initialProducts.find((item) => belongsToCategory(item, category.id) && item.imageUrls?.[0] && !item.imageUrls[0].includes('via.placeholder.com'))
            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className={`group relative min-h-[210px] overflow-hidden rounded-[20px] bg-[#F0F1F3] p-5 md:min-h-[250px] md:p-7 lg:min-h-[260px] ${index === 0 ? "col-span-2 min-h-[310px] lg:row-span-2 lg:min-h-[540px]" : ""} ${index === 1 ? "lg:col-span-2" : ""}`}
              >
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold tracking-tight text-[#111214] md:text-2xl">{category.name}</h3>
                  <p className="mt-1 text-xs text-[#656A73] md:text-sm">{category.count} products</p>
                </div>
                <div className={`absolute inset-x-[16%] bottom-[-9%] top-[40%] transition-transform duration-[220ms] ease-out group-hover:scale-[1.025] lg:top-[34%] ${index === 0 ? 'lg:top-[25%]' : ''}`}>
                  {product ? (
                    <Image src={resolveImageUrl(product.imageUrls[0])} alt="" fill sizes={index === 0 ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"} className="object-contain" />
                  ) : (
                    <Icon className="mx-auto h-full w-1/3 text-[#C1C7D0]" strokeWidth={1} />
                  )}
                </div>
                <ArrowRight className="absolute bottom-5 right-5 h-5 w-5 text-[#111214] transition-transform duration-[220ms] group-hover:translate-x-1" />
              </Link>
            )
          })}
        </div>
        <Link href="/categories" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary sm:hidden">All categories <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  )
}
