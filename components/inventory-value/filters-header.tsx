"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Search, Filter, Download, Calendar, Warehouse, X } from "lucide-react"
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
  search: '',
  warehouse: 'all',
  dateUntil: null,
  category: 'all',
  status: 'all'
}

export function FiltersHeader({ 
  filters, 
  onFiltersChange, 
  onExport, 
  warehouses = [], // Valor por defecto
  categories = [], // Valor por defecto
  isLoading = false
}: FiltersHeaderProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Memoizar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const filterKey = key as keyof InventoryValueFilters
      const defaultValue = DEFAULT_FILTERS[filterKey]
      return filters[filterKey] !== defaultValue
    })
  }, [filters])

  const handleFilterChange = (key: keyof InventoryValueFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
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
    if (filters.warehouse && filters.warehouse !== 'all') count++
    if (filters.dateUntil) count++
    if (filters.category && filters.category !== 'all') count++
    if (filters.status && filters.status !== 'all') count++
    return count
  }, [filters])

  return (
    <div className="space-y-4">
      {/* Fila principal de filtros */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
        {/* Filtros principales */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 min-h-[40px]">
          {/* Selector de fecha */}
          <div className="flex items-center gap-2 h-10">
            <DatePicker
              value={filters.dateUntil ?? undefined}
              onChange={(d) => handleFilterChange('dateUntil', d ?? null)}
              placeholder="Fecha hasta"
              className="w-full sm:w-[180px] h-10"
              disabled={isLoading}
              showIcon={true}
            />
          </div>

          {/* Selector de bodega */}
          <div className="flex items-center gap-2 h-10">
            <Warehouse className="h-4 w-4 text-camouflage-green-600 flex-shrink-0" />
            <Select
              value={filters.warehouse}
              onValueChange={(value) => handleFilterChange('warehouse', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-[230px] h-10 border-camouflage-green-300 focus:border-camouflage-green-500 bg-white text-camouflage-green-900">
                <SelectValue placeholder="Todas las bodegas" />
              </SelectTrigger>
              <SelectContent className="bg-white border-camouflage-green-200">
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
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-camouflage-green-600" />
            <Input
              placeholder="Buscar por nombre o referencia..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="h-10 pl-10 border-camouflage-green-300 focus:border-camouflage-green-500 bg-white text-camouflage-green-900 placeholder:text-camouflage-green-500"
              disabled={isLoading}
            />
            {/* Botón para limpiar búsqueda */}
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-camouflage-green-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-2 h-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="h-10 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50 relative"
            disabled={isLoading}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {/* Indicador de filtros activos */}
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-camouflage-green-600 text-white text-xs rounded-full flex items-center justify-center">
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
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros avanzados */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-camouflage-green-50/30 border border-camouflage-green-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
          {/* Filtro por categoría */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-camouflage-green-700">
              Categoría
            </label>
            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange('category', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="border-camouflage-green-300 focus:border-camouflage-green-500 bg-white text-camouflage-green-900">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent className="bg-white border-camouflage-green-200">
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
            <label className="text-sm font-medium text-camouflage-green-700">
              Estado
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="border-camouflage-green-300 focus:border-camouflage-green-500 bg-white text-camouflage-green-900">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent className="bg-white border-camouflage-green-200">
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
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}