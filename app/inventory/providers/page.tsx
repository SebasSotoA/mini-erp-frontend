"use client"

import {
  Building2,
  Plus,
  Mail,
  Edit,
  Power,
  PowerOff,
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
import { EditProviderModal } from "@/components/modals/EditProviderModal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import { useToast } from "@/hooks/use-toast"
import {
  useProveedores,
  useCreateProveedor,
  useUpdateProveedor,
  useActivateProveedor,
  useDeactivateProveedor,
} from "@/hooks/api/use-proveedores"
import type { ProveedorBackend, CreateProveedorDto, UpdateProveedorDto } from "@/lib/api/types"
import { PaginationConfig } from "@/lib/types/inventory-value"

export default function Providers() {
  const router = useRouter()
  const { toast } = useToast()

  // Estado para búsqueda - separar el valor del input del término de búsqueda
  const [inputValue, setInputValue] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  // Ref para mantener el foco en el input de búsqueda
  const searchInputRef = useRef<HTMLInputElement>(null)
  // Estado para paginación (frontend)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  // Estado para filtro de estado
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  // Estado para ordenamiento
  const [sortField, setSortField] = useState<"nombre" | "identificacion" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Estado para el modal de nuevo proveedor
  const [isNewProviderModalOpen, setIsNewProviderModalOpen] = useState(false)
  const [newProviderData, setNewProviderData] = useState<CreateProveedorDto>({
    nombre: "",
    identificacion: "",
    correo: null,
    observaciones: null,
  })

  // Estado para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ProveedorBackend | null>(null)

  // Estado para selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedCount = selectedIds.size

  // Estado para toast de error personalizado
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Estado para toast de éxito personalizado
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Obtener proveedores del backend (sin filtros, luego filtramos en frontend)
  const { data: allProviders = [], isLoading, error } = useProveedores()

  // Mutaciones
  const createMutation = useCreateProveedor()
  const updateMutation = useUpdateProveedor()
  const activateMutation = useActivateProveedor()
  const deactivateMutation = useDeactivateProveedor()

  // Filtrar y ordenar proveedores en el frontend
  const filteredProviders = useMemo(() => {
    let filtered = [...allProviders]

    // Filtrar por búsqueda (nombre o identificación)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchLower) ||
          p.identificacion.toLowerCase().includes(searchLower),
      )
    }

    // Filtrar por estado
    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.activo)
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((p) => !p.activo)
    }

    // Ordenar
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue = ""
        let bValue = ""

        if (sortField === "nombre") {
          aValue = a.nombre.toLowerCase()
          bValue = b.nombre.toLowerCase()
        } else if (sortField === "identificacion") {
          aValue = a.identificacion.toLowerCase()
          bValue = b.identificacion.toLowerCase()
        }

        const comparison = aValue.localeCompare(bValue)
        return sortDirection === "asc" ? comparison : -comparison
      })
    }

    return filtered
  }, [allProviders, searchTerm, statusFilter, sortField, sortDirection])

  // Paginación frontend
  const paginatedProviders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProviders.slice(startIndex, endIndex)
  }, [filteredProviders, currentPage, itemsPerPage])

  const pagination: PaginationConfig = useMemo(() => {
    const totalItems = filteredProviders.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
    }
  }, [filteredProviders.length, currentPage, itemsPerPage])

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
  const selectedProviders = filteredProviders.filter((p) => selectedIds.has(p.id))
  const allSelectedActive = selectedProviders.length > 0 && selectedProviders.every((p) => p.activo)
  const allSelectedInactive = selectedProviders.length > 0 && selectedProviders.every((p) => !p.activo)

  // Manejar ordenamiento
  const handleSort = (field: "nombre" | "identificacion") => {
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
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  }

  // Función para cambiar estado de un proveedor
  const toggleProviderStatus = async (id: string) => {
    const provider = allProviders.find((p) => p.id === id)
    if (!provider) return

    try {
      if (provider.activo) {
        await deactivateMutation.mutateAsync(id)
      } else {
        await activateMutation.mutateAsync(id)
      }
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  }

  // Funciones para el modal de nuevo proveedor
  const handleNewProviderInputChange = (field: keyof CreateProveedorDto, value: string | null) => {
    setNewProviderData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveNewProvider = async () => {
    if (!newProviderData.nombre.trim()) {
      toast({
        title: "Campo obligatorio",
        description: "El nombre del proveedor es obligatorio.",
        variant: "destructive",
      })
      return
    }

    if (!newProviderData.identificacion.trim()) {
      toast({
        title: "Campo obligatorio",
        description: "La identificación del proveedor es obligatoria.",
        variant: "destructive",
      })
      return
    }

    try {
      await createMutation.mutateAsync(newProviderData)
      setNewProviderData({ nombre: "", identificacion: "", correo: null, observaciones: null })
      setIsNewProviderModalOpen(false)
      setSuccessMessage("Proveedor creado exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  }

  const handleCancelNewProvider = () => {
    setNewProviderData({ nombre: "", identificacion: "", correo: null, observaciones: null })
    setIsNewProviderModalOpen(false)
  }

  // Funciones para el modal de edición
  const handleEditProvider = (provider: ProveedorBackend) => {
    setEditingProvider(provider)
    setIsEditModalOpen(true)
  }

  const handleSaveEditProvider = async (data: { name: string; identificacion: string; correo: string; observaciones: string }) => {
    if (!editingProvider) return

    const updateData: UpdateProveedorDto = {
      nombre: data.name,
      identificacion: data.identificacion,
      correo: data.correo || null,
      observaciones: data.observaciones || null,
    }

    try {
      await updateMutation.mutateAsync({ id: editingProvider.id, data: updateData })
      setIsEditModalOpen(false)
      setEditingProvider(null)
      setSuccessMessage("Proveedor actualizado exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  }

  const handleCancelEditProvider = () => {
    setIsEditModalOpen(false)
    setEditingProvider(null)
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
    deactivateMutation.isPending

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <Building2 className="mr-3 h-8 w-8 text-camouflage-green-700" />
              Proveedores
            </h1>
            <p className="mt-1 text-camouflage-green-600">
              Gestiona los proveedores que suministran productos a tu inventario.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Barra de búsqueda compacta */}
            <div className="flex h-10 items-center gap-2 rounded-lg border border-camouflage-green-300 bg-white px-3 shadow-sm min-w-[280px] max-w-[280px]">
              <Search className="h-4 w-4 shrink-0 text-camouflage-green-600" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar por nombre o identificación..."
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
              onClick={() => setIsNewProviderModalOpen(true)}
              disabled={isLoadingData}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </div>
        </div>

        {/* Tabla de Proveedores */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">
                {isLoading ? (
                  "Cargando proveedores..."
                ) : (
                  <>
                    Proveedores Registrados ({pagination.totalItems.toLocaleString()})
                    {searchTerm && paginatedProviders.length !== pagination.totalItems && (
                      <span className="ml-2 text-sm font-normal text-camouflage-green-600">
                        mostrando {paginatedProviders.length} de {pagination.totalItems.toLocaleString()} total
                      </span>
                    )}
                  </>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* Filtro de estado */}
                <Select
                  value={statusFilter}
                  onValueChange={(value: "all" | "active" | "inactive") => {
                    setStatusFilter(value)
                    setCurrentPage(1)
                    clearSelection()
                  }}
                >
                  <SelectTrigger className="w-[140px] border-camouflage-green-300 bg-white text-camouflage-green-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
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
                            <AlertDialogTitle>Activar proveedores seleccionados</AlertDialogTitle>
                            <AlertDialogDescription>Se activarán {selectedCount} proveedor(es).</AlertDialogDescription>
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
                            <AlertDialogTitle>Desactivar proveedores seleccionados</AlertDialogTitle>
                            <AlertDialogDescription>Se desactivarán {selectedCount} proveedor(es).</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => bulkSetActive(false)}>Confirmar</AlertDialogAction>
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
                  <p className="text-sm text-camouflage-green-600">Cargando proveedores...</p>
                </div>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">
                <p>Error al cargar los proveedores. Por favor, intenta nuevamente.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                      <TableHead className="w-[36px]">
                        <div className="pl-3">
                          <Checkbox
                            checked={selectedCount === paginatedProviders.length && paginatedProviders.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedIds(new Set(paginatedProviders.map((p) => p.id)))
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
                      <TableHead className="w-[150px] font-semibold text-camouflage-green-700">
                        <div>
                          <button
                            onClick={() => handleSort("identificacion")}
                            className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                            disabled={isLoadingData}
                          >
                            Identificación
                            <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                              <ChevronUp
                                className={`h-3 w-3 ${sortField === "identificacion" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                              />
                              <ChevronDown
                                className={`h-3 w-3 ${sortField === "identificacion" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                              />
                            </div>
                          </button>
                        </div>
                      </TableHead>
                      <TableHead className="w-[200px] font-semibold text-camouflage-green-700">Correo</TableHead>
                      <TableHead className="w-[250px] font-semibold text-camouflage-green-700">Observaciones</TableHead>
                      <TableHead className="w-[100px] font-semibold text-camouflage-green-700">Estado</TableHead>
                      <TableHead className="w-[180px] font-semibold text-camouflage-green-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProviders.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={8} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Building2 className="h-12 w-12 text-camouflage-green-300" />
                            <div>
                              <p className="font-medium text-camouflage-green-600">
                                {searchTerm || statusFilter !== "all"
                                  ? "No se encontraron proveedores con los filtros aplicados"
                                  : "No hay proveedores registrados"}
                              </p>
                              <p className="mt-1 text-sm text-camouflage-green-500">
                                {searchTerm || statusFilter !== "all"
                                  ? "Intenta ajustar los filtros de búsqueda"
                                  : "Crea tu primer proveedor para comenzar"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedProviders.map((provider) => (
                        <TableRow
                          key={provider.id}
                          className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
                        >
                          <TableCell className="w-[36px]">
                            <div className="pl-3">
                              <Checkbox
                                checked={isSelected(provider.id)}
                                onCheckedChange={() => toggleSelect(provider.id)}
                                aria-label={`Seleccionar ${provider.nombre}`}
                                disabled={isLoadingData}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="w-[200px] font-medium text-camouflage-green-900">
                            {provider.nombre}
                          </TableCell>
                          <TableCell className="w-[150px] text-camouflage-green-600">
                            {provider.identificacion}
                          </TableCell>
                          <TableCell className="w-[200px] text-camouflage-green-600">
                            {provider.correo || "-"}
                          </TableCell>
                          <TableCell className="w-[250px]">
                            <div
                              className="max-w-[230px] truncate text-sm text-camouflage-green-600"
                              title={provider.observaciones || undefined}
                            >
                              {provider.observaciones || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="w-[100px]">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                provider.activo
                                  ? "bg-camouflage-green-100 text-camouflage-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {provider.activo ? "Activo" : "Inactivo"}
                            </span>
                          </TableCell>
                          <TableCell className="w-[180px]">
                            <div className="flex items-center justify-start gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                                title="Editar"
                                onClick={() => handleEditProvider(provider)}
                                disabled={isLoadingData}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                                title={provider.activo ? "Desactivar" : "Activar"}
                                onClick={() => toggleProviderStatus(provider.id)}
                                disabled={isLoadingData}
                              >
                                {provider.activo ? (
                                  <Power className="h-4 w-4" />
                                ) : (
                                  <PowerOff className="h-4 w-4" />
                                )}
                              </Button>
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
      </div>

      {/* Modal para nuevo proveedor */}
      <Modal
        isOpen={isNewProviderModalOpen}
        onClose={handleCancelNewProvider}
        title="Nuevo Proveedor"
        size="lg"
      >
        <div className="space-y-4">
          <div className="space-y-1 pt-2.5">
            <Label htmlFor="new-provider-name" className="font-medium text-camouflage-green-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="new-provider-name"
              type="text"
              placeholder="Ingresa el nombre del proveedor"
              value={newProviderData.nombre}
              onChange={(e) => handleNewProviderInputChange("nombre", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              disabled={isLoadingData}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-provider-identificacion" className="font-medium text-camouflage-green-700">
              Identificación <span className="text-red-500">*</span>
            </Label>
            <Input
              id="new-provider-identificacion"
              type="text"
              placeholder="Ingresa la identificación del proveedor"
              value={newProviderData.identificacion}
              onChange={(e) => handleNewProviderInputChange("identificacion", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              disabled={isLoadingData}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-provider-correo" className="font-medium text-camouflage-green-700">
              Correo
            </Label>
            <Input
              id="new-provider-correo"
              type="email"
              placeholder="Ingresa el correo del proveedor"
              value={newProviderData.correo || ""}
              onChange={(e) => handleNewProviderInputChange("correo", e.target.value || null)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              disabled={isLoadingData}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-provider-observaciones" className="font-medium text-camouflage-green-700">
              Observaciones
            </Label>
            <Textarea
              id="new-provider-observaciones"
              placeholder="Ingresa observaciones adicionales sobre el proveedor"
              value={newProviderData.observaciones || ""}
              onChange={(e) => handleNewProviderInputChange("observaciones", e.target.value || null)}
              className="scrollbar-thin scrollbar-thumb-camouflage-green-300 scrollbar-track-gray-100 min-h-[80px] resize-none border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              style={{
                outline: "none",
                boxShadow: "none",
              }}
              onFocus={(e) => {
                e.target.style.outline = "none"
                e.target.style.boxShadow = "none"
              }}
              disabled={isLoadingData}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelNewProvider}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
              disabled={isLoadingData}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNewProvider}
              className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
              disabled={isLoadingData || !newProviderData.nombre.trim() || !newProviderData.identificacion.trim()}
            >
              {isLoadingData ? "Guardando..." : "Crear Proveedor"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de edición */}
      {editingProvider && (
        <EditProviderModal
          isOpen={isEditModalOpen}
          onClose={handleCancelEditProvider}
          provider={{
            id: editingProvider.id,
            name: editingProvider.nombre,
            identificacion: editingProvider.identificacion,
            correo: editingProvider.correo,
            observaciones: editingProvider.observaciones,
          }}
          onSave={handleSaveEditProvider}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Toast de error personalizado */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
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
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
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

