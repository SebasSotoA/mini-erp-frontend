import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SkeletonStyled } from "@/components/ui/skeleton-styled"

export default function Loading() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <SkeletonStyled className="h-8 w-64" />
          <SkeletonStyled className="h-4 w-96 mt-2" />
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Type selection card */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <SkeletonStyled className="h-6 w-16" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <SkeletonStyled className="h-12 w-full" />
                  <SkeletonStyled className="h-12 w-full" />
                </div>
                <SkeletonStyled className="h-4 w-80 mt-3" />
              </CardContent>
            </Card>

            {/* General info card */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <SkeletonStyled className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <SkeletonStyled className="h-4 w-16" />
                  <SkeletonStyled className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-20" />
                    <SkeletonStyled className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-24" />
                    <SkeletonStyled className="h-10 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-20" />
                    <SkeletonStyled className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-32" />
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
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_180px_auto_1fr] items-end gap-4">
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-24" />
                    <SkeletonStyled className="h-10 w-full" />
                  </div>
                  <div className="text-center pb-3">
                    <SkeletonStyled className="h-4 w-4 mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-16" />
                    <SkeletonStyled className="h-10 w-full" />
                  </div>
                  <div className="text-center pb-3">
                    <SkeletonStyled className="h-4 w-4 mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-24" />
                    <SkeletonStyled className="h-10 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory detail card */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <SkeletonStyled className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <SkeletonStyled className="h-4 w-80" />
                <div className="space-y-2">
                  <SkeletonStyled className="h-4 w-32" />
                  <SkeletonStyled className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Cost card */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <SkeletonStyled className="h-6 w-16" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-sm">
                  <SkeletonStyled className="h-4 w-32" />
                  <SkeletonStyled className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Preview & actions */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              {/* Preview card */}
              <Card className="border-camouflage-green-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-camouflage-green-50 flex items-center justify-center">
                      <SkeletonStyled className="h-14 w-14" />
                    </div>
                    <div className="space-y-1">
                      <SkeletonStyled className="h-6 w-32" />
                      <SkeletonStyled className="h-5 w-20" />
                      <SkeletonStyled className="h-4 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <SkeletonStyled className="h-10 w-full" />
                  <SkeletonStyled className="h-10 w-full" />
                </div>
                <SkeletonStyled className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
