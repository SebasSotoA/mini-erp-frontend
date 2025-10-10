"use client"

import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableHead, TableRow } from "@/components/ui/table"
import { DatePicker } from "@/components/ui/date-picker"
import { InvoiceFilters, FilterConfig } from "./types"

interface InvoiceFiltersRowProps {
  showFilters: boolean
  filters: InvoiceFilters
  onFilterChange: (field: keyof InvoiceFilters, value: string) => void
  onClearFilters: () => void
  filterConfig: FilterConfig
}

export function InvoiceFiltersRow({
  showFilters,
  filters,
  onFilterChange,
  onClearFilters,
  filterConfig,
}: InvoiceFiltersRowProps) {
  if (!showFilters) return null

  return (
    <TableRow className="border-camouflage-green-200 bg-camouflage-green-50/30 hover:bg-camouflage-green-50/30">
      {/* Campo de búsqueda */}
      <TableHead className="w-[200px]">
        <div className="flex items-center gap-1 py-3 hover:bg-transparent">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-camouflage-green-400" />
            <input
              type="text"
              placeholder={filterConfig.searchPlaceholder}
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white pl-10 pr-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
            />
          </div>
        </div>
      </TableHead>

      {/* Dropdown filter si está configurado */}
      {filterConfig.dropdownField && filterConfig.dropdownOptions && (
        <TableHead className="w-[200px]">
          <div className="flex items-center gap-1 py-3 hover:bg-transparent">
            <Select
              value={filters.dropdown}
              onValueChange={(value) => onFilterChange("dropdown", value)}
            >
              <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                <SelectValue placeholder={filterConfig.dropdownPlaceholder} />
              </SelectTrigger>
              <SelectContent className="rounded-3xl">
                {filterConfig.dropdownOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TableHead>
      )}

      {/* Filtro de fecha */}
      <TableHead className="w-[150px]">
        <div className="flex items-center gap-1 py-3 hover:bg-transparent">
          <DatePicker
            value={filters.dateFrom ? new Date(filters.dateFrom) : null}
            onChange={(date) => onFilterChange("dateFrom", date ? date.toISOString().split('T')[0] : "")}
            placeholder="Fecha de creación"
            className="w-full"
          />
        </div>
      </TableHead>

      {/* Filtro de estado */}
      <TableHead className="w-[120px]">
        <div className="flex items-center gap-1 py-3 hover:bg-transparent">
          <Select
            value={filters.status}
            onValueChange={(value) => onFilterChange("status", value)}
          >
            <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="rounded-3xl">
              <SelectItem value="all">Estado</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="cancelled">Anulada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableHead>

      {/* Botón limpiar filtros */}
      <TableHead className="w-[120px]">
        <div className="flex items-center gap-1 py-3 hover:bg-transparent">
          <Button
            onClick={onClearFilters}
            size="sm"
            variant="outline"
            className="h-9 w-9 border-camouflage-green-300 p-0 text-camouflage-green-700 hover:bg-camouflage-green-100"
            title="Limpiar filtros"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </TableHead>
    </TableRow>
  )
}
