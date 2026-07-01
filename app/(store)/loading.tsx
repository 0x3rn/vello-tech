import { Skeleton } from "@/components/ui/skeleton"

export default function StoreLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Skeleton (adjusting to visual size of typical hero) */}
      <div className="w-full h-[400px] md:h-[600px] bg-secondary/20 relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Skeleton className="h-12 w-3/4 max-w-lg" />
          <Skeleton className="h-6 w-1/2 max-w-md" />
          <Skeleton className="h-10 w-32 mt-4" />
        </div>
      </div>

      {/* Main Content Skeleton Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12">
        {/* Section Title Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-48 md:h-64 w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
