import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ProductData } from '@/components/product-card'
import { resolveImageUrl } from '@/lib/utils'

export function PromoSection({ product }: { product?: ProductData }) {
  return (
    <section id="deals" className="bg-[#101114] text-white">
      <div className="mx-auto grid max-w-[1440px] items-center gap-8 overflow-hidden px-6 py-16 sm:px-8 lg:min-h-[460px] lg:grid-cols-2 lg:gap-16 lg:px-16 lg:py-20">
        <div className="relative z-10">
          <h2 className="max-w-lg text-4xl font-semibold leading-[1.02] tracking-[-0.04em] md:text-5xl">
            Great tech.<br />Better prices.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/60">
            Discover standout deals across the devices you use every day.
          </p>
          <Link href="/shop?sale=true" className="mt-8 inline-flex h-12 items-center gap-3 rounded-[11px] bg-primary px-6 text-sm font-semibold text-white transition-colors duration-[220ms] hover:bg-primary/90">
            Shop the sale <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {product && (
          <Link href={`/product/${product.slug}`} className="relative block aspect-[4/3] min-h-[260px] lg:h-full" aria-label={`View ${product.name}`}>
            <Image src={resolveImageUrl(product.imageUrls[0])} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-[4%]" />
            <span className="absolute bottom-0 right-0 text-xs font-medium text-white/60">{product.name}</span>
          </Link>
        )}
      </div>
    </section>
  )
}
