import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  markClassName?: string
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  admin?: boolean
}

const sizes = {
  sm: { mark: 'h-8 w-8', wordmark: 'text-[18px]', gap: 'gap-2' },
  md: { mark: 'h-10 w-10', wordmark: 'text-[21px]', gap: 'gap-2.5' },
  lg: { mark: 'h-16 w-16', wordmark: 'text-[28px]', gap: 'gap-3' },
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn('shrink-0', className)}>
      <path d="M3 5.5h9.1L20 24.1l3.8 8.9H17L3 5.5Z" className="fill-primary" />
      <path d="M27.9 5.5H37L23 33h-6.8l3.8-8.9 7.9-18.6Z" className="fill-foreground" />
      <path d="M29.5 5.5H37l-2.2 4.3h-7.1l1.8-4.3Z" className="fill-primary" />
    </svg>
  )
}

export function BrandLogo({ className, markClassName, size = 'md', showWordmark = true, admin = false }: BrandLogoProps) {
  const sizing = sizes[size]

  return (
    <span className={cn('inline-flex items-center', sizing.gap, className)}>
      <BrandMark className={cn(sizing.mark, markClassName)} />
      {showWordmark && (
        <span className="inline-flex items-center gap-2">
          <span className={cn('font-brand font-bold leading-none tracking-[-0.045em] text-foreground', sizing.wordmark)}>
            VelloTech
          </span>
          {admin && (
            <span className="rounded-md border border-border bg-secondary px-1.5 py-1 text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-muted-foreground">
              Admin
            </span>
          )}
        </span>
      )}
    </span>
  )
}
