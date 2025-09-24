import { SkeletonStyled } from "@/components/ui/skeleton-styled"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonStyled className="h-8 w-48" />
          <SkeletonStyled className="mt-2 h-4 w-96" />
        </div>
        <SkeletonStyled className="h-12 w-48" />
      </div>

      {/* Stats cards skeleton */}
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

      {/* Charts section skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales chart */}
        <div className="rounded-lg border border-camouflage-green-200 bg-white p-6">
          <SkeletonStyled className="mb-4 h-6 w-32" />
          <SkeletonStyled className="h-64 w-full" />
        </div>

        {/* Inventory chart */}
        <div className="rounded-lg border border-camouflage-green-200 bg-white p-6">
          <SkeletonStyled className="mb-4 h-6 w-32" />
          <SkeletonStyled className="h-64 w-full" />
        </div>
      </div>

      {/* Recent activity skeleton */}
      <div className="rounded-lg border border-camouflage-green-200 bg-white p-6">
        <SkeletonStyled className="mb-4 h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-camouflage-green-100 p-3"
            >
              <div className="flex items-center gap-3">
                <SkeletonStyled className="h-8 w-8 rounded-full" />
                <div>
                  <SkeletonStyled className="h-4 w-32" />
                  <SkeletonStyled className="mt-1 h-3 w-20" />
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
