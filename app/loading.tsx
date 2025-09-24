import { SkeletonStyled } from "@/components/ui/skeleton-styled"

export default function Loading() {
  return (
    <div className="flex h-screen bg-camouflage-green-50">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 border-r border-camouflage-green-200 bg-white lg:flex">
        <div className="w-full space-y-6 p-6">
          {/* Logo skeleton */}
          <div className="flex items-center space-x-3">
            <SkeletonStyled className="h-8 w-8 rounded" />
            <SkeletonStyled className="h-6 w-32" />
          </div>

          {/* Navigation skeleton */}
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2">
                <SkeletonStyled className="h-5 w-5 rounded" />
                <SkeletonStyled className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header skeleton */}
        <div className="border-b border-camouflage-green-200 bg-white shadow-sm lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <SkeletonStyled className="h-6 w-6 rounded" />
            <SkeletonStyled className="h-6 w-32" />
            <div className="w-10" />
          </div>
        </div>

        {/* Content skeleton */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
              {/* Header skeleton */}
              <div className="flex items-center justify-between">
                <div>
                  <SkeletonStyled className="h-8 w-48" />
                  <SkeletonStyled className="mt-2 h-4 w-96" />
                </div>
                <SkeletonStyled className="h-12 w-48" />
              </div>

              {/* Cards skeleton */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-camouflage-green-200 bg-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <SkeletonStyled className="h-4 w-20" />
                        <SkeletonStyled className="mt-2 h-8 w-16" />
                      </div>
                      <SkeletonStyled className="h-8 w-8 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart skeleton */}
              <div className="rounded-lg border border-camouflage-green-200 bg-white p-6">
                <SkeletonStyled className="mb-4 h-6 w-32" />
                <SkeletonStyled className="h-64 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
