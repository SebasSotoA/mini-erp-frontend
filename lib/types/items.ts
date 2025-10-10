import { Product } from "@/contexts/inventory-context"

// Tipo extendido para Product con campos opcionales que pueden no estar en el modelo actual
export interface ExtendedProduct extends Omit<Product, "basePrice" | "taxPercent" | "unit" | "imageUrl"> {
  basePrice?: number
  taxPercent?: number
  unit?: string
  imageUrl?: string
}

// Tipos para filtros
export interface ItemFilters {
  name: string
  sku: string
  price: string
  description: string
  stockOperator: string
  stockValue: string
  stockMinValue: string
  stockMaxValue: string
  status: string
}

// Tipos para ordenamiento
export type SortField = keyof Pick<
  Product,
  "name" | "sku" | "price" | "stock" | "category" | "description" | "createdAt"
>
export type SortDirection = "asc" | "desc"

export interface SortConfig {
  field: SortField | null
  direction: SortDirection
}

// Tipos para operadores de stock
export type StockOperator = "none" | "equal" | "greater" | "greaterEqual" | "less" | "lessEqual" | "between"

// Tipos para funciones puras
export type FilterFunction = (products: Product[], filters: ItemFilters) => Product[]
export type SortFunction = (products: Product[], sortConfig: SortConfig) => Product[]
export type StockFilterFunction = (
  stock: number,
  operator: StockOperator,
  value: string,
  minValue?: string,
  maxValue?: string,
) => boolean

// Tipos para acciones de selección múltiple
export interface BulkAction {
  type: "activate" | "deactivate" | "delete"
  productIds: string[]
}

// Tipos para paginación
export interface PaginationConfig {
  currentPage: number
  itemsPerPage: number
  totalItems: number
}

export interface PaginatedResult<T> {
  items: T[]
  pagination: PaginationConfig
}
