import { Product } from "@/contexts/inventory-context"
import {
  ItemFilters,
  SortConfig,
  StockOperator,
  FilterFunction,
  SortFunction,
  StockFilterFunction,
} from "@/lib/types/items"

/**
 * Función pura para evaluar filtros de stock
 */
export const evaluateStockFilter: StockFilterFunction = (
  stock: number,
  operator: StockOperator,
  value: string,
  minValue: string = "",
  maxValue: string = "",
): boolean => {
  if (!operator) return true

  switch (operator) {
    case "between": {
      const min = parseInt(minValue)
      const max = parseInt(maxValue)
      if (isNaN(min) || isNaN(max)) return true
      return stock >= min && stock <= max
    }
    case "equal": {
      if (!value) return true
      const numValue = parseInt(value)
      if (isNaN(numValue)) return true
      return stock === numValue
    }
    case "greater": {
      if (!value) return true
      const numValue = parseInt(value)
      if (isNaN(numValue)) return true
      return stock > numValue
    }
    case "greaterEqual": {
      if (!value) return true
      const numValue = parseInt(value)
      if (isNaN(numValue)) return true
      return stock >= numValue
    }
    case "less": {
      if (!value) return true
      const numValue = parseInt(value)
      if (isNaN(numValue)) return true
      return stock < numValue
    }
    case "lessEqual": {
      if (!value) return true
      const numValue = parseInt(value)
      if (isNaN(numValue)) return true
      return stock <= numValue
    }
    default:
      return true
  }
}

/**
 * Función pura para filtrar productos
 */
export const filterProducts: FilterFunction = (products: Product[], filters: ItemFilters): Product[] => {
  return products.filter((product) => {
    const matchesName = !filters.name || product.name.toLowerCase().includes(filters.name.toLowerCase())

    const matchesSku = !filters.sku || product.sku.toLowerCase().includes(filters.sku.toLowerCase())

    const matchesPrice = !filters.price || product.price.toString().includes(filters.price)

    const matchesDescription =
      !filters.description || product.description.toLowerCase().includes(filters.description.toLowerCase())

    const matchesStock = evaluateStockFilter(
      product.stock,
      filters.stockOperator as StockOperator,
      filters.stockValue,
      filters.stockMinValue,
      filters.stockMaxValue,
    )

    const matchesStatus =
      !filters.status ||
      (filters.status === "active" && (product.isActive ?? true)) ||
      (filters.status === "inactive" && !(product.isActive ?? true))

    return matchesName && matchesSku && matchesPrice && matchesDescription && matchesStock && matchesStatus
  })
}

/**
 * Función pura para ordenar productos
 */
export const sortProducts: SortFunction = (products: Product[], sortConfig: SortConfig): Product[] => {
  if (!sortConfig.field) return products

  return [...products].sort((a, b) => {
    const field = sortConfig.field!
    let aValue = a[field]
    let bValue = b[field]

    // Handle different data types
    if (field === "price" || field === "stock") {
      aValue = Number(aValue)
      bValue = Number(bValue)
    } else {
      aValue = String(aValue).toLowerCase()
      bValue = String(bValue).toLowerCase()
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })
}

/**
 * Función pura para aplicar filtros y ordenamiento
 */
export const applyFiltersAndSort = (products: Product[], filters: ItemFilters, sortConfig: SortConfig): Product[] => {
  const filtered = filterProducts(products, filters)
  return sortProducts(filtered, sortConfig)
}
