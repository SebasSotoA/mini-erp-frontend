import { Tags } from "lucide-react"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SkeletonStyled } from "@/components/ui/skeleton-styled"

export default function Loading() {
  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Tags className="mr-3 h-8 w-8 text-camouflage-green-700" />
            <SkeletonStyled className="h-8 w-64" />
          </div>
          <SkeletonStyled className="h-10 w-24" />
        </div>

        {/* Actions skeleton */}
        <div className="flex flex-wrap gap-2">
          <SkeletonStyled className="h-10 w-20" />
          <SkeletonStyled className="h-10 w-24" />
          <SkeletonStyled className="h-10 w-20" />
          <SkeletonStyled className="h-10 w-32" />
        </div>

        {/* Category info card skeleton */}
        <Card className="border-camouflage-green-200">
          <CardContent>
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Image skeleton */}
              <div className="flex justify-center lg:justify-start">
                <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-lg border-2 border-camouflage-green-200 bg-camouflage-green-50">
                  <SkeletonStyled className="h-20 w-20" />
                </div>
              </div>
              
              {/* Info skeleton */}
              <div className="flex-1">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <SkeletonStyled className="h-4 w-16" />
                    <SkeletonStyled className="h-5 w-32" />
                  </div>
                  <div className="space-y-1">
                    <SkeletonStyled className="h-4 w-12" />
                    <SkeletonStyled className="h-5 w-20" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <SkeletonStyled className="h-4 w-20" />
                    <SkeletonStyled className="h-5 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items table skeleton */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <SkeletonStyled className="h-6 w-40" />
              <div className="flex items-center gap-2">
                <SkeletonStyled className="h-9 w-20" />
                <SkeletonStyled className="h-9 w-20" />
              </div>
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
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-b border-camouflage-green-100 px-6 py-4">
                <div className="grid grid-cols-7 items-center gap-4">
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
          <div className="flex items-center justify-between border-t border-camouflage-green-200 bg-camouflage-green-50/30 px-6 py-4">
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
