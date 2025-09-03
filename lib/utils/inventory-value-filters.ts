import { 
  InventoryValueProduct, 
  InventoryValueFilters, 
  SortConfig, 
  FilterFunction, 
  SortFunction 
} from "@/lib/types/inventory-value"

// Función para evaluar filtros de búsqueda
export const evaluateSearchFilter: FilterFunction = (product, filters) => {
  if (!filters.search) return true
  
  const searchTerm = filters.search.toLowerCase()
  return (
    product.name.toLowerCase().includes(searchTerm) ||
    product.sku.toLowerCase().includes(searchTerm) ||
    (product.description && product.description.toLowerCase().includes(searchTerm))
  )
}

// Función para evaluar filtro de bodega
export const evaluateWarehouseFilter: FilterFunction = (product, filters) => {
  if (!filters.warehouse || filters.warehouse === 'all') return true
  return product.warehouse === filters.warehouse
}

// Función para evaluar filtro de categoría
export const evaluateCategoryFilter: FilterFunction = (product, filters) => {
  if (!filters.category || filters.category === 'all') return true
  return product.category === filters.category
}

// Función para evaluar filtro de estado
export const evaluateStatusFilter: FilterFunction = (product, filters) => {
  if (!filters.status) return true
  return filters.status === 'active' ? (product.isActive ?? true) : !(product.isActive ?? true)
}

// Función para evaluar filtro de fecha (hasta)
export const evaluateDateFilter: FilterFunction = (product, filters) => {
  if (!filters.dateUntil) return true
  // Por ahora retornamos true, en el futuro se podría filtrar por fecha de creación o modificación
  return true
}

// Función principal de filtrado
export const filterProducts = (
  products: InventoryValueProduct[], 
  filters: InventoryValueFilters
): InventoryValueProduct[] => {
  const filterFunctions: FilterFunction[] = [
    evaluateSearchFilter,
    evaluateWarehouseFilter,
    evaluateCategoryFilter,
    evaluateStatusFilter,
    evaluateDateFilter
  ]

  return products.filter(product => 
    filterFunctions.every(filterFn => filterFn(product, filters))
  )
}

// Función de ordenamiento
export const sortProducts = (
  products: InventoryValueProduct[], 
  config: SortConfig
): InventoryValueProduct[] => {
  return [...products].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (config.field) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'sku':
        aValue = a.sku.toLowerCase()
        bValue = b.sku.toLowerCase()
        break
      case 'stock':
        aValue = a.stock
        bValue = b.stock
        break
      case 'cost':
        aValue = a.cost
        bValue = b.cost
        break
      case 'total':
        aValue = a.total
        bValue = b.total
        break
      default:
        return 0
    }

    if (aValue < bValue) return config.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return config.direction === 'asc' ? 1 : -1
    return 0
  })
}

// Función principal que aplica filtros y ordenamiento
export const applyFiltersAndSort = (
  products: InventoryValueProduct[],
  filters: InventoryValueFilters,
  sortConfig: SortConfig
): InventoryValueProduct[] => {
  const filtered = filterProducts(products, filters)
  return sortProducts(filtered, sortConfig)
}

// Función para calcular métricas del inventario
export const calculateInventoryMetrics = (
  products: InventoryValueProduct[],
  filters: InventoryValueFilters
) => {
  const filteredProducts = filterProducts(products, filters)
  
  const totalValue = filteredProducts.reduce((sum, product) => sum + product.total, 0)
  const totalStock = filteredProducts.reduce((sum, product) => sum + product.stock, 0)
  const totalCost = filteredProducts.reduce((sum, product) => sum + (product.cost * product.stock), 0)
  
  // Calcular distribución por bodega
  const warehouseMap = new Map<string, number>()
  filteredProducts.forEach(product => {
    const current = warehouseMap.get(product.warehouse) || 0
    warehouseMap.set(product.warehouse, current + product.total)
  })
  
  const warehouseDistribution = Array.from(warehouseMap.entries()).map(([warehouse, value]) => ({
    warehouse,
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
  }))
  
  return {
    totalValue,
    totalStock,
    totalCost,
    warehouseDistribution
  }
}
