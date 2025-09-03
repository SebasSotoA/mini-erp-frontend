"use client"

import { useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Modal } from "@/components/ui/modal"
import { NewItemForm } from "@/components/forms/new-item-form"
import { useInventory } from "@/contexts/inventory-context"
import { ShoppingCart, Plus, Search, Filter, Eye, Edit, Power, PowerOff, Trash2, ChevronUp, ChevronDown, X } from "lucide-react"
import { ItemFilters, SortConfig, SortField, SortDirection } from "@/lib/types/items"
import { PaginationConfig } from "@/lib/types/inventory-value"
import { applyFiltersAndSort } from "@/lib/utils/item-filters"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PaginationControls } from "@/components/inventory-value/pagination-controls"

export default function SalesItems() {
  const { products, updateProduct, deleteProduct } = useInventory()
  const router = useRouter()
  const { toast } = useToast()
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Estado para el modal de nuevo item
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false)
  
  // Estado para filtros y ordenamiento
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ItemFilters>({
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
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedCount = selectedIds.size
  const isSelected = (id: string) => selectedIds.has(id)
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())
  
  // Configuración de ordenamiento
  const sortConfig: SortConfig = {
    field: sortField,
    direction: sortDirection
  }
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  const handleFilterChange = (field: keyof ItemFilters, value: string) => {
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
  const sortedProducts = applyFiltersAndSort(products, filters, sortConfig)
  
  // Calcular configuración de paginación
  const pagination: PaginationConfig = useMemo(() => {
    const totalItems = sortedProducts.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    
    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages
    }
  }, [sortedProducts.length, currentPage, itemsPerPage])
  
  // Productos para mostrar en la página actual
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedProducts.slice(startIndex, endIndex)
  }, [sortedProducts, currentPage, itemsPerPage])
  const allCurrentSelected = useMemo(() => currentProducts.length > 0 && currentProducts.every(p => selectedIds.has(p.id)), [currentProducts, selectedIds])
  const toggleSelectAllCurrent = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allCurrentSelected) {
        currentProducts.forEach(p => next.delete(p.id))
      } else {
        currentProducts.forEach(p => next.add(p.id))
      }
      return next
    })
  }

  // Acciones masivas
  const bulkSetActive = (isActive: boolean) => {
    if (selectedIds.size === 0) return
    selectedIds.forEach(id => updateProduct(id, { isActive }))
    toast({ title: isActive ? "Ítems activados" : "Ítems desactivados", description: `${selectedIds.size} ítem(s) actualizados.` })
  }
  const bulkDelete = () => {
    if (selectedIds.size === 0) return
    selectedIds.forEach(id => deleteProduct(id))
    toast({ title: "Ítems eliminados", description: `${selectedIds.size} ítem(s) eliminados.` })
    clearSelection()
  }
  
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
          <Button 
            size="lg" 
            className="bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white pl-4 pr-4"
            onClick={() => setIsNewItemModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo item de venta
          </Button>
        </div>

        {/* Tabla de Items */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">Items Disponibles ({pagination.totalItems.toLocaleString()})</CardTitle>
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <div className="flex items-center gap-2 bg-camouflage-green-50/60 border border-camouflage-green-200 rounded-lg px-2 py-1 text-sm text-camouflage-green-800">
                    <span>{selectedCount} seleccionado(s)</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100"
                      onClick={() => setSelectedIds(new Set())}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 px-2 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100">Activar</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Activar ítems seleccionados</AlertDialogTitle>
                            <AlertDialogDescription>Se activarán {selectedCount} ítem(s).</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => bulkSetActive(true)}>Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 px-2 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100">Desactivar</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Desactivar ítems seleccionados</AlertDialogTitle>
                            <AlertDialogDescription>Se desactivarán {selectedCount} ítem(s).</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => bulkSetActive(false)}>Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 px-2 border-camouflage-green-300 text-red-700 hover:bg-red-50 hover:border-red-300">Eliminar</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar ítems seleccionados</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminarán {selectedCount} ítem(s).</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={bulkDelete}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}

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
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {/* Fila de filtros con transición suave - SOLO cuando showFilters es true */}
                {showFilters && (
                  <TableRow className="hover:bg-transparent border-camouflage-green-200 bg-camouflage-green-50/30 animate-in slide-in-from-top-2 duration-300">
                    <TableHead className="w-[36px]">
                      {/* Columna vacía para alinear con checkbox */}
                    </TableHead>
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
                  <TableHead className="w-[36px]">
                    <div className="pl-3">
                      <Checkbox checked={allCurrentSelected} onCheckedChange={toggleSelectAllCurrent} aria-label="Seleccionar todos" />
                    </div>
                  </TableHead>
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
                    <TableCell className="w-[36px]">
                      <div className="pl-3">
                        <Checkbox checked={isSelected(product.id)} onCheckedChange={() => toggleSelect(product.id)} aria-label={`Seleccionar ${product.name}`} />
                      </div>
                    </TableCell>
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
                          onClick={() => router.push(`/inventory/items/${product.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 border-camouflage-green-300 hover:border-camouflage-green-400"
                          title="Editar"
                          onClick={() => router.push(`/inventory/items/${product.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-camouflage-green-300 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 hover:border-camouflage-green-400"
                          title={(product.isActive ?? true) ? "Desactivar" : "Activar"}
                          onClick={() => {
                            const current = product.isActive ?? true
                            updateProduct(product.id, { isActive: !current })
                          }}
                        >
                          {(product.isActive ?? true) ? (
                            <Power className="h-4 w-4" />
                          ) : (
                            <PowerOff className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 border-camouflage-green-300 hover:border-camouflage-green-400"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar ítem</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará "{product.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => {
                                deleteProduct(product.id)
                                toast({ title: "Ítem eliminado", description: `Se eliminó "${product.name}".` })
                                // si estaba seleccionado, lo sacamos
                                setSelectedIds(prev => {
                                  const next = new Set(prev)
                                  next.delete(product.id)
                                  return next
                                })
                              }}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                  </div>
                    </TableCell>
                  </TableRow>
              ))}
              </TableBody>
            </Table>
          </CardContent>
          
          {/* Paginación */}
          <PaginationControls
            pagination={pagination}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </Card>
      </div>

      {/* Modal para nuevo item */}
      <Modal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        title="Formulario básico de productos"
      >
        <NewItemForm
          onClose={() => setIsNewItemModalOpen(false)}
          onSuccess={() => {
            // Resetear página actual cuando se agrega un nuevo producto
            setCurrentPage(1)
          }}
        />
      </Modal>
    </MainLayout>
  )
}
