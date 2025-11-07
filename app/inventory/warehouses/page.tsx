"use client"

import {
  Warehouse,
  Plus,
  MapPin,
  Eye,
  Edit,
  Power,
  PowerOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Search,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState, useEffect, useRef } from "react"

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
import { EditWarehouseModal } from "@/components/modals/EditWarehouseModal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import { useToast } from "@/hooks/use-toast"
import {
  useBodegas,
  useCreateBodega,
  useUpdateBodega,
  useActivateBodega,
  useDeactivateBodega,
  useDeleteBodega,
} from "@/hooks/api/use-bodegas"
import type { BodegaBackend, CreateBodegaDto, UpdateBodegaDto } from "@/lib/api/types"
import { PaginationConfig } from "@/lib/types/inventory-value"

export default function Warehouses() {
  const router = useRouter()
  const { toast } = useToast()

  // Estado para búsqueda - separar el valor del input del término de búsqueda
  const [inputValue, setInputValue] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  // Ref para mantener el foco en el input de búsqueda
  const searchInputRef = useRef<HTMLInputElement>(null)
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  // Estado para ordenamiento
  const [sortField, setSortField] = useState<"nombre" | "direccion" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Estado para el modal de nueva bodega
  const [isNewWarehouseModalOpen, setIsNewWarehouseModalOpen] = useState(false)
  const [newWarehouseData, setNewWarehouseData] = useState<CreateBodegaDto>({
    nombre: "",
    direccion: null,
    descripcion: null,
  })

  // Estado para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<BodegaBackend | null>(null)

  // Estado para selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedCount = selectedIds.size

  // Estado para toast de error personalizado
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Estado para toast de éxito personalizado
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")


  // Construir parámetros para la API
  const apiParams = useMemo(() => {
    const params: {
      page: number
      pageSize: number
      nombre?: string
      orderBy?: string
      orderDesc?: boolean
    } = {
      page: currentPage,
      pageSize: itemsPerPage,
    }

    if (searchTerm.trim()) {
      params.nombre = searchTerm.trim()
    }

    if (sortField) {
      params.orderBy = sortField === "nombre" ? "nombre" : "direccion"
      params.orderDesc = sortDirection === "desc"
    }

    return params
  }, [currentPage, itemsPerPage, searchTerm, sortField, sortDirection])

  // Obtener bodegas del backend
  const { data: bodegasData, isLoading, error } = useBodegas(apiParams)

  // Mutaciones
  const createMutation = useCreateBodega()
  const updateMutation = useUpdateBodega()
  const activateMutation = useActivateBodega()
  const deactivateMutation = useDeactivateBodega()
  const deleteMutation = useDeleteBodega()

  // Datos procesados
  const warehouses = bodegasData?.items || []
  const pagination: PaginationConfig = useMemo(() => {
    if (!bodegasData) {
      return {
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 0,
      }
    }
    return {
      currentPage: bodegasData.page,
      itemsPerPage: bodegasData.pageSize,
      totalItems: bodegasData.totalCount,
      totalPages: bodegasData.totalPages,
    }
  }, [bodegasData])

  // Funciones de selección
  const isSelected = (id: string) => selectedIds.has(id)
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())

  // Lógica para determinar el estado de los botones de acciones masivas
  const selectedWarehouses = warehouses.filter((w) => selectedIds.has(w.id))
  const allSelectedActive = selectedWarehouses.length > 0 && selectedWarehouses.every((w) => w.activo)
  const allSelectedInactive = selectedWarehouses.length > 0 && selectedWarehouses.every((w) => !w.activo)

  // Manejar ordenamiento
  const handleSort = (field: "nombre" | "direccion") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    clearSelection()
    setCurrentPage(1) // Reset a la primera página al cambiar ordenamiento
  }

  // Acciones masivas
  const bulkSetActive = async (isActive: boolean) => {
    if (selectedIds.size === 0) return

    const promises = Array.from(selectedIds).map((id) => {
      return isActive ? activateMutation.mutateAsync(id) : deactivateMutation.mutateAsync(id)
    })

    try {
      await Promise.all(promises)
    clearSelection()
    } catch (error: any) {
      // Detectar error específico de regla de negocio solo al desactivar
      if (!isActive && error?.message && error.message.includes("productos asignados")) {
        setErrorMessage(error.message)
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 5000)
      }
      // Los demás errores se manejan en los hooks
    }
  }

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return

    const promises = Array.from(selectedIds).map((id) => deleteMutation.mutateAsync(id))

    try {
      await Promise.all(promises)
    clearSelection()
      setSuccessMessage(`${selectedIds.size} bodega(s) eliminada(s) exitosamente.`)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error: any) {
      // Detectar error específico de regla de negocio para eliminación
      if (error?.message && error.message.includes("productos asignados")) {
        setErrorMessage(error.message)
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 5000)
      }
      // Los demás errores se manejan en los hooks
    }
  }

  // Función para cambiar estado de una bodega
  const toggleWarehouseStatus = async (id: string) => {
    const warehouse = warehouses.find((w) => w.id === id)
    if (!warehouse) return

    try {
      if (warehouse.activo) {
        // Solo desactivar - aquí puede ocurrir el error de productos asignados
        await deactivateMutation.mutateAsync(id)
      } else {
        // Solo activar - no debería mostrar error de productos asignados
        await activateMutation.mutateAsync(id)
      }
    } catch (error: any) {
      // Detectar error específico de regla de negocio solo al desactivar
      if (warehouse.activo && error?.message && error.message.includes("productos asignados")) {
        setErrorMessage(error.message)
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 5000)
      }
      // Los demás errores se manejan en los hooks
    }
  }

  // Función para eliminar una bodega
  const deleteWarehouse = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setSuccessMessage("Bodega eliminada exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error: any) {
      // Detectar error específico de regla de negocio para eliminación
      if (error?.message && error.message.includes("productos asignados")) {
        setErrorMessage(error.message)
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 5000)
      }
      // Los demás errores se manejan en los hooks
    }
  }

  // Funciones para el modal de nueva bodega
  const handleNewWarehouseInputChange = (field: keyof CreateBodegaDto, value: string | null) => {
    setNewWarehouseData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveNewWarehouse = async () => {
    if (!newWarehouseData.nombre.trim()) {
      toast({
        title: "Campo obligatorio",
        description: "El nombre de la bodega es obligatorio.",
        variant: "destructive",
      })
      return
    }

    try {
      await createMutation.mutateAsync(newWarehouseData)
      setNewWarehouseData({ nombre: "", direccion: null, descripcion: null })
    setIsNewWarehouseModalOpen(false)
      setSuccessMessage("Bodega creada exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  }

  const handleCancelNewWarehouse = () => {
    setNewWarehouseData({ nombre: "", direccion: null, descripcion: null })
    setIsNewWarehouseModalOpen(false)
  }

  // Funciones para el modal de edición
  const handleEditWarehouse = (warehouse: BodegaBackend) => {
    setEditingWarehouse(warehouse)
    setIsEditModalOpen(true)
  }

  const handleSaveEditWarehouse = async (data: { name: string; location: string; observations: string }) => {
    if (!editingWarehouse) return

    const updateData: UpdateBodegaDto = {
      nombre: data.name,
      direccion: data.location || null,
      descripcion: data.observations || null,
    }

    try {
      await updateMutation.mutateAsync({ id: editingWarehouse.id, data: updateData })
    setIsEditModalOpen(false)
    setEditingWarehouse(null)
      setSuccessMessage("Bodega actualizada exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  }

  const handleCancelEditWarehouse = () => {
    setIsEditModalOpen(false)
    setEditingWarehouse(null)
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

  // Debounce para la búsqueda - actualizar searchTerm después de que el usuario deje de escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      // Verificar si el input tiene el foco antes de actualizar
      const hadFocus = document.activeElement === searchInputRef.current
      const cursorPosition = searchInputRef.current?.selectionStart || 0
      
      setSearchTerm(inputValue)
      setCurrentPage(1)
      clearSelection()
      
      // Restaurar el foco y la posición del cursor si lo tenía antes del re-render
      if (hadFocus && searchInputRef.current) {
        // Usar requestAnimationFrame para asegurar que el foco se restaure después del re-render
        requestAnimationFrame(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus()
            // Restaurar la posición del cursor
            searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition)
          }
        })
      }
    }, 500) // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer)
  }, [inputValue])

  // Manejar cambio en el input de búsqueda
  const handleSearchChange = (value: string) => {
    setInputValue(value)
  }

  const isLoadingData =
    isLoading ||
    createMutation.isPending ||
    updateMutation.isPending ||
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    deleteMutation.isPending

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <Warehouse className="mr-3 h-8 w-8 text-camouflage-green-700" />
              Bodegas
            </h1>
            <p className="mt-1 text-camouflage-green-600">
              Gestiona tu inventario en diferentes lugares de almacenamiento y distribución.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Barra de búsqueda compacta */}
            <div className="flex h-10 items-center gap-2 rounded-lg border border-camouflage-green-300 bg-white px-3 shadow-sm min-w-[280px] max-w-[280px]">
              <Search className="h-4 w-4 shrink-0 text-camouflage-green-600" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar por nombre..."
                value={inputValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-full flex-1 min-w-0 border-0 bg-transparent text-sm placeholder:text-gray-400 focus:outline-none focus:ring-0"
                disabled={isLoadingData}
              />
              {inputValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setInputValue("")
                    setSearchTerm("")
                    setCurrentPage(1)
                    clearSelection()
                  }}
                  className="h-4 w-4 shrink-0 p-0 text-camouflage-green-600 hover:bg-transparent hover:text-camouflage-green-800"
                  disabled={isLoadingData}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button
              size="md2"
              variant="primary"
              className="pl-4 pr-4"
              onClick={() => setIsNewWarehouseModalOpen(true)}
              disabled={isLoadingData}
            >
              <Plus className="mr-2 h-4 w-4" />
            Nueva Bodega
          </Button>
          </div>
        </div>

        {/* Tabla de Bodegas */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">
                {isLoading ? (
                  "Cargando bodegas..."
                ) : (
                  <>
                    Bodegas Registradas ({pagination.totalItems.toLocaleString()})
                    {searchTerm && warehouses.length !== pagination.totalItems && (
                  <span className="ml-2 text-sm font-normal text-camouflage-green-600">
                        de {pagination.totalItems.toLocaleString()} total
                  </span>
                    )}
                  </>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-camouflage-green-200 bg-camouflage-green-50/60 px-2 py-1 text-sm text-camouflage-green-800">
                    <span>{selectedCount} seleccionado(s)</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 text-camouflage-green-600 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                      onClick={clearSelection}
                      disabled={isLoadingData}
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
                            disabled={allSelectedActive || isLoadingData}
                          >
                            Activar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Activar bodegas seleccionadas</AlertDialogTitle>
                            <AlertDialogDescription>Se activarán {selectedCount} bodega(s).</AlertDialogDescription>
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
                            disabled={allSelectedInactive || isLoadingData}
                          >
                            Desactivar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Desactivar bodegas seleccionadas</AlertDialogTitle>
                            <AlertDialogDescription>Se desactivarán {selectedCount} bodega(s).</AlertDialogDescription>
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
                            disabled={isLoadingData}
                          >
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar bodegas seleccionadas</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminarán {selectedCount} bodega(s).
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-camouflage-green-300 border-t-camouflage-green-600"></div>
                  <p className="text-sm text-camouflage-green-600">Cargando bodegas...</p>
                </div>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">
                <p>Error al cargar las bodegas. Por favor, intenta nuevamente.</p>
              </div>
            ) : (
              <>
            <Table>
              <TableHeader>
                <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                  <TableHead className="w-[36px]">
                    <div className="pl-3">
                      <Checkbox
                            checked={selectedCount === warehouses.length && warehouses.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                                setSelectedIds(new Set(warehouses.map((w) => w.id)))
                          } else {
                                clearSelection()
                          }
                        }}
                        aria-label="Seleccionar todos"
                            disabled={isLoadingData}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[200px] font-semibold text-camouflage-green-700">
                    <div>
                      <button
                            onClick={() => handleSort("nombre")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                            disabled={isLoadingData}
                      >
                        Nombre
                        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronUp
                                className={`h-3 w-3 ${sortField === "nombre" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                          />
                          <ChevronDown
                                className={`h-3 w-3 ${sortField === "nombre" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                          />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[300px] font-semibold text-camouflage-green-700">
                    <div>
                      <button
                            onClick={() => handleSort("direccion")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                            disabled={isLoadingData}
                      >
                        Dirección
                        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronUp
                                className={`h-3 w-3 ${sortField === "direccion" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                          />
                          <ChevronDown
                                className={`h-3 w-3 ${sortField === "direccion" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                          />
              </div>
                      </button>
              </div>
                  </TableHead>
                  <TableHead className="w-[300px] font-semibold text-camouflage-green-700">Observaciones</TableHead>
                  <TableHead className="w-[160px] font-semibold text-camouflage-green-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {warehouses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-camouflage-green-600">
                          {searchTerm
                            ? "No se encontraron bodegas que coincidan con la búsqueda."
                            : "No hay bodegas registradas."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      warehouses.map((warehouse) => (
                  <TableRow
                    key={warehouse.id}
                    className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
                  >
                    <TableCell className="w-[36px]">
                      <div className="pl-3">
                        <Checkbox
                          checked={isSelected(warehouse.id)}
                                onCheckedChange={() => toggleSelect(warehouse.id)}
                                aria-label={`Seleccionar ${warehouse.nombre}`}
                                disabled={isLoadingData}
                        />
              </div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <button
                        onClick={() => router.push(`/inventory/warehouses/${warehouse.id}`)}
                        className="text-left font-medium text-camouflage-green-900 transition-colors hover:text-camouflage-green-700 hover:underline"
                              disabled={isLoadingData}
                      >
                              {warehouse.nombre}
                      </button>
                    </TableCell>
                    <TableCell className="w-[300px]">
                            <div className="text-sm text-camouflage-green-600">{warehouse.direccion || "-"}</div>
                    </TableCell>
                    <TableCell className="w-[300px]">
                      <div
                        className="max-w-[280px] truncate text-sm text-camouflage-green-600"
                              title={warehouse.descripcion || ""}
                      >
                              {warehouse.descripcion || "-"}
              </div>
                    </TableCell>
                    <TableCell className="w-[160px]">
                      <div className="flex items-center justify-start gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                          title="Ver detalles"
                          onClick={() => router.push(`/inventory/warehouses/${warehouse.id}`)}
                                disabled={isLoadingData}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                          title="Editar"
                          onClick={() => handleEditWarehouse(warehouse)}
                                disabled={isLoadingData}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                                title={warehouse.activo ? "Desactivar" : "Activar"}
                          onClick={() => toggleWarehouseStatus(warehouse.id)}
                                disabled={isLoadingData}
                        >
                                {warehouse.activo ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                              title="Eliminar"
                                    disabled={isLoadingData}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar bodega</AlertDialogTitle>
                              <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará "{warehouse.nombre}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                      onClick={() => deleteWarehouse(warehouse.id)}
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
                    )}
              </TableBody>
            </Table>
                {/* Paginación */}
                {pagination.totalPages > 0 && (
                  <PaginationControls
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                )}
              </>
            )}
            </CardContent>
          </Card>

      {/* Modal para nueva bodega */}
      <Modal isOpen={isNewWarehouseModalOpen} onClose={handleCancelNewWarehouse} title="Nueva Bodega" size="lg">
        <div className="space-y-4">
          <div className="space-y-1 pt-2.5">
            <Label htmlFor="warehouse-name" className="font-medium text-camouflage-green-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="warehouse-name"
              type="text"
              placeholder="Ingresa el nombre de la bodega"
                value={newWarehouseData.nombre}
                onChange={(e) => handleNewWarehouseInputChange("nombre", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                disabled={createMutation.isPending}
            />
                </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse-location" className="font-medium text-camouflage-green-700">
              Dirección
            </Label>
            <Input
              id="warehouse-location"
              type="text"
              placeholder="Ingresa la dirección de la bodega"
                value={newWarehouseData.direccion || ""}
                onChange={(e) => handleNewWarehouseInputChange("direccion", e.target.value || null)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                disabled={createMutation.isPending}
            />
                </div>

                <div className="space-y-2">
            <Label htmlFor="warehouse-observations" className="font-medium text-camouflage-green-700">
              Observaciones
            </Label>
            <Textarea
              id="warehouse-observations"
              placeholder="Ingresa observaciones adicionales sobre la bodega"
                value={newWarehouseData.descripcion || ""}
                onChange={(e) => handleNewWarehouseInputChange("descripcion", e.target.value || null)}
              className="scrollbar-thin scrollbar-thumb-camouflage-green-300 scrollbar-track-gray-100 min-h-[80px] resize-none border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              style={{
                outline: "none",
                boxShadow: "none",
              }}
              onFocus={(e) => {
                e.target.style.outline = "none"
                e.target.style.boxShadow = "none"
              }}
                disabled={createMutation.isPending}
                    />
                  </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelNewWarehouse}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
              <Button onClick={handleSaveNewWarehouse} variant="primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
                  </div>
        </div>
      </Modal>

      {/* Modal para editar bodega */}
      {editingWarehouse && (
        <EditWarehouseModal
          isOpen={isEditModalOpen}
          onClose={handleCancelEditWarehouse}
            warehouse={{
              id: editingWarehouse.id,
              name: editingWarehouse.nombre,
              location: editingWarehouse.direccion || "",
              observations: editingWarehouse.descripcion || "",
            }}
          onSave={handleSaveEditWarehouse}
            isLoading={updateMutation.isPending}
          />
        )}
      </div>

      {/* Toast de error personalizado */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              {errorMessage || "No se puede desactivar la bodega porque tiene productos asignados."}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowErrorToast(false)}
              className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 hover:text-red-800"
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
          </div>
        </div>
      )}
    </MainLayout>
  )
}
