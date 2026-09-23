import { BadgeCheck, LockKeyhole, RotateCcw, Truck } from 'lucide-react'

const features = [
  { icon: Truck, title: 'Free shipping', detail: 'On qualifying orders' },
  { icon: RotateCcw, title: '30-day returns', detail: 'Simple, hassle-free returns' },
  { icon: LockKeyhole, title: 'Secure checkout', detail: 'Protected payments' },
  { icon: BadgeCheck, title: 'Genuine products', detail: 'Quality checked' },
]

export function Features() {
  return (
    <section aria-label="Shopping benefits" className="border-b border-[#E7E9ED] bg-white">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 px-4 py-5 md:grid-cols-4 lg:px-8 lg:py-7">
        {features.map(({ icon: Icon, title, detail }, index) => (
          <div key={title} className={`flex items-start gap-3 px-3 py-3 md:px-6 ${index > 0 ? 'md:border-l md:border-[#E7E9ED]' : ''}`}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.7} />
            <div>
              <p className="text-sm font-semibold text-[#111214]">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#656A73]">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
