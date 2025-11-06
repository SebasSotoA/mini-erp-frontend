"use client"

import { DollarSign } from "lucide-react"
import { useState, useMemo } from "react"

import { InventoryFilters } from "@/components/inventory-value/inventory-filters"
import { InventoryTable } from "@/components/inventory-value/inventory-table"
import { MetricsCards } from "@/components/inventory-value/metrics-cards"
import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useInventarioResumen } from "@/hooks/api/use-inventario"
import { useBodegasActive } from "@/hooks/api/use-bodegas"
import { useCategoriasActive } from "@/hooks/api/use-categorias"
import { InventoryValueFilters, InventoryMetrics, PaginationConfig } from "@/lib/types/inventory-value"
import { inventarioService } from "@/lib/api/services/inventario.service"
import type { InventarioFilterDto } from "@/lib/api/types"

// Valores por defecto para los filtros
const DEFAULT_FILTERS: InventoryValueFilters = {
  bodegaIds: [],
  categoriaIds: [],
  estado: "activo",
  q: "",
}

export default function InventoryValue() {
  // Estado para filtros aplicados (los que se envían al backend)
  const [appliedFilters, setAppliedFilters] = useState<InventoryValueFilters>(DEFAULT_FILTERS)
  // Estado para filtros pendientes (los que el usuario está configurando)
  const [pendingFilters, setPendingFilters] = useState<InventoryValueFilters>(DEFAULT_FILTERS)

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Obtener bodegas y categorías para los filtros
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useBodegasActive(true)
  const { data: categories = [], isLoading: isLoadingCategories } = useCategoriasActive(true)

  // Construir parámetros para la API
  const apiParams: InventarioFilterDto = useMemo(() => {
    const params: InventarioFilterDto = {
      page: currentPage,
      pageSize: itemsPerPage,
      estado: appliedFilters.estado,
    }

    if (appliedFilters.bodegaIds.length > 0) {
      params.bodegaIds = appliedFilters.bodegaIds
    }

    if (appliedFilters.categoriaIds.length > 0) {
      params.categoriaIds = appliedFilters.categoriaIds
    }

    if (appliedFilters.q.trim()) {
      params.q = appliedFilters.q.trim()
    }

    return params
  }, [appliedFilters, currentPage, itemsPerPage])

  // Obtener datos del inventario
  const { data: inventarioData, isLoading, error } = useInventarioResumen(apiParams)

  // Mapear datos a los tipos del frontend
  const products = inventarioData?.productos || []
  const metrics: InventoryMetrics = useMemo(() => {
    if (!inventarioData) {
      return {
        valorTotal: 0,
        stockTotal: 0,
      }
    }
    return {
      valorTotal: inventarioData.valorTotal,
      stockTotal: inventarioData.stockTotal,
    }
  }, [inventarioData])

  const pagination: PaginationConfig = useMemo(() => {
    if (!inventarioData) {
      return {
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 0,
      }
    }
    return {
      currentPage: inventarioData.page,
      itemsPerPage: inventarioData.pageSize,
      totalItems: inventarioData.totalCount,
      totalPages: inventarioData.totalPages,
    }
  }, [inventarioData])

  // Aplicar filtros (botón "Buscar")
  const handleApplyFilters = () => {
    setAppliedFilters({ ...pendingFilters })
    setCurrentPage(1) // Reset a la primera página
  }

  // Limpiar filtros
  const handleClearFilters = () => {
    setPendingFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    setCurrentPage(1)
  }

  // Remover un filtro individual
  const handleRemoveFilter = (type: "bodega" | "categoria" | "estado" | "q", value?: string) => {
    const newFilters = { ...appliedFilters }

    switch (type) {
      case "bodega":
        if (value) {
          newFilters.bodegaIds = newFilters.bodegaIds.filter((id) => id !== value)
        }
        break
      case "categoria":
        if (value) {
          newFilters.categoriaIds = newFilters.categoriaIds.filter((id) => id !== value)
        }
        break
      case "estado":
        newFilters.estado = "activo"
        break
      case "q":
        newFilters.q = ""
        break
    }

    setAppliedFilters(newFilters)
    setPendingFilters(newFilters) // Sincronizar también los filtros pendientes
    setCurrentPage(1)
  }

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Manejar cambio de items por página
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset a la primera página
  }

  // Manejar exportación a PDF
  const handleExport = () => {
    try {
      const pdfUrl = inventarioService.getInventarioResumenPdfUrl(apiParams)
      window.open(pdfUrl, "_blank")
    } catch (error) {
      console.error("Error al generar URL del PDF:", error)
    }
  }

  const isLoadingData = isLoading || isLoadingWarehouses || isLoadingCategories

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <DollarSign className="mr-3 h-8 w-8 text-camouflage-green-600" />
              Valor de Inventario
            </h1>
            <p className="mt-1 text-camouflage-green-600">
              Consulta el valor actual y cantidad de tu inventario.
            </p>
          </div>
        </div>

        {/* Métricas principales */}
        {!isLoading && inventarioData && <MetricsCards metrics={metrics} />}

        {/* Filtros */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <CardTitle className="text-camouflage-green-900">Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <InventoryFilters
              filters={appliedFilters}
              pendingFilters={pendingFilters}
              onFiltersChange={setPendingFilters}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              onRemoveFilter={handleRemoveFilter}
              onExport={handleExport}
              warehouses={warehouses}
              categories={categories}
              isLoading={isLoadingData}
            />
          </CardContent>
        </Card>

        {/* Tabla de inventario */}
        <Card className="border-camouflage-green-200">
          <CardContent className="p-0">
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-camouflage-green-300 border-t-camouflage-green-600"></div>
                  <p className="text-sm text-camouflage-green-600">Cargando datos...</p>
                </div>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">
                <p>Error al cargar los datos del inventario. Por favor, intenta nuevamente.</p>
              </div>
            ) : (
              <>
                <InventoryTable products={products} />
                {/* Paginación */}
                {pagination.totalPages > 0 && (
                  <PaginationControls
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
