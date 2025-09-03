import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SkeletonStyled } from "@/components/ui/skeleton-styled"

export default function Loading() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonStyled className="h-8 w-64" />
            <SkeletonStyled className="h-4 w-96" />
          </div>
        </div>

        {/* Filtros */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <SkeletonStyled className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <SkeletonStyled className="h-10 w-48" />
              <SkeletonStyled className="h-10 w-48" />
              <SkeletonStyled className="h-10 w-64" />
              <div className="flex gap-2">
                <SkeletonStyled className="h-10 w-24" />
                <SkeletonStyled className="h-10 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-camouflage-green-200">
              <CardContent className="flex items-center p-6">
                <SkeletonStyled className="h-12 w-12 rounded-full" />
                <div className="ml-4 space-y-2">
                  <SkeletonStyled className="h-4 w-20" />
                  <SkeletonStyled className="h-6 w-24" />
                  <SkeletonStyled className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabla de inventario */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <SkeletonStyled className="h-6 w-48" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="border border-camouflage-green-200 rounded-lg overflow-hidden">
              {/* Header de tabla */}
              <div className="bg-camouflage-green-50/50 p-4">
                <div className="grid grid-cols-8 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonStyled key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
              
              {/* Filas de tabla */}
              <div className="divide-y divide-camouflage-green-100">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="grid grid-cols-8 gap-4">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <SkeletonStyled key={j} className="h-4 w-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
