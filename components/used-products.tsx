'use client'

import { ArrowRight, BadgeCheck, ShieldCheck, Wrench } from 'lucide-react'
import Link from 'next/link'
import { ProductCard, type ProductData } from '@/components/product-card'

export function UsedProducts({ initialProducts = [] }: {
  initialProducts?: ProductData[]
  categories?: { id: string; name: string }[]
}) {
  if (!initialProducts.length) return null

  return (
    <section className="bg-[#F5F6F8] py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-[#111214] md:text-4xl">Pre-owned tech</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#656A73] md:text-base">Certified and inspected. Every refurbished device is quality checked before sale.</p>
          </div>
          <Link href="/used" className="inline-flex items-center gap-2 text-sm font-semibold text-[#111214] hover:text-primary">
            Explore pre-owned <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 border-t border-[#E1E4E8] pt-5 text-xs font-medium text-[#656A73] sm:text-sm">
          <span className="inline-flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Tested hardware</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Warranty included</span>
          <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /> Verified condition</span>
        </div>
        <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
          {initialProducts.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  )
}
