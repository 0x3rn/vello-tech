import { Skeleton } from "@/components/ui/skeleton"

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-4 w-24 mb-4" /> {/* Back link */}
          <Skeleton className="h-8 w-48" /> {/* Title */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Checkout Flow Skeleton */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <Skeleton className="h-[200px] w-full rounded-2xl" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>

          {/* Order Summary Skeleton */}
          <div className="lg:col-span-5 xl:col-span-4">
            <Skeleton className="h-[500px] w-full rounded-2xl sticky top-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
