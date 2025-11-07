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
  AlertCircle,
  CheckCircle,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Modal } from "@/components/ui/modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  useCampoExtra,
  useUpdateCampoExtra,
  useActivateCampoExtra,
  useDeactivateCampoExtra,
  useDeleteCampoExtra,
  useCampoExtraProductos,
  mapTipoDatoBackendToFrontend,
} from "@/hooks/api/use-campos-extra"
import { useActivateProducto, useDeactivateProducto, useDeleteProducto } from "@/hooks/api/use-productos"
import { ItemFilters, SortField, SortDirection } from "@/lib/types/items"
import type { ProductosQueryParams, CampoExtraBackend } from "@/lib/api/types"
import { mapFiltersToQueryParams } from "@/lib/api/utils"
import { EditExtraFieldModal } from "@/components/modals/EditExtraFieldModal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ExtraFieldDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { data: extraField, isLoading: isLoadingExtraField, error: extraFieldError } = useCampoExtra(id)
  const updateMutation = useUpdateCampoExtra()
  const activateMutation = useActivateCampoExtra()
  const deactivateMutation = useDeactivateCampoExtra()
  const deleteMutation = useDeleteCampoExtra()

  // Mutations para productos
  const activateProductoMutation = useActivateProducto()
  const deactivateProductoMutation = useDeactivateProducto()
  const deleteProductoMutation = useDeleteProducto()

  // Estado para paginación y filtros
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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Estado para errores de regla de negocio
  const [businessError, setBusinessError] = useState<{ title: string; message: string } | null>(null)

  // Estado para toast de error personalizado
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Estado para toast de éxito personalizado
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Construir parámetros para la API de productos del campo extra usando la función de mapeo
  const productosParams = useMemo<ProductosQueryParams>(() => {
    return mapFiltersToQueryParams(
      filters,
      { page: currentPage, pageSize: itemsPerPage },
      sortField ? { field: sortField, direction: sortDirection } : undefined,
    )
  }, [currentPage, itemsPerPage, filters, sortField, sortDirection])

  // Obtener productos del campo extra usando el endpoint específico
  const { data: productosData, isLoading: isLoadingProductos } = useCampoExtraProductos(id, productosParams)

  const extraFieldProducts = productosData?.items || []

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

  // Lógica para determinar el estado de los botones de acciones masivas
  const selectedProducts = extraFieldProducts.filter((p) => selectedIds.has(p.id))
  const allSelectedActive = selectedProducts.length > 0 && selectedProducts.every((p) => p.isActive ?? true)
  const allSelectedInactive = selectedProducts.length > 0 && selectedProducts.every((p) => !(p.isActive ?? true))

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    clearSelection()
    setCurrentPage(1)
  }

  const handleFilterChange = (field: keyof ItemFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setCurrentPage(1)
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
    clearSelection()
  }

  const totalItems = productosData?.totalCount || 0
  const totalPages = productosData?.totalPages || 0
  const currentProducts = extraFieldProducts // Products already paginated and filtered by backend

  // Lógica para selección de productos en la página actual
  const allCurrentSelected = currentProducts.length > 0 && currentProducts.every((p) => selectedIds.has(p.id))
  const toggleSelectAllCurrent = () => {
    if (allCurrentSelected) {
      // Deseleccionar todos los productos de la página actual
    setSelectedIds((prev) => {
      const next = new Set(prev)
        currentProducts.forEach((p) => next.delete(p.id))
        return next
      })
      } else {
      // Seleccionar todos los productos de la página actual
      setSelectedIds((prev) => {
        const next = new Set(prev)
        currentProducts.forEach((p) => next.add(p.id))
      return next
    })
    }
  }

  // Acciones masivas
  const bulkSetActive = async (isActive: boolean) => {
    if (selectedIds.size === 0) return

    const promises = Array.from(selectedIds).map((id) => {
      return isActive ? activateProductoMutation.mutateAsync(id) : deactivateProductoMutation.mutateAsync(id)
    })

    try {
      await Promise.all(promises)
    clearSelection()
    } catch (error) {
      // Los errores ya se manejan en los hooks
  }
  }

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return

    const promises = Array.from(selectedIds).map((id) => deleteProductoMutation.mutateAsync(id))

    try {
      await Promise.all(promises)
    clearSelection()
      setSuccessMessage(`${selectedIds.size} item(s) eliminado(s) exitosamente.`)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  }

  // Funciones para el modal de edición
  const handleEditField = (field: CampoExtraBackend | undefined) => {
    if (!field) return
    setIsEditModalOpen(true)
  }

  const handleSaveEditField = async (data: { nombre: string; tipoDato: string; descripcion: string | null; valorPorDefecto: string | null; esRequerido: boolean }) => {
    if (!extraField) return

    try {
      const updateData = {
        nombre: data.nombre,
        tipoDato: data.tipoDato,
        descripcion: data.descripcion,
        valorPorDefecto: data.valorPorDefecto,
        esRequerido: data.esRequerido,
      }

      await updateMutation.mutateAsync({ id: extraField.id, data: updateData })
    setIsEditModalOpen(false)
      setSuccessMessage("Campo actualizado exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  }

  const handleCancelEditField = () => {
    setIsEditModalOpen(false)
  }

  const handleActivate = async () => {
    if (!extraField) return
    try {
      await activateMutation.mutateAsync(extraField.id)
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  }

  const handleDeactivate = async () => {
    if (!extraField) return
    try {
      await deactivateMutation.mutateAsync(extraField.id)
    } catch (error: any) {
      // Detectar error específico de campo requerido con productos asociados
      const errorMsg = error?.message || ""
      if (errorMsg.includes("productos") || errorMsg.includes("producto")) {
        // Extraer el número de productos del mensaje si está disponible
        const productCountMatch = errorMsg.match(/(\d+)\s*producto/i)
        const productCount = productCountMatch ? productCountMatch[1] : ""
        
        // Crear mensaje más corto y claro
        let shortMessage = `No se puede desactivar el campo requerido "${extraField.nombre}"`
        if (productCount) {
          shortMessage += ` porque está asignado a ${productCount} producto(s).`
        } else {
          shortMessage += ` porque tiene productos asociados.`
        }
        shortMessage += ` Para desactivarlo: 1) Cambia "EsRequerido" a false, o 2) Elimina el campo de todos los productos.`
        
        setBusinessError({
          title: "No se puede desactivar el campo requerido",
          message: shortMessage,
        })
        // También mostrar toast
        setErrorMessage(shortMessage)
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 8000)
      }
      // Los demás errores se manejan en los hooks
    }
  }

  const handleDeleteField = async () => {
    if (!extraField) return
    try {
      await deleteMutation.mutateAsync(extraField.id)
      setSuccessMessage("Campo eliminado exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 2000)
      setTimeout(() => {
        router.push("/inventory/extra-fields")
      }, 2000)
    } catch (error: any) {
      // Detectar error específico de regla de negocio
      if (error?.message && error.message.includes("productos")) {
        setErrorMessage(error.message)
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 5000)
      }
      // Los demás errores se manejan en los hooks
    }
  }

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    clearSelection()
  }

  // Manejar cambio de items por página
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    clearSelection()
  }

  if (isLoadingExtraField) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-camouflage-green-300 border-t-camouflage-green-600"></div>
            <p className="text-sm text-camouflage-green-600">Cargando campo...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (extraFieldError || !extraField) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Layers className="h-16 w-16 text-camouflage-green-300" />
          <h2 className="mt-4 text-xl font-semibold text-camouflage-green-900">Campo no encontrado</h2>
          <p className="mt-2 text-camouflage-green-600">El campo solicitado no existe o fue eliminado.</p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/inventory/extra-fields")}
            className="mt-4 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                >
                  Volver a Campos Extra
                </Button>
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
              {extraField.nombre}
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

        {/* Tarjeta de error de regla de negocio */}
        {businessError && (
          <Alert variant="destructive" className="relative border-red-300 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <AlertTitle className="text-red-900 font-semibold">{businessError.title}</AlertTitle>
              <AlertDescription className="text-red-800 mt-2">
                {businessError.message}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBusinessError(null)}
              className="absolute right-2 top-2 h-6 w-6 p-0 text-red-600 hover:bg-red-100 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        {/* Acciones sobre el campo */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant={extraField.activo ? "outline" : "primary"}
              className={extraField.activo ? "border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50" : ""}
              onClick={handleActivate}
              disabled={activateMutation.isPending || deactivateMutation.isPending || extraField.activo}
            >
              Activar
            </Button>
            <Button
              variant={!extraField.activo ? "outline" : "primary"}
              className={!extraField.activo ? "border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50" : ""}
              onClick={handleDeactivate}
              disabled={activateMutation.isPending || deactivateMutation.isPending || !extraField.activo}
            >
              Desactivar
            </Button>
          </div>
          <Button
            variant="outline"
            className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            onClick={() => handleEditField(extraField)}
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
                  Esta acción no se puede deshacer. Se eliminará "{extraField.nombre}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteField}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
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
                <div className="font-medium text-camouflage-green-900">{extraField.nombre}</div>
              </div>
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Tipo</div>
                <div className="font-medium text-camouflage-green-900 capitalize">{mapTipoDatoBackendToFrontend(extraField.tipoDato)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Valor por Defecto</div>
                <div className="font-medium text-camouflage-green-900">{extraField.valorPorDefecto || "Sin valor"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-base text-camouflage-green-600">Estado</div>
                <div className="font-medium text-camouflage-green-900">
                  {extraField.activo ? "Activo" : "Inactivo"} {extraField.esRequerido ? "• Requerido" : "• Opcional"}
              </div>
            </div>
            </div>
            {extraField.descripcion && (
            <div className="mt-4 space-y-1">
              <div className="text-base text-camouflage-green-600">Descripción</div>
                <div className="font-medium text-camouflage-green-900">{extraField.descripcion}</div>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla de ítems asociados al campo extra */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">
                {isLoadingProductos ? (
                  "Cargando productos..."
                ) : (
                  `Items Asociados (${totalItems.toLocaleString()})`
                )}
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
                      onClick={clearSelection}
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
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {/* Fila de filtros */}
                {showFilters && (
                  <TableRow className="animate-in slide-in-from-top-2 border-camouflage-green-200 bg-camouflage-green-50/30 duration-300 hover:bg-transparent">
                    <TableHead className="w-[40px]">
                      <div className="pl-3">{/* Columna vacía para alinear con checkbox */}</div>
                    </TableHead>
                    <TableHead className="w-[220px] pl-0">
                      <div className="py-3">
                        <input
                          type="text"
                          placeholder="Nombre"
                          value={filters.name}
                          onChange={(e) => handleFilterChange("name", e.target.value)}
                          className="w-full rounded-3xl border border-camouflage-green-300 bg-white px-2 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[140px] pl-0">
                      <div className="py-3">
                        <input
                          type="text"
                          placeholder="Código SKU"
                          value={filters.sku}
                          onChange={(e) => handleFilterChange("sku", e.target.value)}
                          className="w-full rounded-3xl border border-camouflage-green-300 bg-white px-2 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[160px] pl-0">
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
                    <TableHead className="w-[240px] pl-0">
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
                    <TableHead className="w-[140px] pl-0">
                      <div className="flex items-center justify-start gap-1 py-3">
                        <Select
                          value={filters.stockOperator}
                          onValueChange={(value) => {
                            handleFilterChange("stockOperator", value)
                            // Limpiar valores cuando se cambia el operador
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
                    <TableHead className="w-[180px] pl-0">
                      <div className="py-3">
                        <input
                          type="text"
                          placeholder="Valor Campo"
                          value=""
                          disabled
                          className="w-full rounded-3xl border border-camouflage-green-300 bg-gray-100 px-3 py-2 text-sm text-camouflage-green-500 placeholder-camouflage-green-400 cursor-not-allowed"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[180px] pl-0">
                      <div className="flex items-center gap-1 py-3">
                        <Select
                          value={filters.status || "all"}
                          onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
                        >
                          <SelectTrigger className="w-28 rounded-3xl border border-camouflage-green-300 bg-white px-2 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500" title="Filtrar por estado">
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
                  <TableHead className="w-[40px]">
                    <div className="pl-3">
                      <Checkbox
                        checked={allCurrentSelected}
                        onCheckedChange={toggleSelectAllCurrent}
                        aria-label="Seleccionar todos"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[220px] font-semibold text-camouflage-green-700 pl-4">
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
                  <TableHead className="w-[140px] font-semibold text-camouflage-green-700 pl-4">
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
                  <TableHead className="w-[160px] font-semibold text-camouflage-green-700 pl-4">
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
                  <TableHead className="w-[240px] font-semibold text-camouflage-green-700 pl-4">
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
                  <TableHead className="w-[140px] font-semibold text-camouflage-green-700 pl-4">
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
                  <TableHead className="w-[180px] font-semibold text-camouflage-green-700 pl-4">Valor Campo</TableHead>
                  <TableHead className="w-[180px] font-semibold text-camouflage-green-700 pl-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingProductos ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-camouflage-green-300 border-t-camouflage-green-600"></div>
                        <p className="text-sm text-camouflage-green-600">Cargando productos...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentProducts.length > 0 ? (
                  currentProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
                    >
                      <TableCell className="w-[40px]">
                        <div className="pl-3">
                          <Checkbox
                            checked={isSelected(product.id)}
                            onCheckedChange={() => toggleSelect(product.id)}
                            aria-label={`Seleccionar ${product.name}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="w-[220px] pl-4">
                        <button
                          onClick={() => router.push(`/inventory/items/${product.id}`)}
                          className="text-left font-medium text-camouflage-green-900 transition-colors hover:text-camouflage-green-700 hover:underline"
                        >
                          {product.name}
                        </button>
                      </TableCell>
                      <TableCell className="w-[140px] pl-4">
                        <div className="font-mono text-sm text-camouflage-green-600">{product.sku}</div>
                      </TableCell>
                      <TableCell className="w-[160px] pl-4">
                        <div className="font-semibold text-camouflage-green-700 whitespace-nowrap">
                          {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(product.price)}
                        </div>
                      </TableCell>
                      <TableCell className="w-[240px] pl-4">
                        <div
                          className="max-w-[220px] truncate text-sm text-camouflage-green-600"
                          title={product.description}
                        >
                          {product.description || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="w-[140px] pl-4">
                        <div className="text-left">
                          <span
                            className={`min-w-[50px] rounded-full px-4 py-2 text-left text-sm font-semibold ${
                              product.stock > (product.minStock || 0)
                                ? "bg-camouflage-green-100 text-camouflage-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.stock}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[180px] pl-4">
                        <div className="text-sm text-camouflage-green-700">
                          {(product as any).valorCampoExtra || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="w-[180px] pl-4">
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
                              if (product.isActive ?? true) {
                                deactivateProductoMutation.mutate(product.id)
                              } else {
                                activateProductoMutation.mutate(product.id)
                              }
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
                                    deleteProductoMutation.mutate(product.id, {
                                      onSuccess: () => {
                                        setSuccessMessage("Item eliminado exitosamente.")
                                        setShowSuccessToast(true)
                                        setTimeout(() => setShowSuccessToast(false), 5000)
                                      },
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
                    <TableCell colSpan={9} className="py-12 text-center">
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
          {totalPages > 0 && (
          <PaginationControls
            pagination={{ currentPage, itemsPerPage, totalItems, totalPages }}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
          />
          )}
        </Card>
      </div>

      {/* Modal para editar campo */}
      {extraField && (
        <EditExtraFieldModal
          isOpen={isEditModalOpen}
          onClose={handleCancelEditField}
          field={{
            id: extraField.id,
            name: extraField.nombre,
            type: extraField.tipoDato,
            description: extraField.descripcion || "",
            defaultValue: extraField.valorPorDefecto || "",
            isRequired: extraField.esRequerido,
          }}
          onSave={handleSaveEditField}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Toast de error personalizado */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300 max-w-md">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800 flex-1">
              {errorMessage || "No se puede eliminar el campo porque está siendo usado en productos."}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowErrorToast(false)}
              className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 hover:text-red-800 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Toast de éxito personalizado */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              {successMessage || "Operación completada exitosamente."}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuccessToast(false)}
              className="h-6 w-6 p-0 text-green-600 hover:bg-green-100 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </MainLayout>
  )
}