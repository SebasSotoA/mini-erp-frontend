"use client"

import { useState, useMemo } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useInventory } from "@/contexts/inventory-context"
import { DollarSign } from "lucide-react"
import { MetricsCards } from "@/components/inventory-value/metrics-cards"
import { FiltersHeader } from "@/components/inventory-value/filters-header"
import { InventoryTable } from "@/components/inventory-value/inventory-table"
import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import { InventoryValueFilters, SortConfig, SortField, InventoryMetrics, PaginationConfig } from "@/lib/types/inventory-value"
import { applyFiltersAndSort, calculateInventoryMetrics } from "@/lib/utils/inventory-value-filters"
import { useToast } from "@/hooks/use-toast"

export default function InventoryValue() {
  const { getInventoryValueProducts, getWarehouses, getCategories } = useInventory()
  const { toast } = useToast()
  
  // Estado para filtros
  const [filters, setFilters] = useState<InventoryValueFilters>({
    search: '',
    warehouse: 'all',
    dateUntil: null,
    category: 'all',
    status: 'all'
  })
  
  // Estado para ordenamiento
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc'
  })
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Obtener datos del contexto
  const allProducts = getInventoryValueProducts()
  const warehouses = getWarehouses()
  const categories = getCategories()
  
  // Aplicar filtros y ordenamiento
  const filteredAndSortedProducts = useMemo(() => {
    return applyFiltersAndSort(allProducts, filters, sortConfig)
  }, [allProducts, filters, sortConfig])
  
  // Calcular métricas
  const metrics: InventoryMetrics = useMemo(() => {
    return calculateInventoryMetrics(allProducts, filters)
  }, [allProducts, filters])
  
  // Calcular paginación
  const pagination: PaginationConfig = useMemo(() => {
    const totalItems = filteredAndSortedProducts.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex)
    
    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages
    }
  }, [filteredAndSortedProducts, currentPage, itemsPerPage])
  
  // Productos para mostrar en la página actual
  const currentPageProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedProducts.slice(startIndex, endIndex)
  }, [filteredAndSortedProducts, currentPage, itemsPerPage])
  
  // Manejar cambio de ordenamiento
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
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
  
  // Manejar exportación
  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Se está preparando el archivo para descarga...",
    })
    
    // TODO: Implementar exportación real
    setTimeout(() => {
      toast({
        title: "Exportación completada",
        description: "El archivo se ha descargado exitosamente.",
      })
    }, 2000)
  }
  
  // Resetear página cuando cambien los filtros
  const handleFiltersChange = (newFilters: InventoryValueFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-camouflage-green-900 flex items-center">
              <DollarSign className="h-8 w-8 mr-3 text-camouflage-green-600" />
              Valor de Inventario
            </h1>
            <p className="text-camouflage-green-600 mt-1">
              Consulta el valor actual, cantidad y costo promedio de tu inventario.
            </p>
          </div>
        </div>

        {/* Métricas principales */}
        <MetricsCards metrics={metrics} />

        {/* Filtros */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <CardTitle className="text-camouflage-green-900">Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <FiltersHeader
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onExport={handleExport}
              warehouses={warehouses}
              categories={categories}
            />
          </CardContent>
        </Card>

        {/* Tabla de inventario */}
        <Card className="border-camouflage-green-200">
          <CardContent className="p-0">
            <InventoryTable
              products={currentPageProducts}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            
            {/* Paginación */}
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
