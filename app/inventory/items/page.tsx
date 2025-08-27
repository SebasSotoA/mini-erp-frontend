"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInventory } from "@/contexts/inventory-context"
import { ShoppingCart, Plus, Search, Filter, Eye, Edit, Power, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown, X } from "lucide-react"

export default function SalesItems() {
  const { products } = useInventory()
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Estado para filtros y ordenamiento
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    name: '',
    sku: '',
    price: '',
    description: '',
    stockOperator: '',
    stockValue: '',
    stockMinValue: '',
    stockMaxValue: '',
    status: ''
  })
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Función para evaluar filtro de stock por rango
  const evaluateStockFilter = (stock: number, operator: string, value: string, minValue: string = '', maxValue: string = '') => {
    if (!operator) return true
    
    switch (operator) {
      case 'between': {
        const min = parseInt(minValue)
        const max = parseInt(maxValue)
        if (isNaN(min) || isNaN(max)) return true
        return stock >= min && stock <= max
      }
      default: {
        if (!value) return true
        const numValue = parseInt(value)
        if (isNaN(numValue)) return true
        
        switch (operator) {
          case 'equal': return stock === numValue
          case 'greater': return stock > numValue
          case 'greaterEqual': return stock >= numValue
          case 'less': return stock < numValue
          case 'lessEqual': return stock <= numValue
          default: return true
        }
      }
    }
  }

  // Funciones para filtros y ordenamiento
  const filterProducts = (products: any[]) => {
    return products.filter(product => {
      const matchesName = !filters.name || product.name.toLowerCase().includes(filters.name.toLowerCase())
      const matchesSku = !filters.sku || product.sku.toLowerCase().includes(filters.sku.toLowerCase())
      const matchesPrice = !filters.price || product.price.toString().includes(filters.price)
      const matchesDescription = !filters.description || product.description.toLowerCase().includes(filters.description.toLowerCase())
      const matchesStock = evaluateStockFilter(product.stock, filters.stockOperator, filters.stockValue, filters.stockMinValue, filters.stockMaxValue)
      const matchesStatus = !filters.status || 
        (filters.status === 'active' && product.stock > 0) ||
        (filters.status === 'inactive' && product.stock === 0)
      
      return matchesName && matchesSku && matchesPrice && matchesDescription && matchesStock && matchesStatus
    })
  }
  
  const sortProducts = (products: any[]) => {
    if (!sortField) return products
    
    return [...products].sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      // Handle different data types
      if (sortField === 'price' || sortField === 'stock') {
        aValue = Number(aValue)
        bValue = Number(bValue)
      } else {
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }
  
  const clearFilters = () => {
    setFilters({
      name: '',
      sku: '',
      price: '',
      description: '',
      stockOperator: '',
      stockValue: '',
      stockMinValue: '',
      stockMaxValue: '',
      status: ''
    })
    setCurrentPage(1)
  }
  
  // Apply filters and sorting
  const filteredProducts = filterProducts(products)
  const sortedProducts = sortProducts(filteredProducts)
  
  // Calcular paginación con productos filtrados
  const totalItems = sortedProducts.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = sortedProducts.slice(startIndex, endIndex)
  
  // Funciones de navegación
  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
  const goToLastPage = () => setCurrentPage(totalPages)
  
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-camouflage-green-900 flex items-center">
              <ShoppingCart className="h-8 w-8 mr-3 text-camouflage-green-700" />
              Items de Venta
            </h1>
            <p className="text-camouflage-green-600 mt-1">Crea, edita y controla tus ítems en un solo lugar.</p>
          </div>
          <Button size="lg" className="bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white pl-4 pr-4">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo item de venta
          </Button>
        </div>

        {/* Tabla de Items */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">Items Disponibles ({totalItems})</CardTitle>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className={`border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50 transition-all duration-200 ${
                  showFilters ? 'bg-camouflage-green-100 border-camouflage-green-400' : ''
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {/* Fila de filtros con transición suave - SOLO cuando showFilters es true */}
                {showFilters && (
                  <TableRow className="hover:bg-transparent border-camouflage-green-200 bg-camouflage-green-50/30 animate-in slide-in-from-top-2 duration-300">
                    <TableHead className="w-[200px]">
                      <div className=" py-3">
                        <input
                          type="text"
                          placeholder="Nombre"
                          value={filters.name}
                          onChange={(e) => handleFilterChange('name', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white text-camouflage-green-900 border border-camouflage-green-300 rounded focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 placeholder-camouflage-green-400"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <div className=" py-3">
                        <input
                          type="text"
                          placeholder="Referencia"
                          value={filters.sku}
                          onChange={(e) => handleFilterChange('sku', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white text-camouflage-green-900 border border-camouflage-green-300 rounded focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 placeholder-camouflage-green-400"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px]">
                      <div className="py-3">
                        <input
                          type="text"
                          placeholder="Precio"
                          value={filters.price}
                          onChange={(e) => handleFilterChange('price', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white text-camouflage-green-900 border border-camouflage-green-300 rounded focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 placeholder-camouflage-green-400"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[250px]">
                      <div className="py-3">
                        <input
                          type="text"
                          placeholder="Descripción"
                          value={filters.description}
                          onChange={(e) => handleFilterChange('description', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white text-camouflage-green-900 border border-camouflage-green-300 rounded focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 placeholder-camouflage-green-400"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <div className="py-3 flex items-center gap-1">
                        <select
                          value={filters.stockOperator}
                          onChange={(e) => {
                            handleFilterChange('stockOperator', e.target.value)
                            // Limpiar valores cuando se cambia el operador
                            if (e.target.value !== 'between') {
                              handleFilterChange('stockMinValue', '')
                              handleFilterChange('stockMaxValue', '')
                            } else {
                              handleFilterChange('stockValue', '')
                            }
                          }}
                          className="w-18 px-2 py-2 text-xs bg-white text-camouflage-green-900 border border-camouflage-green-300 rounded focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                          title="Operador de comparación"
                        >
                          <option value="">-</option>
                          <option value="equal">=</option>
                          <option value="greater">&gt;</option>
                          <option value="greaterEqual">&gt;=</option>
                          <option value="less">&lt;</option>
                          <option value="lessEqual">&lt;=</option>
                          <option value="between">Rango</option>
                        </select>
                        {filters.stockOperator === 'between' ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="number"
                              placeholder="Min"
                              value={filters.stockMinValue}
                              onChange={(e) => handleFilterChange('stockMinValue', e.target.value)}
                              className="w-14 px-2 py-2 text-xs bg-white text-camouflage-green-900 border border-camouflage-green-300 rounded focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 placeholder-camouflage-green-400"
                              min="0"
                            />
                            <span className="text-xs text-camouflage-green-600">y</span>
                            <input
                              type="number"
                              placeholder="Max"
                              value={filters.stockMaxValue}
                              onChange={(e) => handleFilterChange('stockMaxValue', e.target.value)}
                              className="w-14 px-2 py-2 text-xs bg-white text-camouflage-green-900 border border-camouflage-green-300 rounded focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 placeholder-camouflage-green-400"
                              min="0"
                            />
                          </div>
                        ) : (
                          <input
                            type="number"
                            placeholder="0"
                            value={filters.stockValue}
                            onChange={(e) => handleFilterChange('stockValue', e.target.value)}
                            className="w-16 px-3 py-2 text-sm bg-white text-camouflage-green-900 border border-camouflage-green-300 rounded focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 placeholder-camouflage-green-400"
                            min="0"
                          />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[160px]">
                      <div className="py-3 flex items-center gap-1">
                        <select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          className="w-22 px-1 py-2 text-sm bg-white text-camouflage-green-900 border border-camouflage-green-300 rounded focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                          title="Filtrar por estado"
                        >
                          <option value="">Todos</option>
                          <option value="active">Activos</option>
                          <option value="inactive">Inactivos</option>
                        </select>
                        <Button
                          onClick={clearFilters}
                          size="sm"
                          variant="outline"
                          className="h-9 w-9 p-0 ml-2 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100"
                          title="Limpiar filtros"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableHead>
                  </TableRow>
                )}
                {/* Fila de headers de columnas */}
                <TableRow className="hover:bg-transparent border-camouflage-green-200">
                  <TableHead className="w-[200px] text-camouflage-green-700 font-semibold">
                    <div>
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group"
                      >
                        Nombre 
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronUp className={`h-3 w-3 ${sortField === 'name' && sortDirection === 'asc' ? 'text-camouflage-green-900' : ''}`} />
                          <ChevronDown className={`h-3 w-3 ${sortField === 'name' && sortDirection === 'desc' ? 'text-camouflage-green-900' : ''}`} />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  {/* px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider */}
                  <TableHead className="w-[120px] text-camouflage-green-700 font-semibold">
                    <div>
                      <button
                        onClick={() => handleSort('sku')}
                        className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group"
                      >
                        Referencia
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronUp className={`h-3 w-3 ${sortField === 'sku' && sortDirection === 'asc' ? 'text-camouflage-green-900' : ''}`} />
                          <ChevronDown className={`h-3 w-3 ${sortField === 'sku' && sortDirection === 'desc' ? 'text-camouflage-green-900' : ''}`} />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px] text-camouflage-green-700 font-semibold">
                    <div>
                      <button
                        onClick={() => handleSort('price')}
                        className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group"
                      >
                        Precio
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronUp className={`h-3 w-3 ${sortField === 'price' && sortDirection === 'asc' ? 'text-camouflage-green-900' : ''}`} />
                          <ChevronDown className={`h-3 w-3 ${sortField === 'price' && sortDirection === 'desc' ? 'text-camouflage-green-900' : ''}`} />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[250px] text-camouflage-green-700 font-semibold">
                    <div>
                      <button
                        onClick={() => handleSort('description')}
                        className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group"
                      >
                        Descripción
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronUp className={`h-3 w-3 ${sortField === 'description' && sortDirection === 'asc' ? 'text-camouflage-green-900' : ''}`} />
                          <ChevronDown className={`h-3 w-3 ${sortField === 'description' && sortDirection === 'desc' ? 'text-camouflage-green-900' : ''}`} />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] text-camouflage-green-700 font-semibold text-center">
                    <div>
                      <button
                        onClick={() => handleSort('stock')}
                        className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group"
                      >
                        Unidades
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronUp className={`h-3 w-3 ${sortField === 'stock' && sortDirection === 'asc' ? 'text-camouflage-green-900' : ''}`} />
                          <ChevronDown className={`h-3 w-3 ${sortField === 'stock' && sortDirection === 'desc' ? 'text-camouflage-green-900' : ''}`} />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[160px] text-camouflage-green-700 font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.map((product) => (
                  <TableRow 
                  key={product.id}
                    className="border-camouflage-green-100 hover:bg-camouflage-green-50/50 transition-colors"
                  >
                                        <TableCell className="w-[200px]">
                      <div className="font-medium text-camouflage-green-900">{product.name}</div>
                    </TableCell>
                    <TableCell className="w-[120px]">
                      <div className="text-camouflage-green-600 font-mono text-sm">{product.sku}</div>
                    </TableCell>
                    <TableCell className="w-[100px]">
                      <div className="font-semibold text-camouflage-green-700">${product.price}</div>
                    </TableCell>
                    <TableCell className="w-[250px]">
                      <div className="text-camouflage-green-600 text-sm max-w-[230px] truncate" title={product.description}>
                        {product.description}
                  </div>
                    </TableCell>
                    <TableCell className="w-[120px]">
                      <div className="">
                        <span
                          className={`px-4 py-2 text-sm font-semibold rounded-full min-w-[50px] text-center ${
                                product.stock > product.minStock 
                                  ? "bg-camouflage-green-100 text-camouflage-green-800" 
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                              {product.stock}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[160px]">
                      <div className="flex items-center justify-start gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 border-camouflage-green-300 hover:border-camouflage-green-400"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 border-camouflage-green-300 hover:border-camouflage-green-400"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-camouflage-green-300 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 hover:border-camouflage-green-400"
                          title={product.stock > 0 ? "Desactivar" : "Activar"}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 border-camouflage-green-300 hover:border-camouflage-green-400"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                    </TableCell>
                  </TableRow>
              ))}
              </TableBody>
            </Table>
          </CardContent>
          
          {/* Paginación */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-camouflage-green-200 bg-camouflage-green-50/30">
            <div className="flex items-center gap-6 text-sm text-camouflage-green-600">
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <span>
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Resultados por página */}
              <div className="flex items-center gap-2 text-sm text-camouflage-green-600">
                <span>Resultados por página</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="border border-camouflage-green-300 rounded px-2 py-1 text-camouflage-green-700 bg-white focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              {/* Botones de navegación */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Primera página"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Última página"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
