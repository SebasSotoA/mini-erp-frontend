"use client"

import {
  Users,
  Plus,
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
import { EditSalespersonModal } from "@/components/modals/EditSalespersonModal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import { useToast } from "@/hooks/use-toast"
import {
  useVendedores,
  useCreateVendedor,
  useUpdateVendedor,
  useActivateVendedor,
  useDeactivateVendedor,
} from "@/hooks/api/use-vendedores"
import type { VendedorBackend, CreateVendedorDto, UpdateVendedorDto } from "@/lib/api/types"
import { PaginationConfig } from "@/lib/types/inventory-value"
import { ApiError, NetworkError } from "@/lib/api/errors"

export default function Salespersons() {
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

  // Estado para el modal de nuevo vendedor
  const [isNewSalespersonModalOpen, setIsNewSalespersonModalOpen] = useState(false)
  const [newSalespersonData, setNewSalespersonData] = useState<CreateVendedorDto>({
    nombre: "",
    identificacion: "",
    correo: null,
    observaciones: null,
  })

  // Estado para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingSalesperson, setEditingSalesperson] = useState<VendedorBackend | null>(null)

  // Estado para selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedCount = selectedIds.size

  // Estado para toast de error personalizado
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Estado para toast de éxito personalizado
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Estado para toast de validación (vendedor con facturas)
  const [showValidationToast, setShowValidationToast] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")

  // Estado para toast de identificación duplicada
  const [showDuplicateSalespersonToast, setShowDuplicateSalespersonToast] = useState(false)
  const [duplicateSalespersonMessage, setDuplicateSalespersonMessage] = useState("")

  // Estado para toast de identificación inválida
  const [showInvalidTaxIdToast, setShowInvalidTaxIdToast] = useState(false)
  const [hasInvalidTaxIdError, setHasInvalidTaxIdError] = useState(false)
  const [hasInvalidTaxIdErrorEdit, setHasInvalidTaxIdErrorEdit] = useState(false)

  // Obtener vendedores del backend (sin filtros, luego filtramos en frontend)
  const { data: allSalespersons = [], isLoading, error } = useVendedores()

  // Mutaciones
  const createMutation = useCreateVendedor()
  const updateMutation = useUpdateVendedor()
  const activateMutation = useActivateVendedor()
  const deactivateMutation = useDeactivateVendedor()

  // Filtrar y ordenar vendedores en el frontend
  const filteredSalespersons = useMemo(() => {
    let filtered = [...allSalespersons]

    // Filtrar por búsqueda (nombre o identificación)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(
        (s) =>
          s.nombre.toLowerCase().includes(searchLower) ||
          s.identificacion.toLowerCase().includes(searchLower),
      )
    }

    // Filtrar por estado
    if (statusFilter === "active") {
      filtered = filtered.filter((s) => s.activo)
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((s) => !s.activo)
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
  }, [allSalespersons, searchTerm, statusFilter, sortField, sortDirection])

  // Paginación frontend
  const paginatedSalespersons = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredSalespersons.slice(startIndex, endIndex)
  }, [filteredSalespersons, currentPage, itemsPerPage])

  const pagination: PaginationConfig = useMemo(() => {
    const totalItems = filteredSalespersons.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
    }
  }, [filteredSalespersons.length, currentPage, itemsPerPage])

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
  const selectedSalespersons = filteredSalespersons.filter((s) => selectedIds.has(s.id))
  const allSelectedActive = selectedSalespersons.length > 0 && selectedSalespersons.every((s) => s.activo)
  const allSelectedInactive = selectedSalespersons.length > 0 && selectedSalespersons.every((s) => !s.activo)

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
    } catch (error: any) {
      // Verificar si es un error de validación por facturas asociadas
      let errorMessage = ""
      
      if (error instanceof ApiError) {
        errorMessage = error.message || ""
      } else if (error instanceof Error) {
        errorMessage = error.message || ""
      } else {
        errorMessage = error?.toString() || ""
      }
      
      const lowerMsg = errorMessage.toLowerCase()
      
      if (
        lowerMsg.includes("no se puede desactivar") ||
        lowerMsg.includes("facturas de venta registradas") ||
        lowerMsg.includes("historial contable") ||
        lowerMsg.includes("trazabilidad")
      ) {
        setValidationMessage(errorMessage)
        setShowValidationToast(true)
        setTimeout(() => setShowValidationToast(false), 6000)
      }
      // Los demás errores ya se manejan en los hooks
    }
  }

  // Función para cambiar estado de un vendedor
  const toggleSalespersonStatus = async (id: string) => {
    const salesperson = allSalespersons.find((s) => s.id === id)
    if (!salesperson) return

    try {
      if (salesperson.activo) {
        await deactivateMutation.mutateAsync(id)
      } else {
        await activateMutation.mutateAsync(id)
      }
    } catch (error: any) {
      // Verificar si es un error de validación por facturas asociadas
      let errorMessage = ""
      
      if (error instanceof ApiError) {
        errorMessage = error.message || ""
      } else if (error instanceof Error) {
        errorMessage = error.message || ""
      } else {
        errorMessage = error?.toString() || ""
      }
      
      const lowerMsg = errorMessage.toLowerCase()
      
      if (
        lowerMsg.includes("no se puede desactivar") ||
        lowerMsg.includes("facturas de venta registradas") ||
        lowerMsg.includes("historial contable") ||
        lowerMsg.includes("trazabilidad")
      ) {
        setValidationMessage(errorMessage)
        setShowValidationToast(true)
        setTimeout(() => setShowValidationToast(false), 6000)
      }
      // Los demás errores ya se manejan en los hooks
    }
  }

  // Funciones para el modal de nuevo vendedor
  const handleNewSalespersonInputChange = (field: keyof CreateVendedorDto, value: string) => {
    setNewSalespersonData((prev) => {
      // Para campos requeridos (nombre, identificacion), asegurar que sean string
      if (field === "nombre" || field === "identificacion") {
        // Si se está editando la identificación, limpiar el error cuando el usuario empiece a escribir
        if (field === "identificacion" && hasInvalidTaxIdError) {
          setHasInvalidTaxIdError(false)
        }
        return { ...prev, [field]: value }
      }
      // Para campos opcionales (correo, observaciones), convertir string vacío a null
      return { ...prev, [field]: value.trim() === "" ? null : value }
    })
  }

  const handleSaveNewSalesperson = async () => {
    if (!newSalespersonData.nombre.trim()) {
      toast({
        title: "Campo obligatorio",
        description: "El nombre del vendedor es obligatorio.",
        variant: "destructive",
      })
      return
    }

    if (!newSalespersonData.identificacion.trim()) {
      toast({
        title: "Campo obligatorio",
        description: "La identificación del vendedor es obligatoria.",
        variant: "destructive",
      })
      return
    }

    // Validar formato de identificación antes de enviar
    const taxIdRegex = /^[0-9-]+$/
    if (!taxIdRegex.test(newSalespersonData.identificacion.trim())) {
      setHasInvalidTaxIdError(true)
      setShowInvalidTaxIdToast(true)
      setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
      return
    }

    // Si llegamos aquí, la validación pasó
    setHasInvalidTaxIdError(false)

    try {
      // Preparar los datos para enviar, asegurando que los campos opcionales vacíos sean null
      const dataToSend: CreateVendedorDto = {
        nombre: newSalespersonData.nombre.trim(),
        identificacion: newSalespersonData.identificacion.trim(),
        correo: (newSalespersonData.correo && typeof newSalespersonData.correo === 'string' && newSalespersonData.correo.trim() !== "") ? newSalespersonData.correo.trim() : null,
        observaciones: (newSalespersonData.observaciones && typeof newSalespersonData.observaciones === 'string' && newSalespersonData.observaciones.trim() !== "") ? newSalespersonData.observaciones.trim() : null,
      }

      await createMutation.mutateAsync(dataToSend)
      setNewSalespersonData({ nombre: "", identificacion: "", correo: null, observaciones: null })
      setIsNewSalespersonModalOpen(false)
      setHasInvalidTaxIdError(false)
      setShowInvalidTaxIdToast(false)
      setShowDuplicateSalespersonToast(false)
      setSuccessMessage(`El vendedor "${dataToSend.nombre}" ha sido creado exitosamente.`)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error: any) {
      // Manejar errores específicos
      let errorMessage = ""
      
      if (error instanceof ApiError) {
        errorMessage = error.message || ""
      } else if (error instanceof Error) {
        errorMessage = error.message || ""
      } else {
        errorMessage = error?.toString() || ""
      }
      
      const lowerMsg = errorMessage.toLowerCase()
      
      // Verificar si es el error de vendedor duplicado
      if (
        lowerMsg.includes("ya existe") || 
        lowerMsg.includes("duplicado") ||
        (lowerMsg.includes("identificación") && lowerMsg.includes("ya existe"))
      ) {
        const duplicateMsg = lowerMsg.includes("identificación") 
          ? (errorMessage || "Ya existe un vendedor con esta identificación.")
          : "Ya existe un vendedor con este nombre o identificación."
        setDuplicateSalespersonMessage(duplicateMsg)
        setShowDuplicateSalespersonToast(true)
        setTimeout(() => setShowDuplicateSalespersonToast(false), 5000)
      } else if (lowerMsg.includes("solo puede contener números y guiones")) {
        // Mostrar toast visual personalizado para identificación inválida
        setHasInvalidTaxIdError(true)
        setShowInvalidTaxIdToast(true)
        setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
      }
      // Los demás errores ya se manejan en los hooks
    }
  }

  const handleCancelNewSalesperson = () => {
    setNewSalespersonData({ nombre: "", identificacion: "", correo: null, observaciones: null })
    setIsNewSalespersonModalOpen(false)
    setHasInvalidTaxIdError(false)
    setShowInvalidTaxIdToast(false)
    setShowDuplicateSalespersonToast(false)
  }

  // Funciones para el modal de edición
  const handleEditSalesperson = (salesperson: VendedorBackend) => {
    setEditingSalesperson(salesperson)
    setIsEditModalOpen(true)
  }

  const handleSaveEditSalesperson = async (data: { name: string; identificacion: string; correo: string; observaciones: string }) => {
    if (!editingSalesperson) return

    // Validar formato de identificación antes de enviar
    const taxIdRegex = /^[0-9-]+$/
    if (!taxIdRegex.test(data.identificacion.trim())) {
      setHasInvalidTaxIdErrorEdit(true)
      setShowInvalidTaxIdToast(true)
      setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
      return
    }

    // Si llegamos aquí, la validación pasó
    setHasInvalidTaxIdErrorEdit(false)

    const updateData: UpdateVendedorDto = {
      nombre: data.name,
      identificacion: data.identificacion,
      correo: data.correo || null,
      observaciones: data.observaciones || null,
    }

    try {
      await updateMutation.mutateAsync({ id: editingSalesperson.id, data: updateData })
      setIsEditModalOpen(false)
      setEditingSalesperson(null)
      setHasInvalidTaxIdErrorEdit(false)
      setShowInvalidTaxIdToast(false)
      setShowDuplicateSalespersonToast(false)
      setSuccessMessage(`El vendedor "${data.name}" ha sido actualizado exitosamente.`)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error: any) {
      // Manejar errores específicos
      let errorMessage = ""
      let validationErrors: Record<string, string> = {}
      
      if (error instanceof ApiError) {
        errorMessage = error.message || ""
        // Obtener errores de validación si existen
        if (error.isValidationError() && error.errors) {
          validationErrors = error.getValidationErrors()
          // Buscar el mensaje de error de identificación en el array de errores
          const identificacionError = error.errors.find(err => 
            err.field?.toLowerCase().includes("identificacion") || 
            err.field?.toLowerCase().includes("identificación")
          )
          if (identificacionError) {
            errorMessage = identificacionError.message || errorMessage
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || ""
      } else {
        errorMessage = error?.toString() || ""
      }
      
      const lowerMsg = errorMessage.toLowerCase()
      
      // Verificar si es el error de identificación inválida (números y guiones)
      if (
        lowerMsg.includes("solo puede contener números y guiones") ||
        lowerMsg.includes("solo puede contener numeros y guiones") ||
        lowerMsg.includes("identificación") && (lowerMsg.includes("números") || lowerMsg.includes("numeros") || lowerMsg.includes("guiones"))
      ) {
        // Mostrar toast visual personalizado para identificación inválida
        setHasInvalidTaxIdErrorEdit(true)
        setShowInvalidTaxIdToast(true)
        setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
        return // Salir temprano para evitar que el hook muestre otro toast
      }
      
      // Verificar si es el error de vendedor duplicado
      if (
        lowerMsg.includes("ya existe") || 
        lowerMsg.includes("duplicado") ||
        (lowerMsg.includes("identificación") && lowerMsg.includes("ya existe"))
      ) {
        const duplicateMsg = lowerMsg.includes("identificación") 
          ? (errorMessage || "Ya existe un vendedor con esta identificación.")
          : "Ya existe un vendedor con este nombre o identificación."
        setDuplicateSalespersonMessage(duplicateMsg)
        setShowDuplicateSalespersonToast(true)
        setTimeout(() => setShowDuplicateSalespersonToast(false), 5000)
        return // Salir temprano para evitar que el hook muestre otro toast
      }
      
      // Si hay errores de validación en el array, verificar el campo identificacion
      if (Object.keys(validationErrors).length > 0) {
        const identificacionErrorMsg = validationErrors.identificacion || validationErrors.Identificacion || ""
        const lowerIdentificacionMsg = identificacionErrorMsg.toLowerCase()
        
        if (
          lowerIdentificacionMsg.includes("solo puede contener números y guiones") ||
          lowerIdentificacionMsg.includes("solo puede contener numeros y guiones") ||
          lowerIdentificacionMsg.includes("números") || 
          lowerIdentificacionMsg.includes("numeros") ||
          lowerIdentificacionMsg.includes("guiones")
        ) {
          setHasInvalidTaxIdErrorEdit(true)
          setShowInvalidTaxIdToast(true)
          setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
          return
        }
      }
      
      // Si es un error 400 (Bad Request) y no hemos manejado el error específicamente,
      // podría ser un error de validación de identificación que no coincide con los patrones
      if (error instanceof ApiError && error.statusCode === 400) {
        // Intentar mostrar el error de identificación inválida si el mensaje contiene "identificación"
        if (lowerMsg.includes("identificación") || lowerMsg.includes("identificacion")) {
          setHasInvalidTaxIdErrorEdit(true)
          setShowInvalidTaxIdToast(true)
          setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
          return
        }
      }
      
      // Los demás errores ya se manejan en los hooks
    }
  }

  const handleCancelEditSalesperson = () => {
    setIsEditModalOpen(false)
    setEditingSalesperson(null)
    setHasInvalidTaxIdErrorEdit(false)
    setShowInvalidTaxIdToast(false)
    setShowDuplicateSalespersonToast(false)
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
              <Users className="mr-3 h-8 w-8 text-camouflage-green-700" />
              Vendedores
            </h1>
            <p className="mt-1 text-camouflage-green-600">
              Gestiona los vendedores que realizan ventas en tu inventario.
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
              onClick={() => setIsNewSalespersonModalOpen(true)}
              disabled={isLoadingData}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Vendedor
            </Button>
          </div>
        </div>

        {/* Tabla de Vendedores */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">
                {isLoading ? (
                  "Cargando vendedores..."
                ) : (
                  <>
                    Vendedores Registrados ({pagination.totalItems.toLocaleString()})
                    {searchTerm && paginatedSalespersons.length !== pagination.totalItems && (
                      <span className="ml-2 text-sm font-normal text-camouflage-green-600">
                        mostrando {paginatedSalespersons.length} de {pagination.totalItems.toLocaleString()} total
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
                            <AlertDialogTitle>Activar vendedores seleccionados</AlertDialogTitle>
                            <AlertDialogDescription>Se activarán {selectedCount} vendedor(es).</AlertDialogDescription>
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
                            <AlertDialogTitle>Desactivar vendedores seleccionados</AlertDialogTitle>
                            <AlertDialogDescription>Se desactivarán {selectedCount} vendedor(es).</AlertDialogDescription>
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
                  <p className="text-sm text-camouflage-green-600">Cargando vendedores...</p>
                </div>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">
                <p>Error al cargar los vendedores. Por favor, intenta nuevamente.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                      <TableHead className="w-[36px]">
                        <div className="pl-3">
                          <Checkbox
                            checked={selectedCount === paginatedSalespersons.length && paginatedSalespersons.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedIds(new Set(paginatedSalespersons.map((s) => s.id)))
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
                    {paginatedSalespersons.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={8} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Users className="h-12 w-12 text-camouflage-green-300" />
                            <div>
                              <p className="font-medium text-camouflage-green-600">
                                {searchTerm || statusFilter !== "all"
                                  ? "No se encontraron vendedores con los filtros aplicados"
                                  : "No hay vendedores registrados"}
                              </p>
                              <p className="mt-1 text-sm text-camouflage-green-500">
                                {searchTerm || statusFilter !== "all"
                                  ? "Intenta ajustar los filtros de búsqueda"
                                  : "Crea tu primer vendedor para comenzar"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedSalespersons.map((salesperson) => (
                        <TableRow
                          key={salesperson.id}
                          className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
                        >
                          <TableCell className="w-[36px]">
                            <div className="pl-3">
                              <Checkbox
                                checked={isSelected(salesperson.id)}
                                onCheckedChange={() => toggleSelect(salesperson.id)}
                                aria-label={`Seleccionar ${salesperson.nombre}`}
                                disabled={isLoadingData}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="w-[200px] font-medium text-camouflage-green-900">
                            {salesperson.nombre}
                          </TableCell>
                          <TableCell className="w-[150px] text-camouflage-green-600">
                            {salesperson.identificacion}
                          </TableCell>
                          <TableCell className="w-[200px] text-camouflage-green-600">
                            {salesperson.correo || "-"}
                          </TableCell>
                          <TableCell className="w-[250px]">
                            <div
                              className="max-w-[230px] truncate text-sm text-camouflage-green-600"
                              title={salesperson.observaciones || undefined}
                            >
                              {salesperson.observaciones || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="w-[100px]">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                salesperson.activo
                                  ? "bg-camouflage-green-100 text-camouflage-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {salesperson.activo ? "Activo" : "Inactivo"}
                            </span>
                          </TableCell>
                          <TableCell className="w-[180px]">
                            <div className="flex items-center justify-start gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                                title="Editar"
                                onClick={() => handleEditSalesperson(salesperson)}
                                disabled={isLoadingData}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                                title={salesperson.activo ? "Desactivar" : "Activar"}
                                onClick={() => toggleSalespersonStatus(salesperson.id)}
                                disabled={isLoadingData}
                              >
                                {salesperson.activo ? (
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

      {/* Modal para nuevo vendedor */}
      <Modal
        isOpen={isNewSalespersonModalOpen}
        onClose={handleCancelNewSalesperson}
        title="Nuevo Vendedor"
        size="lg"
      >
        <div className="space-y-4">
          <div className="space-y-1 pt-2.5">
            <Label htmlFor="new-salesperson-name" className="font-medium text-camouflage-green-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="new-salesperson-name"
              type="text"
              placeholder="Ingresa el nombre del vendedor"
              value={newSalespersonData.nombre}
              onChange={(e) => handleNewSalespersonInputChange("nombre", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              disabled={isLoadingData}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-salesperson-identificacion" className="font-medium text-camouflage-green-700">
              Identificación <span className="text-red-500">*</span>
            </Label>
            <Input
              id="new-salesperson-identificacion"
              type="text"
              placeholder="Ingresa la identificación del vendedor"
              value={newSalespersonData.identificacion}
              onChange={(e) => handleNewSalespersonInputChange("identificacion", e.target.value)}
              className={
                hasInvalidTaxIdError
                  ? "border-red-500 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500"
                  : "border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              }
              disabled={isLoadingData}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-salesperson-correo" className="font-medium text-camouflage-green-700">
              Correo
            </Label>
            <Input
              id="new-salesperson-correo"
              type="email"
              placeholder="Ingresa el correo del vendedor"
              value={newSalespersonData.correo || ""}
              onChange={(e) => handleNewSalespersonInputChange("correo", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              disabled={isLoadingData}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-salesperson-observaciones" className="font-medium text-camouflage-green-700">
              Observaciones
            </Label>
            <Textarea
              id="new-salesperson-observaciones"
              placeholder="Ingresa observaciones adicionales sobre el vendedor"
              value={newSalespersonData.observaciones || ""}
              onChange={(e) => handleNewSalespersonInputChange("observaciones", e.target.value)}
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
              onClick={handleCancelNewSalesperson}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
              disabled={isLoadingData}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNewSalesperson}
              className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
              disabled={isLoadingData || !newSalespersonData.nombre.trim() || !newSalespersonData.identificacion.trim()}
            >
              {isLoadingData ? "Guardando..." : "Crear Vendedor"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de edición */}
      {editingSalesperson && (
        <EditSalespersonModal
          isOpen={isEditModalOpen}
          onClose={handleCancelEditSalesperson}
          salesperson={{
            id: editingSalesperson.id,
            name: editingSalesperson.nombre,
            identificacion: editingSalesperson.identificacion,
            correo: editingSalesperson.correo,
            observaciones: editingSalesperson.observaciones,
          }}
          onSave={handleSaveEditSalesperson}
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

      {/* Toast de validación (vendedor con facturas asociadas) */}
      {showValidationToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300 max-w-md">
            <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
            <p className="text-sm font-medium text-orange-800">{validationMessage}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowValidationToast(false)}
              className="h-6 w-6 p-0 text-orange-600 hover:bg-orange-100 hover:text-orange-800 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Toast específico para identificación duplicada de vendedor */}
      {showDuplicateSalespersonToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              {duplicateSalespersonMessage}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDuplicateSalespersonToast(false)}
              className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Toast específico para identificación inválida (solo números y guiones) */}
      {showInvalidTaxIdToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              La identificación solo puede contener números y guiones.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInvalidTaxIdToast(false)}
              className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

