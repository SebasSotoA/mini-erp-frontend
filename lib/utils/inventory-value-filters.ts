import {
  InventoryValueProduct,
  InventoryValueFilters,
  SortConfig,
  FilterFunction,
  SortFunction,
} from "@/lib/types/inventory-value"

// Función para evaluar filtros de búsqueda
export const evaluateSearchFilter: FilterFunction = (product, filters) => {
  if (!filters.q) return true

  const searchTerm = filters.q.toLowerCase()
  return (
    product.nombre.toLowerCase().includes(searchTerm) ||
    product.codigoSku.toLowerCase().includes(searchTerm)
  )
}

// Función para evaluar filtro de bodega
export const evaluateWarehouseFilter: FilterFunction = (product, filters) => {
  if (!filters.bodegaIds || filters.bodegaIds.length === 0) return true
  return filters.bodegaIds.includes(product.bodega)
}

// Función para evaluar filtro de categoría
export const evaluateCategoryFilter: FilterFunction = (product, filters) => {
  if (!filters.categoriaIds || filters.categoriaIds.length === 0) return true
  return filters.categoriaIds.includes(product.categoria)
}

// Función para evaluar filtro de estado
export const evaluateStatusFilter: FilterFunction = (product, filters) => {
  if (!filters.estado || filters.estado === "todos") return true
  // Nota: El tipo InventoryValueProduct no tiene campo isActive, 
  // este filtro se maneja en el backend, pero mantenemos la función por compatibilidad
  return true
}

// Función principal de filtrado
export const filterProducts = (
  products: InventoryValueProduct[],
  filters: InventoryValueFilters,
): InventoryValueProduct[] => {
  const filterFunctions: FilterFunction[] = [
    evaluateSearchFilter,
    evaluateWarehouseFilter,
    evaluateCategoryFilter,
    evaluateStatusFilter,
  ]

  return products.filter((product) => filterFunctions.every((filterFn) => filterFn(product, filters)))
}

// Función de ordenamiento
export const sortProducts = (products: InventoryValueProduct[], config: SortConfig): InventoryValueProduct[] => {
  return [...products].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (config.field) {
      case "name":
        aValue = a.nombre.toLowerCase()
        bValue = b.nombre.toLowerCase()
        break
      case "sku":
        aValue = a.codigoSku.toLowerCase()
        bValue = b.codigoSku.toLowerCase()
        break
      case "stock":
        aValue = a.cantidad
        bValue = b.cantidad
        break
      case "total":
        aValue = a.valorTotal
        bValue = b.valorTotal
        break
      default:
        return 0
    }

    if (aValue < bValue) return config.direction === "asc" ? -1 : 1
    if (aValue > bValue) return config.direction === "asc" ? 1 : -1
    return 0
  })
}

// Función principal que aplica filtros y ordenamiento
export const applyFiltersAndSort = (
  products: InventoryValueProduct[],
  filters: InventoryValueFilters,
  sortConfig: SortConfig,
): InventoryValueProduct[] => {
  const filtered = filterProducts(products, filters)
  return sortProducts(filtered, sortConfig)
}

// Función para calcular métricas del inventario
export const calculateInventoryMetrics = (products: InventoryValueProduct[], filters: InventoryValueFilters) => {
  const filteredProducts = filterProducts(products, filters)

  const totalValue = filteredProducts.reduce((sum, product) => sum + product.valorTotal, 0)
  const totalStock = filteredProducts.reduce((sum, product) => sum + product.cantidad, 0)
  const totalCost = filteredProducts.reduce((sum, product) => sum + product.costoUnitario * product.cantidad, 0)

  // Calcular distribución por bodega
  const warehouseMap = new Map<string, number>()
  filteredProducts.forEach((product) => {
    const warehouse = product.bodega || "Sin bodega"
    const current = warehouseMap.get(warehouse) || 0
    warehouseMap.set(warehouse, current + product.valorTotal)
  })

  const warehouseDistribution = Array.from(warehouseMap.entries()).map(([warehouse, value]) => ({
    warehouse,
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }))

  return {
    totalValue,
    totalStock,
    totalCost,
    warehouseDistribution,
  }
}
