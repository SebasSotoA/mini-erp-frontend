import type { InventarioProductoDto, InventarioResumenDto } from "@/lib/api/types"

// Tipos para filtros del módulo Valor de Inventario
export interface InventoryValueFilters {
  bodegaIds: string[]
  categoriaIds: string[]
  estado: "activo" | "inactivo" | "todos"
  q: string
}

// Configuración de ordenamiento (mantenido para compatibilidad, aunque el backend no lo soporta aún)
export type SortField = "name" | "sku" | "stock" | "total"
export type SortDirection = "asc" | "desc"

export interface SortConfig {
  field: SortField
  direction: SortDirection
}

// Producto del módulo de valor (mapeado desde InventarioProductoDto)
export interface InventoryValueProduct {
  nombre: string
  codigoSku: string
  bodega: string
  cantidad: number
  costoUnitario: number
  valorTotal: number
  categoria: string
}

// Métricas del inventario (mapeado desde InventarioResumenDto)
export interface InventoryMetrics {
  valorTotal: number
  stockTotal: number
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
