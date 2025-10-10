"use client"

import { Search, Filter, Download, Calendar, Warehouse, X } from "lucide-react"
import { useState, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InventoryValueFilters } from "@/lib/types/inventory-value"

interface FiltersHeaderProps {
  filters: InventoryValueFilters
  onFiltersChange: (filters: InventoryValueFilters) => void
  onExport: () => void
  warehouses: string[]
  categories: string[]
  isLoading?: boolean
}

// Valores por defecto para los filtros
const DEFAULT_FILTERS: InventoryValueFilters = {
  search: "",
  warehouse: "all",
  dateUntil: null,
  category: "all",
  status: "all",
}

export function FiltersHeader({
  filters,
  onFiltersChange,
  onExport,
  warehouses = [], // Valor por defecto
  categories = [], // Valor por defecto
  isLoading = false,
}: FiltersHeaderProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Memoizar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some((key) => {
      const filterKey = key as keyof InventoryValueFilters
      const defaultValue = DEFAULT_FILTERS[filterKey]
      return filters[filterKey] !== defaultValue
    })
  }, [filters])

  const handleFilterChange = (key: keyof InventoryValueFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const handleClearFilters = () => {
    onFiltersChange(DEFAULT_FILTERS)
    setShowAdvancedFilters(false)
  }

  // Contar filtros activos para mostrar en el botón
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.warehouse && filters.warehouse !== "all") count++
    if (filters.dateUntil) count++
    if (filters.category && filters.category !== "all") count++
    if (filters.status && filters.status !== "all") count++
    return count
  }, [filters])

  return (
    <div className="space-y-4">
      {/* Fila principal de filtros */}
      <div className="flex flex-col items-stretch justify-between gap-4 xl:flex-row xl:items-center">
        {/* Filtros principales */}
        <div className="flex min-h-[40px] flex-1 flex-col gap-3 sm:flex-row">
          {/* Selector de fecha */}
          <div className="flex h-10 items-center gap-2">
            <DatePicker
              value={filters.dateUntil ?? undefined}
              onChange={(d) => handleFilterChange("dateUntil", d ?? null)}
              placeholder="Fecha hasta"
              className="h-10 w-full sm:w-[180px]"
              disabled={isLoading}
              showIcon={true}
            />
          </div>

          {/* Selector de bodega */}
          <div className="flex h-10 items-center gap-2">
            <Warehouse className="h-4 w-4 flex-shrink-0 text-camouflage-green-600" />
            <Select
              value={filters.warehouse}
              onValueChange={(value) => handleFilterChange("warehouse", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-10 w-full border-camouflage-green-300 bg-white text-camouflage-green-900 focus:border-camouflage-green-500 sm:w-[230px]">
                <SelectValue placeholder="Todas las bodegas" />
              </SelectTrigger>
              <SelectContent className="border-camouflage-green-200 bg-white rounded-3xl">
                <SelectItem value="all" className="text-camouflage-green-900 hover:bg-camouflage-green-50">
                  Todas las bodegas
                </SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem
                    key={warehouse}
                    value={warehouse}
                    className="text-camouflage-green-900 hover:bg-camouflage-green-50"
                  >
                    {warehouse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Búsqueda */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-camouflage-green-600" />
            <Input
              placeholder="Buscar por nombre o referencia..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="h-10 border-camouflage-green-300 bg-white pl-10 text-camouflage-green-900 placeholder:text-camouflage-green-500 focus:border-camouflage-green-500"
              disabled={isLoading}
            />
            {/* Botón para limpiar búsqueda */}
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange("search", "")}
                className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 transform p-0 hover:bg-camouflage-green-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex h-10 flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="relative h-10 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            disabled={isLoading}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {/* Indicador de filtros activos */}
            {activeFiltersCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-camouflage-green-600 text-xs text-white">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-10 bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros avanzados */}
      {showAdvancedFilters && (
        <div className="animate-in slide-in-from-top-2 grid grid-cols-1 gap-4 rounded-lg border border-camouflage-green-200 bg-camouflage-green-50/30 p-4 duration-300 sm:grid-cols-2 lg:grid-cols-3">
          {/* Filtro por categoría */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-camouflage-green-700">Categoría</label>
            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange("category", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="border-camouflage-green-300 bg-white text-camouflage-green-900 focus:border-camouflage-green-500">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent className="border-camouflage-green-200 bg-white rounded-3xl">
                <SelectItem value="all" className="text-camouflage-green-900 hover:bg-camouflage-green-50">
                  Todas las categorías
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem
                    key={category}
                    value={category}
                    className="text-camouflage-green-900 hover:bg-camouflage-green-50"
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por estado */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-camouflage-green-700">Estado</label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="border-camouflage-green-300 bg-white text-camouflage-green-900 focus:border-camouflage-green-500">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent className="border-camouflage-green-200 bg-white rounded-3xl">
                <SelectItem value="all" className="text-camouflage-green-900 hover:bg-camouflage-green-50">
                  Todos los estados
                </SelectItem>
                <SelectItem value="active" className="text-camouflage-green-900 hover:bg-camouflage-green-50">
                  Activos
                </SelectItem>
                <SelectItem value="inactive" className="text-camouflage-green-900 hover:bg-camouflage-green-50">
                  Inactivos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botones de acción para filtros */}
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="flex-1 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
              disabled={isLoading || !hasActiveFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
