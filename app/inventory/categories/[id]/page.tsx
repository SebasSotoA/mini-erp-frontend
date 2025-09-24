"use client"

import {
  Tags,
  ChevronUp,
  ChevronDown,
  X,
  Eye,
  Edit,
  Power,
  PowerOff,
  Trash2,
  Filter,
  Image as ImageIcon,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useInventory } from "@/contexts/inventory-context"
import { useToast } from "@/hooks/use-toast"
import { ItemFilters, SortConfig, SortField, SortDirection } from "@/lib/types/items"
import { applyFiltersAndSort } from "@/lib/utils/item-filters"

const mockCategories = [
  {
    id: "1",
    name: "Electrónicos",
    description: "Dispositivos electrónicos, computadoras, móviles y accesorios",
    isActive: true,
    image: null,
  },
  {
    id: "2",
    name: "Ropa y Accesorios",
    description: "Vestimenta, calzado y complementos de moda",
    isActive: true,
    image: null,
  },
  {
    id: "3",
    name: "Hogar y Jardín",
    description: "Artículos para el hogar, decoración y herramientas de jardín",
    isActive: true,
    image: null,
  },
  {
    id: "4",
    name: "Deportes",
    description: "Equipos deportivos, ropa deportiva y accesorios de fitness",
    isActive: false,
    image: null,
  },
  {
    id: "5",
    name: "Libros y Medios",
    description: "Libros, revistas, música y películas",
    isActive: true,
    image: null,
  },
]

export default function CategoryDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { products, updateProduct, deleteProduct } = useInventory()

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const category = mockCategories.find((c) => c.id === id)
  const [isCategoryActive, setIsCategoryActive] = useState<boolean>(category?.isActive ?? true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editCategoryData, setEditCategoryData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    image: null as File | null,
  })

  // Filtrar productos por categoría
  const categoryProducts = useMemo(() => {
    return products.filter((p) => p.category === category?.name)
  }, [products, category?.name])

  // Estado para filtros/orden/paginación (igual que items/page.tsx)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

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
  const [showFilters, setShowFilters] = useState(false)

  const selectedIdsState = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = selectedIdsState
  const selectedCount = selectedIds.size
  const isSelected = (pid: string) => selectedIds.has(pid)
  const toggleSelect = (pid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(pid)) next.delete(pid)
      else next.add(pid)
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    else {
      setSortField(field)
      setSortDirection("asc")
    }
    // Limpiar selección al cambiar ordenamiento
    clearSelection()
  }

  const handleFilterChange = (field: keyof ItemFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setCurrentPage(1)
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

  const sortConfig: SortConfig = { field: sortField, direction: sortDirection }
  const filteredSortedProducts = applyFiltersAndSort(categoryProducts, filters, sortConfig)

  const totalItems = filteredSortedProducts.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredSortedProducts.slice(startIndex, endIndex)
  }, [filteredSortedProducts, currentPage, itemsPerPage])
  const allCurrentSelected = useMemo(
    () => currentProducts.length > 0 && currentProducts.every((p) => selectedIds.has(p.id)),
    [currentProducts, selectedIds],
  )
  const toggleSelectAllCurrent = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allCurrentSelected) {
        currentProducts.forEach((p) => next.delete(p.id))
      } else {
        currentProducts.forEach((p) => next.add(p.id))
      }
      return next
    })
  }

  const bulkSetActive = (isActive: boolean) => {
    if (selectedIds.size === 0) return
    selectedIds.forEach((id) => updateProduct(id, { isActive }))
    toast({
      title: isActive ? "Ítems activados" : "Ítems desactivados",
      description: `${selectedIds.size} ítem(s) actualizados.`,
    })
  }
  const bulkDelete = () => {
    if (selectedIds.size === 0) return
    selectedIds.forEach((id) => deleteProduct(id))
    toast({ title: "Ítems eliminados", description: `${selectedIds.size} ítem(s) eliminados.` })
    clearSelection()
  }

  // Funciones para el modal de edición
  const handleEditCategoryInputChange = (field: keyof typeof editCategoryData, value: string) => {
    setEditCategoryData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveEditCategory = () => {
    if (!editCategoryData.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" })
      return
    }

    toast({
      title: "Categoría actualizada",
      description: `"${editCategoryData.name}" fue actualizada exitosamente.`,
    })
    setIsEditModalOpen(false)
  }

  const handleCancelEditCategory = () => {
    // Restaurar datos originales
    setEditCategoryData({
      name: category?.name || "",
      description: category?.description || "",
      image: null,
    })
    setIsEditModalOpen(false)
  }

  if (!category) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900">Categoría no encontrada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-camouflage-green-700">La categoría solicitada no existe o fue eliminada.</p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/inventory/categories")}
                  className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                >
                  Volver a Categorías
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
        {/* Encabezado: Nombre de la categoría */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <Tags className="mr-3 h-8 w-8 text-camouflage-green-700" />
              {category.name}
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/inventory/categories")}
            className="border-camouflage-green-300 text-base text-camouflage-green-700 hover:bg-camouflage-green-50"
            title="Volver a Categorías"
          >
            Volver
          </Button>
        </div>

        {/* Acciones sobre la categoría */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant={isCategoryActive ? "primary" : "outline"}
              className={`${isCategoryActive ? "bg-camouflage-green-700 text-white hover:bg-camouflage-green-800" : "border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"}`}
              onClick={() => {
                setIsCategoryActive(true)
                toast({ title: "Categoría activada", description: `"${category.name}" está activa.` })
              }}
            >
              Activar
            </Button>
            <Button
              variant={!isCategoryActive ? "primary" : "outline"}
              className={`${!isCategoryActive ? "bg-camouflage-green-700 text-white hover:bg-camouflage-green-800" : "border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"}`}
              onClick={() => {
                setIsCategoryActive(false)
                toast({ title: "Categoría desactivada", description: `"${category.name}" está inactiva.` })
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
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-camouflage-green-300 text-red-700 hover:border-red-300 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar categoría
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar categoría</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará "{category.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    toast({ title: "Categoría eliminada", description: `"${category.name}" fue eliminada.` })
                    router.push("/inventory/categories")
                  }}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Información de la categoría */}
        <Card className="border-camouflage-green-200">
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Nombre</div>
                <div className="font-medium text-camouflage-green-900">{category.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Descripción</div>
                <div className="font-medium text-camouflage-green-900">{category.description}</div>
              </div>
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Estado</div>
                <div className="font-medium text-camouflage-green-900">{category.isActive ? "Activa" : "Inactiva"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de ítems asociados a la categoría */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">
                Items Asociados ({totalItems.toLocaleString()})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="sm"
                  className={`border-camouflage-green-300 text-camouflage-green-700 transition-all duration-200 hover:bg-camouflage-green-50 ${showFilters ? "border-camouflage-green-400 bg-camouflage-green-100" : ""}`}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrar
                </Button>
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-camouflage-green-300 px-2 text-camouflage-green-700 hover:bg-camouflage-green-100"
                        onClick={() => bulkSetActive(true)}
                      >
                        Activar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-camouflage-green-300 px-2 text-camouflage-green-700 hover:bg-camouflage-green-100"
                        onClick={() => bulkSetActive(false)}
                      >
                        Desactivar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-camouflage-green-300 px-2 text-red-700 hover:border-red-300 hover:bg-red-50"
                        onClick={bulkDelete}
                      >
                        Eliminar
                      </Button>
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
                  <TableRow className="animate-in slide-in-from-top-2 border-camouflage-green-200 bg-camouflage-green-50/30 duration-300 hover:bg-transparent">
                    <TableHead className="w-[36px]" />
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

                {/* Headers de columnas */}
                <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                  <TableHead className="w-[36px]">
                    <div className="pl-3">
                      <Checkbox
                        checked={allCurrentSelected}
                        onCheckedChange={toggleSelectAllCurrent}
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
                {currentProducts.length > 0 ? (
                  currentProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
                    >
                      <TableCell className="w-[36px]">
                        <div className="pl-3">
                          <Checkbox
                            checked={isSelected(product.id)}
                            onCheckedChange={() => toggleSelect(product.id)}
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
                            className={`min-w-[50px] rounded-full px-4 py-2 text-center text-sm font-semibold ${product.stock > product.minStock ? "bg-camouflage-green-100 text-camouflage-green-800" : "bg-red-100 text-red-800"}`}
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
                                    deleteProduct(product.id)
                                    toast({ title: "Ítem eliminado", description: `Se eliminó "${product.name}".` })
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
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Tags className="h-12 w-12 text-camouflage-green-300" />
                        <div>
                          <p className="font-medium text-camouflage-green-600">
                            No hay ítems asociados a esta categoría
                          </p>
                          <p className="mt-1 text-sm text-camouflage-green-500">
                            Asigna productos a la categoría para verlos aquí.
                          </p>
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
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n)
              setCurrentPage(1)
            }}
          />
        </Card>
      </div>

      {/* Modal para editar categoría */}
      <Modal isOpen={isEditModalOpen} onClose={handleCancelEditCategory} title="Editar Categoría">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-category-name" className="font-medium text-camouflage-green-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-category-name"
              type="text"
              placeholder="Ingresa el nombre de la categoría"
              value={editCategoryData.name}
              onChange={(e) => handleEditCategoryInputChange("name", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category-description" className="font-medium text-camouflage-green-700">
              Descripción
            </Label>
            <Textarea
              id="edit-category-description"
              placeholder="Ingresa una descripción de la categoría"
              value={editCategoryData.description}
              onChange={(e) => handleEditCategoryInputChange("description", e.target.value)}
              className="scrollbar-thin scrollbar-thumb-camouflage-green-300 scrollbar-track-gray-100 min-h-[80px] resize-none border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              style={{
                outline: "none",
                boxShadow: "none",
              }}
              onFocus={(e) => {
                e.target.style.outline = "none"
                e.target.style.boxShadow = "none"
              }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelEditCategory}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEditCategory}
              className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
