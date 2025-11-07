import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SkeletonStyled } from "@/components/ui/skeleton-styled"

export default function Loading() {
  return (
    <MainLayout>
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
            <Card key={i} className="border-camouflage-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <SkeletonStyled className="h-4 w-20" />
                    <SkeletonStyled className="mt-2 h-8 w-16" />
                  </div>
                  <SkeletonStyled className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts section skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sales chart */}
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <SkeletonStyled className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <SkeletonStyled className="h-64 w-full" />
            </CardContent>
          </Card>

          {/* Inventory chart */}
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <SkeletonStyled className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <SkeletonStyled className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Recent activity skeleton */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <SkeletonStyled className="h-6 w-40" />
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
