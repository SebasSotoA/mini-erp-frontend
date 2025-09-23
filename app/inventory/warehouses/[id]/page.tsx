"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInventory } from "@/contexts/inventory-context"
import { Warehouse as WarehouseIcon, ChevronUp, ChevronDown, X, ShoppingCart, Eye, Edit, Power, PowerOff, Tag, Filter, Trash2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import { ItemFilters, SortConfig, SortField, SortDirection } from "@/lib/types/items"
import { applyFiltersAndSort } from "@/lib/utils/item-filters"
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

export default function WarehouseDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { warehouses, products, productStocks, updateProduct, deleteProduct } = useInventory()

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const warehouse = warehouses.find(w => w.id === id)
  const [isWarehouseActive, setIsWarehouseActive] = useState<boolean>(warehouse?.isActive ?? true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editWarehouseData, setEditWarehouseData] = useState({
    name: warehouse?.name || '',
    location: warehouse?.location || '',
    observations: '' // Campo adicional no en el tipo original
  })

  // Construir el conjunto de productos asociados a la bodega vía productStocks
  const associatedProductIds = useMemo(() => new Set(productStocks.filter(ps => ps.warehouseId === id).map(ps => ps.productId)), [productStocks, id])
  const warehouseProducts = useMemo(() => products.filter(p => associatedProductIds.has(p.id)), [products, associatedProductIds])

  // Estado para filtros/orden/paginación (igual que items/page.tsx)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

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
  const [showFilters, setShowFilters] = useState(false)

  const selectedIdsState = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = selectedIdsState
  const selectedCount = selectedIds.size
  const isSelected = (pid: string) => selectedIds.has(pid)
  const toggleSelect = (pid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(pid)) next.delete(pid)
      else next.add(pid)
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('asc') }
  }

  const handleFilterChange = (field: keyof ItemFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1)
  }
  const clearFilters = () => {
    setFilters({
      name: '', sku: '', price: '', description: '', stockOperator: '', stockValue: '', stockMinValue: '', stockMaxValue: '', status: ''
    })
    setCurrentPage(1)
  }

  const sortConfig: SortConfig = { field: sortField, direction: sortDirection }
  const filteredSortedProducts = applyFiltersAndSort(warehouseProducts, filters, sortConfig)

  const totalItems = filteredSortedProducts.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredSortedProducts.slice(startIndex, endIndex)
  }, [filteredSortedProducts, currentPage, itemsPerPage])
  const allCurrentSelected = useMemo(() => currentProducts.length > 0 && currentProducts.every(p => selectedIds.has(p.id)), [currentProducts, selectedIds])
  const toggleSelectAllCurrent = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allCurrentSelected) { currentProducts.forEach(p => next.delete(p.id)) }
      else { currentProducts.forEach(p => next.add(p.id)) }
      return next
    })
  }

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

  // Funciones para el modal de edición
  const handleEditWarehouseInputChange = (field: keyof typeof editWarehouseData, value: string) => {
    setEditWarehouseData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveEditWarehouse = () => {
    if (!editWarehouseData.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" })
      return
    }
    
    // Aquí iría la lógica para actualizar la bodega en el contexto
    toast({ title: "Bodega actualizada", description: `"${editWarehouseData.name}" fue actualizada exitosamente.` })
    setIsEditModalOpen(false)
  }

  const handleCancelEditWarehouse = () => {
    // Restaurar datos originales
    setEditWarehouseData({
      name: warehouse?.name || '',
      location: warehouse?.location || '',
      observations: '' // Campo adicional no en el tipo original
    })
    setIsEditModalOpen(false)
  }

  if (!warehouse) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900">Bodega no encontrada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-camouflage-green-700">La bodega solicitada no existe o fue eliminada.</p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/inventory/warehouses")}
                  className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                >
                  Volver a Bodegas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Encabezado: Nombre de la bodega */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-camouflage-green-900 flex items-center">
              <WarehouseIcon className="h-8 w-8 mr-3 text-camouflage-green-700" />
              {warehouse.name}
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/inventory/warehouses")}
            className="text-base border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            title="Volver a Bodegas"
          >
            Volver
          </Button>
        </div>

        {/* Acciones sobre la bodega */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant={isWarehouseActive ? "primary" : "outline"}
              className={`${isWarehouseActive ? 'bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white' : 'border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50'}`}
              onClick={() => {
                setIsWarehouseActive(true)
                toast({ title: "Bodega activada", description: `"${warehouse.name}" está activa.` })
              }}
            >
              Activar
            </Button>
            <Button
              variant={!isWarehouseActive ? "primary" : "outline"}
              className={`${!isWarehouseActive ? 'bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white' : 'border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50'}`}
              onClick={() => {
                setIsWarehouseActive(false)
                toast({ title: "Bodega desactivada", description: `"${warehouse.name}" está inactiva.` })
              }}
            >
              Desactivar
            </Button>
          </div>
           <Button
             variant="outline"
             className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
             onClick={() => setIsEditModalOpen(true)}
           >
             <Edit className="h-4 w-4 mr-2" />
             Editar
           </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-camouflage-green-300 text-red-700 hover:bg-red-50 hover:border-red-300">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar bodega
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar bodega</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará "{warehouse.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { toast({ title: 'Bodega eliminada', description: `"${warehouse.name}" fue eliminada.` }); router.push('/inventory/warehouses') }}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Información de la bodega */}
        <Card className="border-camouflage-green-200">
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Nombre</div>
                <div className="text-camouflage-green-900 font-medium">{warehouse.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Ubicación</div>
                <div className="text-camouflage-green-900 font-medium">{warehouse.location}</div>
              </div>
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Estado</div>
                <div className="text-camouflage-green-900 font-medium">{warehouse.isActive ? 'Activa' : 'Inactiva'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de ítems asociados a la bodega */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">Items Asociados ({totalItems.toLocaleString()})</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="sm"
                  className={`border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50 transition-all duration-200 ${showFilters ? 'bg-camouflage-green-100 border-camouflage-green-400' : ''}`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
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
                      <Button size="sm" variant="outline" className="h-8 px-2 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100" onClick={() => bulkSetActive(true)}>Activar</Button>
                      <Button size="sm" variant="outline" className="h-8 px-2 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100" onClick={() => bulkSetActive(false)}>Desactivar</Button>
                      <Button size="sm" variant="outline" className="h-8 px-2 border-camouflage-green-300 text-red-700 hover:bg-red-50 hover:border-red-300" onClick={bulkDelete}>Eliminar</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {/* Fila de filtros */}
                {showFilters && (
                <TableRow className="hover:bg-transparent border-camouflage-green-200 bg-camouflage-green-50/30 animate-in slide-in-from-top-2 duration-300">
                  <TableHead className="w-[36px]" />
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

                {/* Headers de columnas */}
                <TableRow className="hover:bg-transparent border-camouflage-green-200">
                  <TableHead className="w-[36px]">
                    <div className="pl-3">
                      <Checkbox checked={allCurrentSelected} onCheckedChange={toggleSelectAllCurrent} aria-label="Seleccionar todos" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[200px] text-camouflage-green-700 font-semibold">
                    <div>
                      <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group">
                        Nombre
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronUp className={`h-3 w-3 ${sortField === 'name' && sortDirection === 'asc' ? 'text-camouflage-green-900' : ''}`} />
                          <ChevronDown className={`h-3 w-3 ${sortField === 'name' && sortDirection === 'desc' ? 'text-camouflage-green-900' : ''}`} />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] text-camouflage-green-700 font-semibold">
                    <div>
                      <button onClick={() => handleSort('sku')} className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group">
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
                      <button onClick={() => handleSort('price')} className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group">
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
                      <button onClick={() => handleSort('description')} className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group">
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
                      <button onClick={() => handleSort('stock')} className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group">
                        Cantidad
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
                {currentProducts.length > 0 ? (
                  currentProducts.map((product) => (
                    <TableRow key={product.id} className="border-camouflage-green-100 hover:bg-camouflage-green-50/50 transition-colors">
                      <TableCell className="w-[36px]">
                        <div className="pl-3">
                          <Checkbox checked={isSelected(product.id)} onCheckedChange={() => toggleSelect(product.id)} aria-label={`Seleccionar ${product.name}`} />
                        </div>
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <button
                          onClick={() => router.push(`/inventory/items/${product.id}`)}
                          className="font-medium text-camouflage-green-900 hover:text-camouflage-green-700 hover:underline transition-colors text-left"
                        >
                          {product.name}
                        </button>
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
                          <span className={`px-4 py-2 text-sm font-semibold rounded-full min-w-[50px] text-center ${product.stock > product.minStock ? "bg-camouflage-green-100 text-camouflage-green-800" : "bg-red-100 text-red-800"}`}>
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
                                  setSelectedIds(prev => { const next = new Set(prev); next.delete(product.id); return next })
                                }}>Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Tag className="h-12 w-12 text-camouflage-green-300" />
                        <div>
                          <p className="text-camouflage-green-600 font-medium">No hay ítems asociados a esta bodega</p>
                          <p className="text-camouflage-green-500 text-sm mt-1">Asigna productos a la bodega para verlos aquí.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>

          {/* Paginación */}
          <PaginationControls
            pagination={{ currentPage, itemsPerPage, totalItems, totalPages }}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1) }}
          />
        </Card>

       </div>

       {/* Modal para editar bodega */}
       <Modal
         isOpen={isEditModalOpen}
         onClose={handleCancelEditWarehouse}
         title="Editar Bodega"
       >
         <div className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="edit-warehouse-name" className="text-camouflage-green-700 font-medium">
               Nombre <span className="text-red-500">*</span>
             </Label>
             <Input
               id="edit-warehouse-name"
               type="text"
               placeholder="Ingresa el nombre de la bodega"
               value={editWarehouseData.name}
               onChange={(e) => handleEditWarehouseInputChange('name', e.target.value)}
               className="border-camouflage-green-300 focus:ring-camouflage-green-500 focus:border-camouflage-green-500 bg-white placeholder:text-gray-400"
             />
           </div>

           <div className="space-y-2">
             <Label htmlFor="edit-warehouse-location" className="text-camouflage-green-700 font-medium">
               Dirección
             </Label>
             <Input
               id="edit-warehouse-location"
               type="text"
               placeholder="Ingresa la dirección de la bodega"
               value={editWarehouseData.location}
               onChange={(e) => handleEditWarehouseInputChange('location', e.target.value)}
               className="border-camouflage-green-300 focus:ring-camouflage-green-500 focus:border-camouflage-green-500 bg-white placeholder:text-gray-400"
             />
           </div>

           <div className="space-y-2">
             <Label htmlFor="edit-warehouse-observations" className="text-camouflage-green-700 font-medium">
               Observaciones
             </Label>
             <Textarea
               id="edit-warehouse-observations"
               placeholder="Ingresa observaciones adicionales sobre la bodega"
               value={editWarehouseData.observations}
               onChange={(e) => handleEditWarehouseInputChange('observations', e.target.value)}
               className="border-camouflage-green-300 focus:ring-camouflage-green-500 focus:border-camouflage-green-500 bg-white placeholder:text-gray-400 min-h-[80px] resize-none scrollbar-thin scrollbar-thumb-camouflage-green-300 scrollbar-track-gray-100"
               style={{
                 outline: 'none',
                 boxShadow: 'none'
               }}
               onFocus={(e) => {
                 e.target.style.outline = 'none'
                 e.target.style.boxShadow = 'none'
               }}
             />
           </div>

           <div className="flex justify-end gap-3 pt-4">
             <Button
               variant="outline"
               onClick={handleCancelEditWarehouse}
               className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
             >
               Cancelar
             </Button>
             <Button
               onClick={handleSaveEditWarehouse}
               className="bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white"
             >
               Guardar cambios
             </Button>
           </div>
         </div>
       </Modal>
     </MainLayout>
   )
 }


