import { SkeletonStyled } from "@/components/ui/skeleton-styled"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <SkeletonStyled className="h-8 w-48" />
          <SkeletonStyled className="h-4 w-96 mt-2" />
        </div>
        <SkeletonStyled className="h-12 w-48" />
      </div>

      {/* Stats cards skeleton */}
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

      {/* Charts section skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales chart */}
        <div className="bg-white p-6 rounded-lg border border-camouflage-green-200">
          <SkeletonStyled className="h-6 w-32 mb-4" />
          <SkeletonStyled className="h-64 w-full" />
        </div>
        
        {/* Inventory chart */}
        <div className="bg-white p-6 rounded-lg border border-camouflage-green-200">
          <SkeletonStyled className="h-6 w-32 mb-4" />
          <SkeletonStyled className="h-64 w-full" />
        </div>
      </div>

      {/* Recent activity skeleton */}
      <div className="bg-white p-6 rounded-lg border border-camouflage-green-200">
        <SkeletonStyled className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-camouflage-green-100 rounded-lg">
              <div className="flex items-center gap-3">
                <SkeletonStyled className="h-8 w-8 rounded-full" />
                <div>
                  <SkeletonStyled className="h-4 w-32" />
                  <SkeletonStyled className="h-3 w-20 mt-1" />
                </div>
              </div>
              <SkeletonStyled className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
