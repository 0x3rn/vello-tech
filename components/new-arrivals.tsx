import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCard, type ProductData } from '@/components/product-card'

export function NewArrivals({ products }: { products: ProductData[] }) {
  if (products.length === 0) return null

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Just landed</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111214] md:text-4xl">New arrivals</h2>
            <p className="mt-3 text-sm text-[#656A73] md:text-base">The latest additions to the VelloTech collection.</p>
          </div>
          <Link href="/new-arrivals" className="inline-flex items-center gap-2 text-sm font-semibold text-[#111214] hover:text-primary">
            Explore new arrivals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  )
}
