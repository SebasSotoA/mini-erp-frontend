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
          <SkeletonStyled className="mt-2 h-4 w-96" />
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left side - Form */}
          <div className="space-y-6 lg:col-span-2">
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
                <SkeletonStyled className="mt-3 h-4 w-80" />
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-20" />
                    <SkeletonStyled className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-24" />
                    <SkeletonStyled className="h-10 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_auto_180px_auto_1fr]">
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-24" />
                    <SkeletonStyled className="h-10 w-full" />
                  </div>
                  <div className="pb-3 text-center">
                    <SkeletonStyled className="mx-auto h-4 w-4" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonStyled className="h-4 w-16" />
                    <SkeletonStyled className="h-10 w-full" />
                  </div>
                  <div className="pb-3 text-center">
                    <SkeletonStyled className="mx-auto h-4 w-4" />
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
                <div className="max-w-sm space-y-2">
                  <SkeletonStyled className="h-4 w-32" />
                  <SkeletonStyled className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Preview & actions */}
          <div className="lg:col-span-1">
            <div className="space-y-4 lg:sticky lg:top-6">
              {/* Preview card */}
              <Card className="border-camouflage-green-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-camouflage-green-50">
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
