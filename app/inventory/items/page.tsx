"use client"

import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Power,
  PowerOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"

import { NewItemForm } from "@/components/forms/new-item-form"
import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import { MainLayout } from "@/components/layout/main-layout"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Modal } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInventory } from "@/contexts/inventory-context"
import { useToast } from "@/hooks/use-toast"
import { PaginationConfig } from "@/lib/types/inventory-value"
import { ItemFilters, SortConfig, SortField, SortDirection } from "@/lib/types/items"
import { applyFiltersAndSort } from "@/lib/utils/item-filters"

export default function SalesItems() {
  const { products, updateProduct, deleteProduct } = useInventory()
  const router = useRouter()
  const { toast } = useToast()

  // Estado local para los productos (similar a bodegas)
  const [localProducts, setLocalProducts] = useState(products)

  // Sincronizar el estado local con el contexto cuando cambien los productos
  useEffect(() => {
    setLocalProducts(products)
  }, [products])

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Estado para el modal de nuevo item
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false)

  // Estado para filtros y ordenamiento
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ItemFilters>({
    name: "",
    sku: "",
    price: "",
    description: "",
    stockOperator: "",
    stockValue: "",
    stockMinValue: "",
    stockMaxValue: "",
    status: "",
  })
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedCount = selectedIds.size
  console.log("Current selectedCount:", selectedCount, "selectedIds:", Array.from(selectedIds))
  const isSelected = (id: string) => selectedIds.has(id)
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        console.log("Removing from selection:", id)
        next.delete(id)
      } else {
        console.log("Adding to selection:", id)
        next.add(id)
      }
      console.log("New selectedIds:", Array.from(next))
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())

  // Lógica para determinar el estado de los botones de acciones masivas
  const selectedProducts = localProducts.filter((p) => selectedIds.has(p.id))
  const allSelectedActive = selectedProducts.length > 0 && selectedProducts.every((p) => p.isActive ?? true)
  const allSelectedInactive = selectedProducts.length > 0 && selectedProducts.every((p) => !(p.isActive ?? true))
  const hasMixedStates = selectedProducts.length > 0 && !allSelectedActive && !allSelectedInactive

  // Configuración de ordenamiento
  const sortConfig: SortConfig = {
    field: sortField,
    direction: sortDirection,
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    // Limpiar selección al cambiar ordenamiento
    clearSelection()
  }

  const handleFilterChange = (field: keyof ItemFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setCurrentPage(1) // Reset to first page when filtering
    // Limpiar selección al cambiar filtros
    clearSelection()
  }

  const clearFilters = () => {
    setFilters({
      name: "",
      sku: "",
      price: "",
      description: "",
      stockOperator: "",
      stockValue: "",
      stockMinValue: "",
      stockMaxValue: "",
      status: "",
    })
    setCurrentPage(1)
    // Limpiar selección al limpiar filtros
    clearSelection()
  }

  // Apply filters and sorting
  const sortedProducts = applyFiltersAndSort(localProducts, filters, sortConfig)

  // Calcular configuración de paginación
  const pagination: PaginationConfig = useMemo(() => {
    const totalItems = sortedProducts.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
    }
  }, [sortedProducts.length, currentPage, itemsPerPage])

  // Productos para mostrar en la página actual
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedProducts.slice(startIndex, endIndex)
  }, [sortedProducts, currentPage, itemsPerPage])
  const allCurrentSelected = useMemo(
    () => currentProducts.length > 0 && currentProducts.every((p) => selectedIds.has(p.id)),
    [currentProducts, selectedIds],
  )
  const toggleSelectAllCurrent = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allCurrentSelected) {
        console.log(
          "Deselecting all current products:",
          currentProducts.map((p) => ({ id: p.id, name: p.name })),
        )
        currentProducts.forEach((p) => next.delete(p.id))
      } else {
        console.log(
          "Selecting all current products:",
          currentProducts.map((p) => ({ id: p.id, name: p.name })),
        )
        currentProducts.forEach((p) => next.add(p.id))
      }
      console.log("New selectedIds after toggle all:", Array.from(next))
      return next
    })
  }

  // Acciones masivas (similar a bodegas)
  const bulkSetActive = (isActive: boolean) => {
    console.log("bulkSetActive called with:", { isActive, selectedIds: Array.from(selectedIds) })
    if (selectedIds.size === 0) return

    setLocalProducts((prevProducts) =>
      prevProducts.map((product) => (selectedIds.has(product.id) ? { ...product, isActive } : product)),
    )
    toast({
      title: isActive ? "Ítems activados" : "Ítems desactivados",
      description: `${selectedIds.size} ítem(s) actualizados.`,
    })
    clearSelection()
  }

  const bulkDelete = () => {
    console.log("bulkDelete called with selectedIds:", Array.from(selectedIds))
    if (selectedIds.size === 0) return

    setLocalProducts((prevProducts) => prevProducts.filter((product) => !selectedIds.has(product.id)))
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <ShoppingCart className="mr-3 h-8 w-8 text-camouflage-green-700" />
              Items de Venta
            </h1>
            <p className="mt-1 text-camouflage-green-600">Crea, edita y controla tus ítems en un solo lugar.</p>
          </div>
          <Button
            size="md2"
            className="bg-camouflage-green-700 pl-4 pr-4 text-white hover:bg-camouflage-green-800"
            onClick={() => setIsNewItemModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo item de venta
          </Button>
        </div>

        {/* Tabla de Items */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">
                Items Disponibles ({pagination.totalItems.toLocaleString()})
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-camouflage-green-200 bg-camouflage-green-50/60 px-2 py-1 text-sm text-camouflage-green-800">
                    <span>{selectedCount} seleccionado(s)</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 text-camouflage-green-600 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                      onClick={() => setSelectedIds(new Set())}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-camouflage-green-300 px-2 text-camouflage-green-700 hover:bg-camouflage-green-100"
                            disabled={allSelectedActive}
                          >
                            Activar
                          </Button>
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-camouflage-green-300 px-2 text-camouflage-green-700 hover:bg-camouflage-green-100"
                            disabled={allSelectedInactive}
                          >
                            Desactivar
                          </Button>
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-camouflage-green-300 px-2 text-red-700 hover:border-red-300 hover:bg-red-50"
                          >
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar ítems seleccionados</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminarán {selectedCount} ítem(s).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={bulkDelete}>
                              Eliminar
                            </AlertDialogAction>
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
                  className={`border-camouflage-green-300 text-camouflage-green-700 transition-all duration-200 hover:bg-camouflage-green-50 ${
                    showFilters ? "border-camouflage-green-400 bg-camouflage-green-100" : ""
                  }`}
                >
                  <Filter className="mr-2 h-4 w-4" />
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
                  <TableRow className="animate-in slide-in-from-top-2 border-camouflage-green-200 bg-camouflage-green-50/30 duration-300 hover:bg-transparent">
                    <TableHead className="w-[36px]">{/* Columna vacía para alinear con checkbox */}</TableHead>
                    <TableHead className="w-[200px]">
                      <div className=" py-3">
                        <input
                          type="text"
                          placeholder="Nombre"
                          value={filters.name}
                          onChange={(e) => handleFilterChange("name", e.target.value)}
                          className="w-full rounded border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <div className=" py-3">
                        <input
                          type="text"
                          placeholder="Referencia"
                          value={filters.sku}
                          onChange={(e) => handleFilterChange("sku", e.target.value)}
                          className="w-full rounded border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px]">
                      <div className="py-3">
                        <input
                          type="text"
                          placeholder="Precio"
                          value={filters.price}
                          onChange={(e) => handleFilterChange("price", e.target.value)}
                          className="w-full rounded border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[250px]">
                      <div className="py-3">
                        <input
                          type="text"
                          placeholder="Descripción"
                          value={filters.description}
                          onChange={(e) => handleFilterChange("description", e.target.value)}
                          className="w-full rounded border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <div className="flex items-center gap-1 py-3">
                        <select
                          value={filters.stockOperator}
                          onChange={(e) => {
                            handleFilterChange("stockOperator", e.target.value)
                            // Limpiar valores cuando se cambia el operador
                            if (e.target.value !== "between") {
                              handleFilterChange("stockMinValue", "")
                              handleFilterChange("stockMaxValue", "")
                            } else {
                              handleFilterChange("stockValue", "")
                            }
                          }}
                          className="w-18 rounded border border-camouflage-green-300 bg-white px-2 py-2 text-xs text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
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
                        {filters.stockOperator === "between" ? (
                          <div className="flex flex-1 items-center gap-1">
                            <input
                              type="number"
                              placeholder="Min"
                              value={filters.stockMinValue}
                              onChange={(e) => handleFilterChange("stockMinValue", e.target.value)}
                              className="w-14 rounded border border-camouflage-green-300 bg-white px-2 py-2 text-xs text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                              min="0"
                            />
                            <span className="text-xs text-camouflage-green-600">y</span>
                            <input
                              type="number"
                              placeholder="Max"
                              value={filters.stockMaxValue}
                              onChange={(e) => handleFilterChange("stockMaxValue", e.target.value)}
                              className="w-14 rounded border border-camouflage-green-300 bg-white px-2 py-2 text-xs text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                              min="0"
                            />
                          </div>
                        ) : (
                          <input
                            type="number"
                            placeholder="0"
                            value={filters.stockValue}
                            onChange={(e) => handleFilterChange("stockValue", e.target.value)}
                            className="w-16 rounded border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                            min="0"
                          />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[160px]">
                      <div className="flex items-center gap-1 py-3">
                        <select
                          value={filters.status}
                          onChange={(e) => handleFilterChange("status", e.target.value)}
                          className="w-22 rounded border border-camouflage-green-300 bg-white px-1 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
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
                          className="ml-2 h-9 w-9 border-camouflage-green-300 p-0 text-camouflage-green-700 hover:bg-camouflage-green-100"
                          title="Limpiar filtros"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableHead>
                  </TableRow>
                )}
                {/* Fila de headers de columnas */}
                <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                  <TableHead className="w-[36px]">
                    <div className="pl-3">
                      <Checkbox
                        checked={allCurrentSelected}
                        onCheckedChange={(checked) => {
                          console.log("Select all checkbox changed:", {
                            checked,
                            currentProducts: currentProducts.map((p) => ({ id: p.id, name: p.name })),
                          })
                          toggleSelectAllCurrent()
                        }}
                        aria-label="Seleccionar todos"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[200px] font-semibold text-camouflage-green-700">
                    <div>
                      <button
                        onClick={() => handleSort("name")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                      >
                        Nombre
                        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronUp
                            className={`h-3 w-3 ${sortField === "name" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                          />
                          <ChevronDown
                            className={`h-3 w-3 ${sortField === "name" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                          />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  {/* px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider */}
                  <TableHead className="w-[120px] font-semibold text-camouflage-green-700">
                    <div>
                      <button
                        onClick={() => handleSort("sku")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                      >
                        Referencia
                        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronUp
                            className={`h-3 w-3 ${sortField === "sku" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                          />
                          <ChevronDown
                            className={`h-3 w-3 ${sortField === "sku" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                          />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px] font-semibold text-camouflage-green-700">
                    <div>
                      <button
                        onClick={() => handleSort("price")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                      >
                        Precio
                        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronUp
                            className={`h-3 w-3 ${sortField === "price" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                          />
                          <ChevronDown
                            className={`h-3 w-3 ${sortField === "price" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                          />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[250px] font-semibold text-camouflage-green-700">
                    <div>
                      <button
                        onClick={() => handleSort("description")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                      >
                        Descripción
                        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronUp
                            className={`h-3 w-3 ${sortField === "description" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                          />
                          <ChevronDown
                            className={`h-3 w-3 ${sortField === "description" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                          />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] text-center font-semibold text-camouflage-green-700">
                    <div>
                      <button
                        onClick={() => handleSort("stock")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                      >
                        Cantidad
                        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronUp
                            className={`h-3 w-3 ${sortField === "stock" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                          />
                          <ChevronDown
                            className={`h-3 w-3 ${sortField === "stock" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                          />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[160px] font-semibold text-camouflage-green-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
                  >
                    <TableCell className="w-[36px]">
                      <div className="pl-3">
                        <Checkbox
                          checked={isSelected(product.id)}
                          onCheckedChange={() => {
                            console.log("Individual checkbox clicked for product:", product.name, "ID:", product.id)
                            toggleSelect(product.id)
                          }}
                          aria-label={`Seleccionar ${product.name}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <button
                        onClick={() => router.push(`/inventory/items/${product.id}`)}
                        className="text-left font-medium text-camouflage-green-900 transition-colors hover:text-camouflage-green-700 hover:underline"
                      >
                        {product.name}
                      </button>
                    </TableCell>
                    <TableCell className="w-[120px]">
                      <div className="font-mono text-sm text-camouflage-green-600">{product.sku}</div>
                    </TableCell>
                    <TableCell className="w-[100px]">
                      <div className="font-semibold text-camouflage-green-700">${product.price}</div>
                    </TableCell>
                    <TableCell className="w-[250px]">
                      <div
                        className="max-w-[230px] truncate text-sm text-camouflage-green-600"
                        title={product.description}
                      >
                        {product.description}
                      </div>
                    </TableCell>
                    <TableCell className="w-[120px]">
                      <div className="">
                        <span
                          className={`min-w-[50px] rounded-full px-4 py-2 text-center text-sm font-semibold ${
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
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                          title="Ver detalles"
                          onClick={() => router.push(`/inventory/items/${product.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                          title="Editar"
                          onClick={() => router.push(`/inventory/items/${product.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                          title={(product.isActive ?? true) ? "Desactivar" : "Activar"}
                          onClick={() => {
                            const current = product.isActive ?? true
                            setLocalProducts((prevProducts) =>
                              prevProducts.map((p) => (p.id === product.id ? { ...p, isActive: !current } : p)),
                            )
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
                              className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
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
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => {
                                  setLocalProducts((prevProducts) => prevProducts.filter((p) => p.id !== product.id))
                                  toast({ title: "Ítem eliminado", description: `Se eliminó "${product.name}".` })
                                  // si estaba seleccionado, lo sacamos
                                  setSelectedIds((prev) => {
                                    const next = new Set(prev)
                                    next.delete(product.id)
                                    return next
                                  })
                                }}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {currentProducts.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <ShoppingCart className="h-12 w-12 text-camouflage-green-300" />
                        <div>
                          <p className="font-medium text-camouflage-green-600">
                            {sortedProducts.length === 0 ? "No hay items registrados" : "No se encontraron items"}
                          </p>
                          <p className="mt-1 text-sm text-camouflage-green-500">
                            {sortedProducts.length === 0
                              ? "Comienza agregando tu primer item de venta"
                              : "Intenta ajustar los filtros de búsqueda"}
                          </p>
                        </div>
                        {sortedProducts.length === 0 && (
                          <Button
                            onClick={() => setIsNewItemModalOpen(true)}
                            className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Crea tu primer item
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
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
        size="xl"
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
