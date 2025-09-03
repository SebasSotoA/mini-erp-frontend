import { SkeletonStyled } from "@/components/ui/skeleton-styled"

export default function Loading() {
  return (
    <div className="flex h-screen bg-camouflage-green-50">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex w-64 bg-white border-r border-camouflage-green-200">
        <div className="w-full p-6 space-y-6">
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
      <div className="flex-1 flex flex-col">
        {/* Mobile header skeleton */}
        <div className="bg-white shadow-sm border-b border-camouflage-green-200 lg:hidden">
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
              <div className="flex justify-between items-center">
                <div>
                  <SkeletonStyled className="h-8 w-48" />
                  <SkeletonStyled className="h-4 w-96 mt-2" />
                </div>
                <SkeletonStyled className="h-12 w-48" />
              </div>

              {/* Cards skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-lg border border-camouflage-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <SkeletonStyled className="h-4 w-20" />
                        <SkeletonStyled className="h-8 w-16 mt-2" />
                      </div>
                      <SkeletonStyled className="h-8 w-8 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart skeleton */}
              <div className="bg-white p-6 rounded-lg border border-camouflage-green-200">
                <SkeletonStyled className="h-6 w-32 mb-4" />
                <SkeletonStyled className="h-64 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
