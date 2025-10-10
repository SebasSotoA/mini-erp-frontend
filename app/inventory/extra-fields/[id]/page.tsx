"use client"

import {
  Layers,
  ChevronUp,
  ChevronDown,
  X,
  Eye,
  Edit,
  Power,
  PowerOff,
  Trash2,
  Filter,
  ArrowLeft,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useInventory } from "@/contexts/inventory-context"
import { useToast } from "@/hooks/use-toast"
import { DatePicker } from "@/components/ui/date-picker"
import { ItemFilters, SortConfig, SortField, SortDirection } from "@/lib/types/items"
import { applyFiltersAndSort } from "@/lib/utils/item-filters"
import { NewItemForm } from "@/components/forms/new-item-form"

const mockExtraFields = [
  {
    id: "1",
    name: "Color",
    type: "texto",
    description: "Color principal del producto",
    defaultValue: "Blanco",
    isRequired: true,
    isActive: true,
  },
  {
    id: "2",
    name: "Peso",
    type: "número decimal",
    description: "Peso del producto en kilogramos",
    defaultValue: "0.00",
    isRequired: false,
    isActive: true,
  },
  {
    id: "3",
    name: "Fecha de Vencimiento",
    type: "fecha",
    description: "Fecha de vencimiento del producto",
    defaultValue: "",
    isRequired: false,
    isActive: true,
  },
  {
    id: "4",
    name: "Es Importado",
    type: "si/no",
    description: "Indica si el producto es importado",
    defaultValue: "No",
    isRequired: true,
    isActive: false,
  },
]

export default function ExtraFieldDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { products, updateProduct, deleteProduct } = useInventory()

  // Función helper para renderizar el input de valor por defecto según el tipo
  const renderDefaultValueInput = (type: string, value: string, onChange: (value: string) => void) => {
    switch (type) {
      case "texto":
        return (
          <Input
            type="text"
            placeholder="Valor por defecto del campo"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
      
      case "número":
        return (
          <Input
            type="number"
            placeholder="Valor por defecto del campo"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
      
      case "número decimal":
        return (
          <Input
            type="number"
            step="0.01"
            placeholder="Valor por defecto del campo"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
      
      case "fecha":
        const dateValue = value && value !== "" ? new Date(value) : null
        // Verificar si la fecha es válida
        const isValidDate = dateValue && !isNaN(dateValue.getTime())
        return (
          <DatePicker
            value={isValidDate ? dateValue : null}
            onChange={(date) => onChange(date ? date.toISOString().split('T')[0] : "")}
            placeholder="Seleccionar fecha por defecto"
            className="border-camouflage-green-300 bg-white focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
      
      case "si/no":
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="border-camouflage-green-300 bg-white focus:border-camouflage-green-500 focus:ring-camouflage-green-500">
              <SelectValue placeholder="Seleccionar valor por defecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sí">Sí</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        )
      
      default:
        return (
          <Input
            type="text"
            placeholder="Valor por defecto del campo"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
    }
  }

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const extraField = mockExtraFields.find((f) => f.id === id)
  const [isFieldActive, setIsFieldActive] = useState<boolean>(extraField?.isActive ?? true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isProductEditModalOpen, setIsProductEditModalOpen] = useState(false)
  const [editFieldData, setEditFieldData] = useState({
    name: extraField?.name || "",
    type: extraField?.type || "texto",
    defaultValue: extraField?.defaultValue || "",
    description: extraField?.description || "",
    isRequired: extraField?.isRequired || false,
  })

  // Estado local para los productos (para manejar acciones masivas correctamente)
  const [localFieldProducts, setLocalFieldProducts] = useState(products)

  // Sincronizar el estado local con los productos cuando cambien
  useEffect(() => {
    setLocalFieldProducts(products)
  }, [products])

  // Filtrar productos que usan este campo (simulado - en realidad se basaría en los datos del producto)
  const fieldProducts = useMemo(() => {
    // Por ahora retornamos todos los productos como ejemplo
    // En una implementación real, esto se basaría en qué productos tienen este campo
    return localFieldProducts
  }, [localFieldProducts])

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
  const filteredSortedProducts = applyFiltersAndSort(fieldProducts, filters, sortConfig)

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
    setLocalFieldProducts(prevProducts =>
      prevProducts.map(product =>
        selectedIds.has(product.id) ? { ...product, isActive } : product
      )
    )
    toast({
      title: isActive ? "Ítems activados" : "Ítems desactivados",
      description: `${selectedIds.size} ítem(s) actualizados.`,
    })
    clearSelection()
  }
  const bulkDelete = () => {
    if (selectedIds.size === 0) return
    setLocalFieldProducts(prevProducts =>
      prevProducts.filter(product => !selectedIds.has(product.id))
    )
    toast({ title: "Ítems eliminados", description: `${selectedIds.size} ítem(s) eliminados.` })
    clearSelection()
  }

  // Lógica para determinar el estado de los botones de acciones masivas
  const selectedProducts = fieldProducts.filter((p) => selectedIds.has(p.id))
  const allSelectedActive = selectedProducts.length > 0 && selectedProducts.every((p) => p.isActive)
  const allSelectedInactive = selectedProducts.length > 0 && selectedProducts.every((p) => !p.isActive)
  const hasMixedStates = selectedProducts.length > 0 && !allSelectedActive && !allSelectedInactive

  // Funciones para el modal de edición
  const handleEditFieldInputChange = (field: keyof typeof editFieldData, value: string | boolean) => {
    setEditFieldData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveEditField = () => {
    if (!editFieldData.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" })
      return
    }

    toast({
      title: "Campo actualizado",
      description: `"${editFieldData.name}" fue actualizado exitosamente.`,
    })
    setIsEditModalOpen(false)
  }

  const handleCancelEditField = () => {
    // Restaurar datos originales
    setEditFieldData({
      name: extraField?.name || "",
      type: extraField?.type || "texto",
      defaultValue: extraField?.defaultValue || "",
      description: extraField?.description || "",
      isRequired: extraField?.isRequired || false,
    })
    setIsEditModalOpen(false)
  }

  if (!extraField) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900">Campo no encontrado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-camouflage-green-700">El campo solicitado no existe o fue eliminado.</p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/inventory/extra-fields")}
                  className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                >
                  Volver a Campos Extra
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
        {/* Encabezado: Nombre del campo */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <Layers className="mr-3 h-8 w-8 text-camouflage-green-700" />
              {extraField.name}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="md2"
            onClick={() => router.push("/inventory/extra-fields")}
            className="text-black bg-white hover:text-black border border-gray-700 hover:bg-gray-100"
            title="Volver a Campos Extra"
          >
            <ArrowLeft className="mr-2 h-4 w-4 text-black" />
            Volver
          </Button>
        </div>

        {/* Acciones sobre el campo */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant={isFieldActive ? "primary" : "outline"}
              className={isFieldActive ? "" : "border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"}
              onClick={() => {
                setIsFieldActive(true)
                toast({ title: "Campo activado", description: `"${extraField.name}" está activo.` })
              }}
            >
              Activar
            </Button>
            <Button
              variant={!isFieldActive ? "primary" : "outline"}
              className={!isFieldActive ? "" : "border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"}
              onClick={() => {
                setIsFieldActive(false)
                toast({ title: "Campo desactivado", description: `"${extraField.name}" está inactivo.` })
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
                Eliminar campo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar campo</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará "{extraField.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    toast({ title: "Campo eliminado", description: `"${extraField.name}" fue eliminado.` })
                    router.push("/inventory/extra-fields")
                  }}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Información del campo */}
        <Card className="border-camouflage-green-200">
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Nombre</div>
                <div className="font-medium text-camouflage-green-900">{extraField.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Tipo</div>
                <div className="font-medium text-camouflage-green-900 capitalize">{extraField.type}</div>
              </div>
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Valor por Defecto</div>
                <div className="font-medium text-camouflage-green-900">{extraField.defaultValue || "Sin valor"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Estado</div>
                <div className="font-medium text-camouflage-green-900">{extraField.isRequired ? "Requerido" : "Opcional"}</div>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="text-base text-camouflage-green-600">Descripción</div>
              <div className="font-medium text-camouflage-green-900">{extraField.description}</div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de ítems que usan este campo */}
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
                            <AlertDialogDescription>
                              Se activarán {selectedCount} ítem(s).
                            </AlertDialogDescription>
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
                            <AlertDialogDescription>
                              Se desactivarán {selectedCount} ítem(s).
                            </AlertDialogDescription>
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
                          className="w-full rounded-3xl border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
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
                          className="w-full rounded-3xl border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
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
                          className="w-full rounded-3xl border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
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
                          className="w-full rounded-3xl border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <div className="flex items-center gap-1 py-3">
                        <Select
                          value={filters.stockOperator}
                          onValueChange={(value) => {
                            handleFilterChange("stockOperator", value)
                            if (value !== "between") {
                              handleFilterChange("stockMinValue", "")
                              handleFilterChange("stockMaxValue", "")
                            } else {
                              handleFilterChange("stockValue", "")
                            }
                          }}
                        >
                          <SelectTrigger className="w-24 rounded-3xl border border-camouflage-green-300 bg-white px-3 py-2 text-xs text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500" title="Operador de comparación">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent className="rounded-3xl">
                            <SelectItem value="none">-</SelectItem>
                            <SelectItem value="equal">=</SelectItem>
                            <SelectItem value="greater">&gt;</SelectItem>
                            <SelectItem value="greaterEqual">&gt;=</SelectItem>
                            <SelectItem value="less">&lt;</SelectItem>
                            <SelectItem value="lessEqual">&lt;=</SelectItem>
                            <SelectItem value="between">Rango</SelectItem>
                          </SelectContent>
                        </Select>
                        {filters.stockOperator === "between" ? (
                          <div className="flex flex-1 items-center gap-1">
                            <input
                              type="number"
                              placeholder="Min"
                              value={filters.stockMinValue}
                              onChange={(e) => handleFilterChange("stockMinValue", e.target.value)}
                              className="w-14 rounded-3xl border border-camouflage-green-300 bg-white px-2 py-2 text-xs text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                              min="0"
                            />
                            <span className="text-xs text-camouflage-green-600">y</span>
                            <input
                              type="number"
                              placeholder="Max"
                              value={filters.stockMaxValue}
                              onChange={(e) => handleFilterChange("stockMaxValue", e.target.value)}
                              className="w-14 rounded-3xl border border-camouflage-green-300 bg-white px-2 py-2 text-xs text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                              min="0"
                            />
                          </div>
                        ) : (
                          <input
                            type="number"
                            placeholder="0"
                            value={filters.stockValue}
                            onChange={(e) => handleFilterChange("stockValue", e.target.value)}
                            className="w-16 rounded-3xl border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                            min="0"
                          />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[160px]">
                      <div className="flex items-center gap-1 py-3">
                        <Select
                          value={filters.status}
                          onValueChange={(value) => handleFilterChange("status", value)}
                        >
                          <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white px-4 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500" title="Filtrar por estado">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent className="rounded-3xl">
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Activos</SelectItem>
                            <SelectItem value="inactive">Inactivos</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={clearFilters}
                          size="sm"
                          variant="outline"
                          className="ml-2 h-9 w-14 border-camouflage-green-300 p-0 text-camouflage-green-700 hover:bg-camouflage-green-100"
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
                  <TableHead className="w-[200px] font-semibold text-camouflage-green-700 pl-4">
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
                  <TableHead className="w-[120px] font-semibold text-camouflage-green-700 pl-4">
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
                  <TableHead className="w-[100px] font-semibold text-camouflage-green-700 pl-4">
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
                  <TableHead className="w-[250px] font-semibold text-camouflage-green-700 pl-4">
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
                  <TableHead className="w-[120px] text-center font-semibold text-camouflage-green-700 pl-4">
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
                  <TableHead className="w-[160px] font-semibold text-camouflage-green-700 pl-4">Acciones</TableHead>
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
                      <TableCell className="w-[200px] pl-4">
                        <button
                          onClick={() => router.push(`/inventory/items/${product.id}`)}
                          className="text-left font-medium text-camouflage-green-900 transition-colors hover:text-camouflage-green-700 hover:underline"
                        >
                          {product.name}
                        </button>
                      </TableCell>
                      <TableCell className="w-[120px] pl-4">
                        <div className="font-mono text-sm text-camouflage-green-600">{product.sku}</div>
                      </TableCell>
                      <TableCell className="w-[100px] pl-4">
                        <div className="font-semibold text-camouflage-green-700">${product.price}</div>
                      </TableCell>
                      <TableCell className="w-[250px] pl-4">
                        <div
                          className="max-w-[230px] truncate text-sm text-camouflage-green-600"
                          title={product.description}
                        >
                          {product.description}
                        </div>
                      </TableCell>
                      <TableCell className="w-[120px] pl-4">
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
                      <TableCell className="w-[160px] pl-4">
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
                            onClick={() => setIsProductEditModalOpen(true)}
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
                              setLocalFieldProducts(prevProducts =>
                                prevProducts.map(p =>
                                  p.id === product.id ? { ...p, isActive: !current } : p
                                )
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
                                    setLocalFieldProducts(prevProducts =>
                                      prevProducts.filter(p => p.id !== product.id)
                                    )
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Layers className="h-12 w-12 text-camouflage-green-300" />
                        <div>
                          <p className="font-medium text-camouflage-green-600">
                            No hay ítems que usen este campo
                          </p>
                          <p className="mt-1 text-sm text-camouflage-green-500">
                            Los productos que usen este campo aparecerán aquí.
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

      {/* Modal para editar campo */}
      <Modal isOpen={isEditModalOpen} onClose={handleCancelEditField} title="Editar Campo">
        <div className="space-y-4">
          <div className="space-y-1 pt-2.5">
            <Label htmlFor="edit-field-name" className="font-medium text-camouflage-green-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-field-name"
              type="text"
              placeholder="Ej: Color, Peso, Fecha de Vencimiento..."
              value={editFieldData.name}
              onChange={(e) => handleEditFieldInputChange("name", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-field-type" className="font-medium text-camouflage-green-700">
              Tipo de Campo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={editFieldData.type}
              onValueChange={(value) => handleEditFieldInputChange("type", value)}
            >
              <SelectTrigger className="border-camouflage-green-300 bg-white focus:border-camouflage-green-500 focus:ring-camouflage-green-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="texto">Texto</SelectItem>
                <SelectItem value="número">Número</SelectItem>
                <SelectItem value="número decimal">Número Decimal</SelectItem>
                <SelectItem value="fecha">Fecha</SelectItem>
                <SelectItem value="si/no">Si/No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-field-default" className="font-medium text-camouflage-green-700">
              Valor por Defecto
            </Label>
            {renderDefaultValueInput(
              editFieldData.type,
              editFieldData.defaultValue,
              (value) => handleEditFieldInputChange("defaultValue", value)
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-field-description" className="font-medium text-camouflage-green-700">
              Descripción
            </Label>
            <Textarea
              id="edit-field-description"
              placeholder="Descripción del campo adicional"
              value={editFieldData.description}
              onChange={(e) => handleEditFieldInputChange("description", e.target.value)}
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-field-required"
              checked={editFieldData.isRequired}
              onCheckedChange={(checked) => handleEditFieldInputChange("isRequired", checked as boolean)}
            />
            <Label htmlFor="edit-field-required" className="text-sm font-medium text-camouflage-green-700">
              Campo requerido
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelEditField}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEditField}
              variant="primary"
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para editar producto */}
      <Modal isOpen={isProductEditModalOpen} onClose={() => setIsProductEditModalOpen(false)} title="Editar Producto" size="xl">
        <NewItemForm 
          onClose={() => setIsProductEditModalOpen(false)}
          onSuccess={() => {
            setIsProductEditModalOpen(false)
            toast({
              title: "Producto actualizado",
              description: "El producto fue actualizado exitosamente.",
            })
          }}
        />
      </Modal>
    </MainLayout>
  )
}
