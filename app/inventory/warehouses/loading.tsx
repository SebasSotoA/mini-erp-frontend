import { Warehouse } from "lucide-react"

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
            <div className="flex items-center">
              <Warehouse className="mr-3 h-8 w-8 text-camouflage-green-700" />
              <SkeletonStyled className="h-8 w-48" />
            </div>
            <SkeletonStyled className="mt-2 h-4 w-96" />
          </div>
          <div className="flex items-center gap-3">
            {/* Search bar skeleton */}
            <div className="flex h-10 items-center gap-2 rounded-lg border border-camouflage-green-300 bg-white px-3 shadow-sm">
              <SkeletonStyled className="h-4 w-4" />
              <SkeletonStyled className="h-4 w-64" />
            </div>
            <SkeletonStyled className="h-12 w-40" />
          </div>
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
              <div className="grid grid-cols-5 gap-4 px-6 py-3">
                <SkeletonStyled className="h-4 w-4" />
                <SkeletonStyled className="h-4 w-16" />
                <SkeletonStyled className="h-4 w-20" />
                <SkeletonStyled className="h-4 w-24" />
                <SkeletonStyled className="h-4 w-20" />
              </div>
            </div>

            {/* Table rows skeleton */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border-b border-camouflage-green-100 px-6 py-4">
                <div className="grid grid-cols-5 items-center gap-4">
                  <SkeletonStyled className="h-4 w-4" />
                  <SkeletonStyled className="h-4 w-32" />
                  <SkeletonStyled className="h-4 w-40" />
                  <SkeletonStyled className="h-4 w-48" />
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
        </Card>
      </div>
    </MainLayout>
  )
}
