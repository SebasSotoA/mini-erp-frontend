"use client"

import {
  Receipt,
  ArrowLeft,
  Trash2,
  Building2,
  Calendar,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useFacturaCompra, useDeleteFacturaCompra } from "@/hooks/api/use-facturas-compra"
import { ApiError, NetworkError } from "@/lib/api/errors"

export default function PurchaseInvoiceDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id

  const { data: factura, isLoading, error } = useFacturaCompra(id)
  const deleteMutation = useDeleteFacturaCompra()

  // Estados para toasts personalizados
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showValidationToast, setShowValidationToast] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")

  // Función para formatear moneda en COP
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  // Función para anular factura
  const handleAnularFactura = async () => {
    if (!factura) return

    // Validar que la factura esté en estado "Completada"
    if (factura.estado !== "Completada") {
      setValidationMessage(
        `No se puede anular la factura ${factura.numeroFactura} porque ya está anulada.`
      )
      setShowValidationToast(true)
      setTimeout(() => setShowValidationToast(false), 5000)
      return
    }

    try {
      await deleteMutation.mutateAsync(factura.id)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
      // Redirigir a la lista después de 1 segundo
      setTimeout(() => {
        router.push("/invoices/purchase")
      }, 1000)
    } catch (error: any) {
      let errorMsg = "Ocurrió un error al anular la factura de compra."
      let errorTitle = "Error al anular factura"

      if (error instanceof NetworkError) {
        errorTitle = "Error de conexión"
        errorMsg = "No se pudo conectar con el servidor. Por favor, verifica que la API esté en ejecución e intenta nuevamente."
      } else if (error instanceof ApiError) {
        errorMsg = error.message || errorMsg
        // Verificar si es un error de validación específico
        const lowerMsg = errorMsg.toLowerCase()
        if (lowerMsg.includes("no se puede anular") || lowerMsg.includes("ya está anulada")) {
          setValidationMessage(errorMsg)
          setShowValidationToast(true)
          setTimeout(() => setShowValidationToast(false), 5000)
          return
        }
      } else if (error instanceof Error) {
        errorMsg = error.message || errorMsg
      }

      setErrorMessage(errorMsg)
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
    }
  }

  // Estado de carga
  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900">Cargando factura...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-camouflage-green-300 border-t-camouflage-green-600"></div>
                  <p className="text-sm text-camouflage-green-600">Cargando información de la factura...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  // Estado de error
  if (error || !factura) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900">Factura no encontrada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-camouflage-green-700">
                  {error instanceof Error
                    ? error.message
                    : "La factura solicitada no existe o fue eliminada."}
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/invoices/purchase")}
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

  const isAnulada = factura.estado === "Anulada"

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <Receipt className="mr-3 h-8 w-8 text-camouflage-green-700" />
              Factura de Compra {factura.numeroFactura}
            </h1>
            <p className="mt-1 text-camouflage-green-600">
              Detalle de la factura de compra
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/invoices/purchase")}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            {!isAnulada && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Anular Factura
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Anular factura de compra?</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que deseas anular la factura <strong>{factura.numeroFactura}</strong>?
                      <br />
                      <br />
                      Esta acción:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Reducirá el stock de los productos en la bodega</li>
                        <li>Creará un movimiento de reversión en el inventario</li>
                        <li>Cambiará el estado de la factura a "Anulada"</li>
                      </ul>
                      <br />
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleAnularFactura}
                      className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Anulando..." : "Sí, anular factura"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Información General */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Información de la Factura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-camouflage-green-600">Número de Factura</p>
                    <p className="text-lg font-semibold text-camouflage-green-900">{factura.numeroFactura}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-camouflage-green-600">Estado</p>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                        isAnulada
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {factura.estado}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-camouflage-green-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha
                    </p>
                    <p className="text-lg text-camouflage-green-900">{formatDate(factura.fecha)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-camouflage-green-600 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Bodega
                    </p>
                    <p className="text-lg text-camouflage-green-900">{factura.bodegaNombre}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm font-medium text-camouflage-green-600">Proveedor</p>
                    <p className="text-lg text-camouflage-green-900">{factura.proveedorNombre}</p>
                  </div>
                  {factura.observaciones && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-sm font-medium text-camouflage-green-600">Observaciones</p>
                      <p className="text-camouflage-green-900 whitespace-pre-wrap">{factura.observaciones}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Items de la Factura */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-camouflage-green-900">
                  <Package className="h-5 w-5" />
                  Items de la Factura ({factura.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                      <TableHead className="font-semibold text-camouflage-green-700">Producto</TableHead>
                      <TableHead className="font-semibold text-camouflage-green-700">SKU</TableHead>
                      <TableHead className="font-semibold text-camouflage-green-700 text-right">Cantidad</TableHead>
                      <TableHead className="font-semibold text-camouflage-green-700 text-right">Costo Unitario</TableHead>
                      <TableHead className="font-semibold text-camouflage-green-700 text-right">Descuento</TableHead>
                      <TableHead className="font-semibold text-camouflage-green-700 text-right">Impuesto</TableHead>
                      <TableHead className="font-semibold text-camouflage-green-700 text-right">Total Línea</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factura.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-camouflage-green-500">
                          No hay items en esta factura.
                        </TableCell>
                      </TableRow>
                    ) : (
                      factura.items.map((item) => (
                        <TableRow key={item.id} className="border-camouflage-green-100 hover:bg-camouflage-green-50/50">
                          <TableCell className="font-medium text-camouflage-green-900">{item.productoNombre}</TableCell>
                          <TableCell className="text-camouflage-green-700">{item.productoSku}</TableCell>
                          <TableCell className="text-right text-camouflage-green-900">{item.cantidad.toLocaleString("es-CO")}</TableCell>
                          <TableCell className="text-right text-camouflage-green-900">{formatCurrency(item.costoUnitario)}</TableCell>
                          <TableCell className="text-right text-camouflage-green-900">{formatCurrency(item.descuento)}</TableCell>
                          <TableCell className="text-right text-camouflage-green-900">{formatCurrency(item.impuesto)}</TableCell>
                          <TableCell className="text-right font-semibold text-camouflage-green-900">{formatCurrency(item.totalLinea)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Resumen */}
          <div className="space-y-6">
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-camouflage-green-900">
                  <DollarSign className="h-5 w-5" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-camouflage-green-600">Subtotal</span>
                    <span className="font-medium text-camouflage-green-900">
                      {formatCurrency(
                        factura.items.reduce((sum, item) => {
                          const subtotal = item.costoUnitario * item.cantidad
                          return sum + subtotal
                        }, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-camouflage-green-600">Descuentos</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(factura.items.reduce((sum, item) => sum + item.descuento, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-camouflage-green-600">Impuestos</span>
                    <span className="font-medium text-camouflage-green-900">
                      {formatCurrency(factura.items.reduce((sum, item) => sum + item.impuesto, 0))}
                    </span>
                  </div>
                  <div className="border-t border-camouflage-green-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-camouflage-green-900">Total</span>
                      <span className="text-2xl font-bold text-camouflage-green-900">{formatCurrency(factura.total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerta si está anulada */}
            {isAnulada && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Factura Anulada</p>
                      <p className="text-sm text-red-700 mt-1">
                        Esta factura ha sido anulada. El stock de los productos ha sido reducido.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Toasts personalizados */}
        {showSuccessToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                La factura {factura.numeroFactura} ha sido anulada exitosamente. El stock ha sido actualizado.
              </p>
            </div>
          </div>
        )}

        {showErrorToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowErrorToast(false)}
                className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {showValidationToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 shadow-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <p className="text-sm font-medium text-orange-800">{validationMessage}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowValidationToast(false)}
                className="h-6 w-6 p-0 text-orange-600 hover:bg-orange-100 hover:text-orange-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}


