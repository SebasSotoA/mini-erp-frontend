import { ArrowLeft, Package } from "lucide-react"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SkeletonStyled } from "@/components/ui/skeleton-styled"

export default function Loading() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <SkeletonStyled className="h-10 w-10" />
          <div>
            <SkeletonStyled className="h-8 w-64" />
            <SkeletonStyled className="mt-2 h-4 w-48" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left side - Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic info card */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <SkeletonStyled className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-16" />
                    <SkeletonStyled className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-20" />
                    <SkeletonStyled className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <SkeletonStyled className="h-4 w-24" />
                  <SkeletonStyled className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Pricing card */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <SkeletonStyled className="h-6 w-20" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-24" />
                    <SkeletonStyled className="h-8 w-full" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-20" />
                    <SkeletonStyled className="h-8 w-full" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-16" />
                    <SkeletonStyled className="h-8 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock movements card */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <SkeletonStyled className="h-6 w-48" />
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
                          <SkeletonStyled className="h-4 w-20" />
                          <SkeletonStyled className="mt-1 h-3 w-16" />
                        </div>
                      </div>
                      <div className="text-right">
                        <SkeletonStyled className="h-4 w-12" />
                        <SkeletonStyled className="mt-1 h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Sidebar */}
          <div className="space-y-6">
            {/* Image card */}
            <Card className="border-camouflage-green-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-camouflage-green-50">
                    <Package className="h-14 w-14 text-camouflage-green-300" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonStyled className="h-6 w-32" />
                    <SkeletonStyled className="h-5 w-20" />
                    <SkeletonStyled className="h-4 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions card */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <SkeletonStyled className="h-6 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <SkeletonStyled className="h-10 w-full" />
                <SkeletonStyled className="h-10 w-full" />
                <SkeletonStyled className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
