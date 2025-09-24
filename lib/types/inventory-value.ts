import { Product } from "@/contexts/inventory-context"

// Tipos para filtros del módulo Valor de Inventario
export interface InventoryValueFilters {
  search: string
  warehouse: string
  dateUntil: Date | null
  category: string
  status: "active" | "inactive" | "all" | ""
}

// Configuración de ordenamiento
export type SortField = "name" | "sku" | "stock" | "cost" | "total"
export type SortDirection = "asc" | "desc"

export interface SortConfig {
  field: SortField
  direction: SortDirection
}

// Producto extendido para el módulo de valor
export interface InventoryValueProduct extends Omit<Product, "basePrice" | "taxPercent" | "unit" | "imageUrl"> {
  basePrice?: number
  taxPercent?: number
  unit?: string
  imageUrl?: string
  cost: number
  total: number
}

// Métricas del inventario
export interface InventoryMetrics {
  totalValue: number
  totalStock: number
  totalCost: number
  warehouseDistribution: Array<{
    warehouse: string
    value: number
    percentage: number
  }>
}

// Configuración de paginación
export interface PaginationConfig {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

// Función de filtro
export type FilterFunction = (product: InventoryValueProduct, filters: InventoryValueFilters) => boolean

// Función de ordenamiento
export type SortFunction = (a: InventoryValueProduct, b: InventoryValueProduct, config: SortConfig) => number
