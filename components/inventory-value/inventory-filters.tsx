"use client"

import { Search, Warehouse, X } from "lucide-react"
import { useState, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { InventoryValueFilters } from "@/lib/types/inventory-value"
import type { BodegaBackend, CategoriaBackend } from "@/lib/api/types"

interface InventoryFiltersProps {
  filters: InventoryValueFilters // Filtros aplicados
  pendingFilters: InventoryValueFilters // Filtros pendientes (no aplicados)
  onFiltersChange: (filters: InventoryValueFilters) => void // Para actualizar filtros pendientes
  onApplyFilters: () => void // Para aplicar filtros pendientes
  onClearFilters: () => void // Para limpiar todos los filtros
  onRemoveFilter: (type: "bodega" | "categoria" | "estado" | "q", value?: string) => void // Para remover un filtro individual
  onExport: () => void
  warehouses: BodegaBackend[]
  categories: CategoriaBackend[]
  isLoading?: boolean
}

// Valores por defecto para los filtros
const DEFAULT_FILTERS: InventoryValueFilters = {
  bodegaIds: [],
  categoriaIds: [],
  estado: "activo",
  q: "",
}

export function InventoryFilters({
  filters,
  pendingFilters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  onRemoveFilter,
  onExport,
  warehouses = [],
  categories = [],
  isLoading = false,
}: InventoryFiltersProps) {
  // Verificar si hay filtros aplicados
  const hasActiveFilters = useMemo(() => {
    return (
      filters.bodegaIds.length > 0 ||
      filters.categoriaIds.length > 0 ||
      filters.estado !== "activo" ||
      filters.q !== ""
    )
  }, [filters])

  // Verificar si hay cambios pendientes
  const hasPendingChanges = useMemo(() => {
    return (
      JSON.stringify(pendingFilters.bodegaIds.sort()) !== JSON.stringify(filters.bodegaIds.sort()) ||
      JSON.stringify(pendingFilters.categoriaIds.sort()) !== JSON.stringify(filters.categoriaIds.sort()) ||
      pendingFilters.estado !== filters.estado ||
      pendingFilters.q !== filters.q
    )
  }, [pendingFilters, filters])

  const handlePendingFilterChange = (key: keyof InventoryValueFilters, value: any) => {
    onFiltersChange({
      ...pendingFilters,
      [key]: value,
    })
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onApplyFilters()
    }
  }

  // Opciones para MultiSelect
  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: w.nombre }))
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.nombre }))

  return (
    <div className="space-y-4">
      {/* Filtros aplicados como tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-camouflage-green-200 bg-camouflage-green-50/30 p-3">
          <span className="text-sm font-medium text-camouflage-green-700 shrink-0">Filtros aplicados:</span>
          {filters.bodegaIds.map((id) => {
            const warehouse = warehouses.find((w) => w.id === id)
            if (!warehouse) return null
            return (
              <Badge
                key={id}
                variant="secondary"
                className="flex items-center gap-1.5 border-camouflage-green-300 bg-camouflage-green-100 text-camouflage-green-800 hover:bg-camouflage-green-200 cursor-pointer px-2.5 py-1 transition-colors"
                onClick={() => onRemoveFilter("bodega", id)}
              >
                <span className="text-xs font-medium">{warehouse.nombre}</span>
                <X className="h-3 w-3 cursor-pointer hover:text-red-600 transition-colors shrink-0" />
              </Badge>
            )
          })}
          {filters.categoriaIds.map((id) => {
            const category = categories.find((c) => c.id === id)
            if (!category) return null
            return (
              <Badge
                key={id}
                variant="secondary"
                className="flex items-center gap-1.5 border-camouflage-green-300 bg-camouflage-green-100 text-camouflage-green-800 hover:bg-camouflage-green-200 cursor-pointer px-2.5 py-1 transition-colors"
                onClick={() => onRemoveFilter("categoria", id)}
              >
                <span className="text-xs font-medium">{category.nombre}</span>
                <X className="h-3 w-3 cursor-pointer hover:text-red-600 transition-colors shrink-0" />
              </Badge>
            )
          })}
          {filters.estado !== "activo" && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 border-camouflage-green-300 bg-camouflage-green-100 text-camouflage-green-800 hover:bg-camouflage-green-200 cursor-pointer px-2.5 py-1 transition-colors"
              onClick={() => onRemoveFilter("estado")}
            >
              <span className="text-xs font-medium">{filters.estado === "inactivo" ? "Inactivos" : "Todos"}</span>
              <X className="h-3 w-3 cursor-pointer hover:text-red-600 transition-colors shrink-0" />
            </Badge>
          )}
          {filters.q && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 border-camouflage-green-300 bg-camouflage-green-100 text-camouflage-green-800 hover:bg-camouflage-green-200 cursor-pointer px-2.5 py-1 transition-colors"
              onClick={() => onRemoveFilter("q")}
            >
              <span className="text-xs font-medium">Buscar: {filters.q}</span>
              <X className="h-3 w-3 cursor-pointer hover:text-red-600 transition-colors shrink-0" />
            </Badge>
          )}
        </div>
      )}

      {/* Fila principal de filtros */}
      <div className="flex flex-col items-stretch justify-between gap-4 xl:flex-row xl:items-center">
        {/* Filtros principales */}
        <div className="flex min-h-[40px] flex-1 flex-col gap-3 sm:flex-row">
          {/* MultiSelect de Bodegas */}
          <div className="flex h-10 items-center gap-2 min-w-0">
            <Warehouse className="h-4 w-4 flex-shrink-0 text-camouflage-green-600" />
            <div className="flex-1 min-w-0 sm:w-[200px]">
              <MultiSelect
                options={warehouseOptions}
                selected={pendingFilters.bodegaIds}
                onSelectedChange={(selected) => handlePendingFilterChange("bodegaIds", selected)}
                placeholder="Todas las bodegas"
                className="w-full"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* MultiSelect de Categorías */}
          <div className="flex h-10 items-center gap-2 min-w-0">
            <div className="flex-1 min-w-0 sm:w-[200px]">
              <MultiSelect
                options={categoryOptions}
                selected={pendingFilters.categoriaIds}
                onSelectedChange={(selected) => handlePendingFilterChange("categoriaIds", selected)}
                placeholder="Todas las categorías"
                className="w-full"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Select de Estado */}
          <div className="flex h-10 items-center gap-2">
            <Select
              value={pendingFilters.estado}
              onValueChange={(value) => handlePendingFilterChange("estado", value as "activo" | "inactivo" | "todos")}
              disabled={isLoading}
            >
              <SelectTrigger className="h-10 w-full border-camouflage-green-300 bg-white text-camouflage-green-900 focus:border-camouflage-green-500 sm:w-[114px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="border-camouflage-green-200 bg-white">
                <SelectItem value="activo" className="text-camouflage-green-900 hover:bg-camouflage-green-50">
                  Activos
                </SelectItem>
                <SelectItem value="inactivo" className="text-camouflage-green-900 hover:bg-camouflage-green-50">
                  Inactivos
                </SelectItem>
                <SelectItem value="todos" className="text-camouflage-green-900 hover:bg-camouflage-green-50">
                  Todos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Búsqueda */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-camouflage-green-600" />
            <Input
              placeholder="Buscar nombre o SKU"
              value={pendingFilters.q}
              onChange={(e) => handlePendingFilterChange("q", e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="h-10 border-camouflage-green-300 bg-white pl-10 text-camouflage-green-900 placeholder:text-camouflage-green-500 focus:border-camouflage-green-500"
              disabled={isLoading}
            />
            {/* Botón para limpiar búsqueda */}
            {pendingFilters.q && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePendingFilterChange("q", "")}
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
            onClick={onApplyFilters}
            className="h-10 border-camouflage-green-300 bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
            disabled={isLoading || !hasPendingChanges}
          >
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="h-10 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            disabled={isLoading || !hasActiveFilters}
          >
            <X className="mr-2 h-4 w-4" />
            Limpiar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-10 bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
            disabled={isLoading}
          >
            📄 Exportar a PDF
          </Button>
        </div>
      </div>
    </div>
  )
}

