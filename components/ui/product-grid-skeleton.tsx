import { Skeleton } from "@/components/ui/skeleton"

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="min-w-0">
          <Skeleton className="aspect-square w-full rounded-2xl bg-[#F5F6F8]" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-3 h-6 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
