"use client"

import {
  Receipt,
  Plus,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState, useEffect } from "react"

import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { useToast } from "@/hooks/use-toast"
import { PaginationConfig } from "@/lib/types/inventory-value"
import { InvoiceFilters } from "@/components/invoices/types"
import { InvoiceTable } from "@/components/invoices/invoice-table"
import { useFacturasVenta, useDeleteFacturaVenta } from "@/hooks/api/use-facturas-venta"
import type { FacturaVentaBackend } from "@/lib/api/types"
import type { SalesInvoice } from "@/lib/types/invoices"
import { ApiError, NetworkError } from "@/lib/api/errors"
import {
  salesInvoicePageConfig,
  salesInvoiceFilterConfig,
  salesInvoiceTableConfig,
} from "@/components/invoices/configs/sales-config"
import { useBodegasActive } from "@/hooks/api/use-bodegas"
import { useVendedoresActive } from "@/hooks/api/use-vendedores"
import { useDebounce } from "@/hooks/use-debounce"

// Función para mapear FacturaVentaBackend a SalesInvoice
function mapFacturaVentaToSalesInvoice(factura: FacturaVentaBackend): SalesInvoice {
  return {
    id: factura.id,
    invoiceNumber: factura.numeroFactura,
    warehouseId: factura.bodegaId,
    warehouseName: factura.bodegaNombre,
    salespersonId: factura.vendedorId,
    salespersonName: factura.vendedorNombre,
    date: factura.fecha,
    paymentType: factura.formaPago === "Contado" ? "cash" : "credit",
    paymentMethod: factura.medioPago,
    observations: factura.observaciones || undefined,
    items: factura.items.map((item) => ({
      id: item.id,
      productId: item.productoId,
      productName: item.productoNombre,
      price: item.precioUnitario,
      discount: 0, // El backend no devuelve porcentaje, solo monto
      taxRate: 0, // El backend no devuelve porcentaje, solo monto
      quantity: item.cantidad,
      subtotal: item.precioUnitario * item.cantidad,
      discountAmount: item.descuento,
      taxAmount: item.impuesto,
      total: item.totalLinea,
    })),
    subtotal: factura.items.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0),
    totalDiscount: factura.items.reduce((sum, item) => sum + item.descuento, 0),
    totalTax: factura.items.reduce((sum, item) => sum + item.impuesto, 0),
    totalAmount: factura.total,
    status: factura.estado === "Completada" ? "completed" : "cancelled",
    createdAt: factura.fecha,
    updatedAt: factura.fecha,
  }
}

export default function SalesInvoices() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Obtener bodegas y vendedores para los filtros
  const { data: warehouses = [] } = useBodegasActive(true)
  const { data: salespersonsData } = useVendedoresActive()
  const salespersons = Array.isArray(salespersonsData) ? salespersonsData : []
  
  // Estado local de filtros
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<InvoiceFilters>({
    search: "",
    dropdown: "",
    status: "",
    date: "",
    numeroFactura: "",
    vendedorId: "all",
    vendedorNombre: "",
    bodegaId: "all",
    bodegaNombre: "",
    formaPago: "all",
    medioPago: "all",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Debounce para búsquedas de texto
  const debouncedNumeroFactura = useDebounce(filters.numeroFactura || "", 500)
  const debouncedVendedorNombre = useDebounce(filters.vendedorNombre || "", 500)
  const debouncedBodegaNombre = useDebounce(filters.bodegaNombre || "", 500)
  
  // Construir parámetros para la API
  const apiParams = useMemo(() => {
    const params: {
      page: number
      pageSize: number
      numeroFactura?: string
      vendedorId?: string
      vendedorNombre?: string
      bodegaId?: string
      bodegaNombre?: string
      estado?: "Completada" | "Anulada"
      formaPago?: "Contado" | "Credito"
      medioPago?: "Efectivo" | "Tarjeta" | "Transferencia" | "Cheque"
      fechaDesde?: string
      fechaHasta?: string
      orderBy?: "numero" | "vendedor" | "bodega" | "fecha" | "estado" | "total" | "formaPago"
      orderDesc?: boolean
    } = {
      page: currentPage,
      pageSize: itemsPerPage,
    }
    
    // Filtros de búsqueda
    if (debouncedNumeroFactura) params.numeroFactura = debouncedNumeroFactura
    if (filters.vendedorId && filters.vendedorId !== "all") params.vendedorId = filters.vendedorId
    if (debouncedVendedorNombre) params.vendedorNombre = debouncedVendedorNombre
    if (filters.bodegaId && filters.bodegaId !== "all") params.bodegaId = filters.bodegaId
    if (debouncedBodegaNombre) params.bodegaNombre = debouncedBodegaNombre
    
    // Filtro de estado
    if (filters.status === "completed") params.estado = "Completada"
    else if (filters.status === "cancelled") params.estado = "Anulada"
    
    // Filtro de forma de pago
    if (filters.formaPago === "cash") params.formaPago = "Contado"
    else if (filters.formaPago === "credit") params.formaPago = "Credito"
    
    // Filtro de medio de pago
    if (filters.medioPago && filters.medioPago !== "all") {
      params.medioPago = filters.medioPago as "Efectivo" | "Tarjeta" | "Transferencia" | "Cheque"
    }
    
    // Filtro de fecha exacta (usar la misma fecha para desde y hasta)
    if (filters.date) {
      params.fechaDesde = filters.date
      params.fechaHasta = filters.date
    }
    
    return params
  }, [
    currentPage,
    itemsPerPage,
    debouncedNumeroFactura,
    filters.vendedorId,
    debouncedVendedorNombre,
    filters.bodegaId,
    debouncedBodegaNombre,
    filters.status,
    filters.formaPago,
    filters.medioPago,
    filters.date,
  ])
  
  // Obtener facturas del backend con filtros
  const { data: facturasData, isLoading, error } = useFacturasVenta(apiParams)
  const deleteMutation = useDeleteFacturaVenta()
  
  // Configuración de filtros dinámica con bodegas y vendedores reales
  const filterConfig = useMemo(() => {
    const warehouseOptions = warehouses.map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.nombre,
    }))
    
    const salespersonOptions = salespersons.map((salesperson) => ({
      value: salesperson.id,
      label: salesperson.nombre,
    }))
    
    return {
      ...salesInvoiceFilterConfig,
      dropdownOptions: [
        { value: "all", label: "Todas las bodegas" },
        ...warehouseOptions,
      ],
      salespersonOptions: [
        { value: "all", label: "Todos los vendedores" },
        ...salespersonOptions,
      ],
    }
  }, [warehouses, salespersons])

  // Verificar si viene de una creación exitosa
  useEffect(() => {
    const created = searchParams?.get("created")
    if (created === "true") {
      setShowSuccessMessage("Se creó la factura exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
      // Limpiar el parámetro de la URL sin recargar la página
      const newUrl = window.location.pathname
      window.history.replaceState({}, "", newUrl)
    }
  }, [searchParams])

  // Mapear facturas del backend al formato del frontend
  const salesInvoices: SalesInvoice[] = useMemo(() => {
    if (!facturasData?.items) return []
    return facturasData.items.map(mapFacturaVentaToSalesInvoice)
  }, [facturasData])

  // Estados para toasts personalizados
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState("")
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showValidationToast, setShowValidationToast] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")

  // Configuración de paginación desde el backend
  const pagination: PaginationConfig = useMemo(() => {
    if (!facturasData) {
      return {
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 0,
      }
    }
    return {
      currentPage: facturasData.page,
      itemsPerPage: facturasData.pageSize,
      totalItems: facturasData.totalCount,
      totalPages: facturasData.totalPages,
    }
  }, [facturasData])

  // Facturas para mostrar (ya vienen paginadas del backend)
  const currentInvoices = salesInvoices

  const handleSort = (field: keyof SalesInvoice) => {
    // El ordenamiento se maneja en el backend, por ahora no implementado
    // Se puede agregar lógica para cambiar orderBy y orderDesc
  }

  const handleFilterChange = (field: keyof InvoiceFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setCurrentPage(1) // Resetear a la primera página cuando cambian los filtros
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      dropdown: "",
      status: "",
      date: "",
      numeroFactura: "",
      vendedorId: "all",
      vendedorNombre: "",
      bodegaId: "all",
      bodegaNombre: "",
      formaPago: "all",
      medioPago: "all",
    })
    setCurrentPage(1)
  }

  // Función para anular factura
  const handleCancelInvoice = async (id: string) => {
    const factura = currentInvoices.find((inv) => inv.id === id)
    if (!factura) return

    // Validar que la factura esté en estado "completed"
    if (factura.status !== "completed") {
      setValidationMessage(
        `No se puede anular la factura ${factura.invoiceNumber} porque ya está anulada.`
      )
      setShowValidationToast(true)
      setTimeout(() => setShowValidationToast(false), 5000)
      return
    }

    try {
      await deleteMutation.mutateAsync(id)
      setShowSuccessMessage("Factura de venta anulada exitosamente. El stock ha sido actualizado.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error: any) {
      let errorMsg = "Ocurrió un error al anular la factura de venta."
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

  const handleViewInvoice = (id: string) => {
    router.push(salesInvoicePageConfig.viewInvoicePath(id))
  }

  const handleEditInvoice = (id: string) => {
    // Por ahora, redirigir al detalle ya que no hay página de edición
    // En el futuro, se puede crear una página de edición
    router.push(salesInvoicePageConfig.viewInvoicePath(id))
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900">Cargando facturas...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-camouflage-green-300 border-t-camouflage-green-600"></div>
                  <p className="text-sm text-camouflage-green-600">Cargando facturas de venta...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900">Error al cargar facturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-camouflage-green-700">
                  {error instanceof Error
                    ? error.message
                    : "Ocurrió un error al cargar las facturas de venta."}
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                >
                  Reintentar
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              {salesInvoicePageConfig.icon}
              {salesInvoicePageConfig.title}
            </h1>
            <p className="mt-1 text-camouflage-green-600">{salesInvoicePageConfig.description}</p>
          </div>
          <Button
            size="md2"
            className="bg-camouflage-green-700 pl-4 pr-4 text-white hover:bg-camouflage-green-800"
            onClick={() => router.push(salesInvoicePageConfig.newInvoicePath)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        </div>

        {/* Tabla de Facturas */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">
                {salesInvoicePageConfig.title} ({pagination.totalItems.toLocaleString()})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="sm"
                  className={`border-camouflage-green-300 text-camouflage-green-700 transition-all duration-200 hover:bg-camouflage-green-50 ${
                    showFilters ? "border-camouflage-green-400 bg-camouflage-green-100" : ""
                  }`}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <InvoiceTable
              invoices={currentInvoices}
              columns={salesInvoiceTableConfig.columns}
              showFilters={showFilters}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              onSort={handleSort}
              sortField=""
              sortDirection="asc"
              onView={handleViewInvoice}
              onEdit={handleEditInvoice}
              onCancel={handleCancelInvoice}
              renderCell={salesInvoiceTableConfig.renderCell}
              getInvoiceNumber={salesInvoiceTableConfig.getInvoiceNumber}
              getInvoiceStatus={salesInvoiceTableConfig.getInvoiceStatus}
              filterConfig={filterConfig}
              pagination={pagination}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </CardContent>
        </Card>

        {/* Toasts personalizados */}
        {showSuccessToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                {showSuccessMessage}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuccessToast(false)}
                className="h-6 w-6 p-0 text-green-600 hover:bg-green-100 hover:text-green-800"
              >
                <X className="h-4 w-4" />
              </Button>
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
