import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SkeletonStyled } from "@/components/ui/skeleton-styled"
import { ShoppingCart } from "lucide-react"

export default function Loading() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 mr-3 text-camouflage-green-700" />
                              <SkeletonStyled className="h-8 w-48" />
            </div>
            <SkeletonStyled className="h-4 w-96 mt-2" />
          </div>
          <SkeletonStyled className="h-12 w-48" />
        </div>

        {/* Table skeleton */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <SkeletonStyled className="h-6 w-40" />
              <SkeletonStyled className="h-9 w-20" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Table header skeleton */}
            <div className="border-b border-camouflage-green-200">
              <div className="grid grid-cols-7 gap-4 px-6 py-3">
                <SkeletonStyled className="h-4 w-4" />
                <SkeletonStyled className="h-4 w-16" />
                <SkeletonStyled className="h-4 w-20" />
                <SkeletonStyled className="h-4 w-12" />
                <SkeletonStyled className="h-4 w-24" />
                <SkeletonStyled className="h-4 w-16" />
                <SkeletonStyled className="h-4 w-20" />
              </div>
            </div>
            
            {/* Table rows skeleton */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="border-b border-camouflage-green-100 px-6 py-4">
                <div className="grid grid-cols-7 gap-4 items-center">
                  <SkeletonStyled className="h-4 w-4" />
                  <SkeletonStyled className="h-4 w-32" />
                  <SkeletonStyled className="h-4 w-20" />
                  <SkeletonStyled className="h-4 w-16" />
                  <SkeletonStyled className="h-4 w-40" />
                  <SkeletonStyled className="h-6 w-12 rounded-full" />
                  <div className="flex gap-1">
                    <SkeletonStyled className="h-8 w-8" />
                    <SkeletonStyled className="h-8 w-8" />
                    <SkeletonStyled className="h-8 w-8" />
                    <SkeletonStyled className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          
          {/* Pagination skeleton */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-camouflage-green-200 bg-camouflage-green-50/30">
            <div className="flex items-center gap-6">
              <SkeletonStyled className="h-4 w-24" />
              <SkeletonStyled className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <SkeletonStyled className="h-4 w-32" />
                <SkeletonStyled className="h-8 w-16" />
              </div>
              <div className="flex items-center gap-1">
                <SkeletonStyled className="h-8 w-8" />
                <SkeletonStyled className="h-8 w-8" />
                <SkeletonStyled className="h-8 w-8" />
                <SkeletonStyled className="h-8 w-8" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
