import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SkeletonStyled } from "@/components/ui/skeleton-styled"

export default function Loading() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <div className="flex items-center gap-3">
            <SkeletonStyled className="h-8 w-8" />
            <SkeletonStyled className="h-8 w-80" />
          </div>
          <SkeletonStyled className="mt-2 h-4 w-96" />
        </div>

        {/* Cards principales skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card: Importar Nuevos Items */}
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <SkeletonStyled className="h-6 w-6" />
                <SkeletonStyled className="h-6 w-48" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SkeletonStyled className="h-4 w-full" />

              {/* Información simplificada skeleton */}
              <div className="rounded-lg border border-camouflage-green-200 bg-camouflage-green-50 p-3">
                <div className="flex items-start gap-2">
                  <SkeletonStyled className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonStyled className="h-4 w-32" />
                    <SkeletonStyled className="h-3 w-full" />
                  </div>
                </div>
              </div>

              {/* Recomendaciones skeleton */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <SkeletonStyled className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonStyled className="h-4 w-28" />
                    <SkeletonStyled className="h-3 w-full" />
                    <SkeletonStyled className="h-3 w-3/4" />
                    <SkeletonStyled className="h-3 w-2/3" />
                  </div>
                </div>
              </div>

              {/* Drag & Drop Area skeleton */}
              <div className="space-y-2">
                <SkeletonStyled className="h-4 w-32" />
                <div className="rounded-lg border-2 border-dashed border-camouflage-green-300 p-6 text-center">
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <SkeletonStyled className="h-8 w-8" />
                    </div>
                    <SkeletonStyled className="mx-auto h-4 w-64" />
                    <SkeletonStyled className="mx-auto h-3 w-40" />
                  </div>
                </div>
              </div>

              {/* Botón descargar plantilla skeleton */}
              <SkeletonStyled className="h-10 w-full" />
            </CardContent>
          </Card>

          {/* Card: Actualizar Items Existentes */}
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <SkeletonStyled className="h-6 w-6" />
                <SkeletonStyled className="h-6 w-52" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SkeletonStyled className="h-4 w-full" />

              {/* Información simplificada skeleton */}
              <div className="rounded-lg border border-camouflage-green-200 bg-camouflage-green-50 p-3">
                <div className="flex items-start gap-2">
                  <SkeletonStyled className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonStyled className="h-4 w-24" />
                    <SkeletonStyled className="h-3 w-full" />
                  </div>
                </div>
              </div>

              {/* Recomendaciones skeleton */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <SkeletonStyled className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonStyled className="h-4 w-28" />
                    <SkeletonStyled className="h-3 w-full" />
                    <SkeletonStyled className="h-3 w-3/4" />
                  </div>
                </div>
              </div>

              {/* Drag & Drop Area skeleton */}
              <div className="space-y-2">
                <SkeletonStyled className="h-4 w-32" />
                <div className="rounded-lg border-2 border-dashed border-camouflage-green-300 p-6 text-center">
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <SkeletonStyled className="h-8 w-8" />
                    </div>
                    <SkeletonStyled className="mx-auto h-4 w-64" />
                    <SkeletonStyled className="mx-auto h-3 w-40" />
                  </div>
                </div>
              </div>

              {/* Botón descargar plantilla skeleton */}
              <SkeletonStyled className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
