"use client"

import { ShoppingCart, ShoppingBag, Edit, Power, PowerOff, Tag, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useProducto, useProductoBodegas, useActivateProducto, useDeactivateProducto } from "@/hooks/api/use-productos"
import { useMovimientosByProducto } from "@/hooks/api/use-movimientos-inventario"

export default function ItemDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { data: product, isLoading, error } = useProducto(id)
  const { data: bodegas, isLoading: isLoadingBodegas, error: errorBodegas } = useProductoBodegas(id)
  const { data: movimientos, isLoading: isLoadingMovimientos, error: errorMovimientos } = useMovimientosByProducto(id)
  const activateMutation = useActivateProducto()
  const deactivateMutation = useDeactivateProducto()

  // Movimientos recientes (primeros 10)
  const recentMovements = movimientos?.slice(0, 10) || []

  // Derivados y placeholders para campos que aún no están en el modelo
  const itemType = product?.category === "Servicios" ? "Servicio" : "Producto"
  const unitOfMeasure = product?.unit || "N/D"
  const reference = product?.sku ?? "N/D"
  const codigoProductoServicio = reference
  const descripcion = product?.description ?? "Sin descripción"

  // Precios
  const precioTotal = product?.price || 0
  const impuestoAplicado = product?.taxPercent != null ? `${product.taxPercent}%` : "N/D"
  const precioSinImpuesto = product?.basePrice != null ? product.basePrice.toLocaleString() : "N/D"
  const costoInicial = product?.cost || 0
  const imageUrl = product?.imageUrl ?? null

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-camouflage-green-300 border-t-camouflage-green-600"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900">Ítem no encontrado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-camouflage-green-700">
                  {error instanceof Error ? error.message : "El ítem solicitado no existe o fue eliminado."}
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/inventory/items")}
                  className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                >
                  Volver a la lista
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Encabezado: Nombre del item */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-camouflage-green-900">{product.name}</h1>
            <p className="mt-1 font-bold text-camouflage-green-600">
              Detalle del {itemType.toLowerCase()} • Ref: {reference}
            </p>
          </div>
          <Button
            variant="ghost"
            size="md2"
            onClick={() => router.push("/inventory/items")}
            className="text-black bg-white hover:text-black border border-gray-700 hover:bg-gray-100"
            title="Volver a Items"
          >
            <ArrowLeft className="mr-2 h-4 w-4 text-black" />
            Volver
          </Button>
        </div>

        {/* Acciones horizontales */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="primary"
            className="shadow-md"
            title="Facturar item"
            onClick={() => router.push(`/invoices/sales/new?productId=${product.id}`)}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Facturar item
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="shadow-md"
            title="Comprar item"
            onClick={() => router.push(`/invoices/purchase/new?productId=${product.id}`)}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Comprar item
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
            title={(product.isActive ?? true) ? "Desactivar" : "Activar"}
            onClick={() => {
              const current = product.isActive ?? true
              if (current) {
                deactivateMutation.mutate(product.id)
              } else {
                activateMutation.mutate(product.id)
              }
            }}
            disabled={activateMutation.isPending || deactivateMutation.isPending}
          >
            {(product.isActive ?? true) ? <Power className="mr-2 h-4 w-4" /> : <PowerOff className="mr-2 h-4 w-4" />}
            {(product.isActive ?? true) ? "Activado" : "Desactivado"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
            title="Editar"
            onClick={() => router.push(`/inventory/items/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>

        {/* Contenido principal: datos a la izquierda, media/pricing a la derecha */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Datos principales */}
          <Card className="border-camouflage-green-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl text-camouflage-green-900">Información del ítem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-base text-camouflage-green-600">Referencia</div>
                  <div className="font-medium text-camouflage-green-900">{reference}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-base text-camouflage-green-600">Categoría</div>
                  <div className="font-medium text-camouflage-green-900">{product.category || "Sin categoría"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-base text-camouflage-green-600">Tipo ítem</div>
                  <div className="font-medium text-camouflage-green-900">{itemType}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-base text-camouflage-green-600">Unidad de medida</div>
                  <div className="font-medium text-camouflage-green-900">{unitOfMeasure}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-base text-camouflage-green-600">Código del producto o servicio</div>
                  <div className="font-medium text-camouflage-green-900">{codigoProductoServicio}</div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <div className="text-base text-camouflage-green-600">Descripción</div>
                  <div className="text-camouflage-green-900">{descripcion}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media y precios */}
          <div className="space-y-4">
            <Card className="border-camouflage-green-200">
              <CardContent className="p-0">
                {imageUrl ? (
                  <div className="relative aspect-square bg-camouflage-green-50/40">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center border-2 border-dashed border-gray-300 bg-white">
                    <Tag className="h-14 w-14 text-gray-300" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-camouflage-green-200">
              <CardContent className="pb-5 pt-4">
                <div className="space-y-2">
                  <div className="text-base text-camouflage-green-600">Precio total</div>
                  <div className="text-3xl font-bold text-camouflage-green-900">
                    ${precioTotal.toLocaleString()} COP
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-camouflage-green-600">Precio sin impuesto</div>
                    <div className="font-semibold text-camouflage-green-900">{`${precioSinImpuesto} COP`}</div>
                  </div>
                  <div>
                    <div className="text-sm text-camouflage-green-600">Impuesto aplicado</div>
                    <div className="font-semibold text-camouflage-green-900">{impuestoAplicado}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-camouflage-green-600">Costo inicial</div>
                  <div className="font-semibold text-camouflage-green-900">${costoInicial.toLocaleString()} COP</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stock por bodega */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <CardTitle className="text-xl text-camouflage-green-900">Stock por Bodega</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBodegas ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-camouflage-green-300 border-t-camouflage-green-600"></div>
              </div>
            ) : errorBodegas ? (
              <div className="text-sm text-red-600">
                {errorBodegas instanceof Error ? errorBodegas.message : "Error al cargar bodegas"}
              </div>
            ) : !bodegas || bodegas.length === 0 ? (
              <div className="text-sm text-camouflage-green-600">No hay bodegas asignadas para este producto.</div>
            ) : (
              <div className="-mx-2 overflow-x-auto sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                      <TableHead className="font-semibold text-camouflage-green-700">Bodega</TableHead>
                      <TableHead className="text-center font-semibold text-camouflage-green-700">Stock Actual</TableHead>
                      <TableHead className="text-center font-semibold text-camouflage-green-700">Cantidad Mínima</TableHead>
                      <TableHead className="text-center font-semibold text-camouflage-green-700">Cantidad Máxima</TableHead>
                      <TableHead className="text-center font-semibold text-camouflage-green-700">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bodegas.map((bodega) => {
                      const currentStock = bodega.cantidadInicial || 0
                      const minStock = bodega.cantidadMinima ?? 0
                      const maxStock = bodega.cantidadMaxima ?? Infinity
                      const isLowStock = minStock > 0 && currentStock <= minStock
                      const isOverStock = maxStock !== Infinity && currentStock >= maxStock
                      
                      return (
                        <TableRow key={bodega.bodegaId} className="border-camouflage-green-100">
                          <TableCell className="font-medium text-camouflage-green-900">{bodega.bodegaNombre}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-semibold ${isLowStock ? 'text-red-600' : isOverStock ? 'text-orange-600' : 'text-camouflage-green-700'}`}>
                              {currentStock}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-camouflage-green-600">{minStock > 0 ? minStock : "-"}</TableCell>
                          <TableCell className="text-center text-camouflage-green-600">{maxStock !== Infinity ? maxStock : "-"}</TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                isLowStock
                                  ? "bg-red-100 text-red-800"
                                  : isOverStock
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-camouflage-green-100 text-camouflage-green-800"
                              }`}
                            >
                              {isLowStock ? "Bajo Stock" : isOverStock ? "Sobre Stock" : "Normal"}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de movimientos */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <CardTitle className="text-xl text-camouflage-green-900">Historial de movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMovimientos ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-camouflage-green-300 border-t-camouflage-green-600"></div>
              </div>
            ) : errorMovimientos ? (
              <div className="text-sm text-red-600">
                {errorMovimientos instanceof Error ? errorMovimientos.message : "Error al cargar movimientos"}
              </div>
            ) : recentMovements.length === 0 ? (
              <div className="text-sm text-camouflage-green-600">No hay movimientos registrados para este ítem.</div>
            ) : (
              <div className="-mx-2 overflow-x-auto sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                      <TableHead className="font-semibold text-camouflage-green-700">Fecha</TableHead>
                      <TableHead className="text-center font-semibold text-camouflage-green-700">Tipo</TableHead>
                      <TableHead className="text-center font-semibold text-camouflage-green-700">Cantidad</TableHead>
                      <TableHead className="text-center font-semibold text-camouflage-green-700">Referencia</TableHead>
                      <TableHead className="text-center font-semibold text-camouflage-green-700">Costo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMovements.map((m) => (
                      <TableRow key={m.id} className="border-camouflage-green-100">
                        <TableCell className="text-camouflage-green-900">
                          {new Date(m.date).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              m.type === "in"
                                ? "bg-camouflage-green-100 text-camouflage-green-800"
                                : m.type === "out"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {m.type === "in"
                              ? "Compra"
                              : m.type === "out"
                                ? "Venta"
                                : m.type === "return"
                                  ? "Devolución"
                                  : "Ajuste"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-camouflage-green-900">{m.quantity}</TableCell>
                        <TableCell className="text-center text-camouflage-green-700">{m.reference || "-"}</TableCell>
                        <TableCell className="text-center text-camouflage-green-900">
                          {m.cost != null ? `$${m.cost.toLocaleString()}` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </MainLayout>
  )
}
