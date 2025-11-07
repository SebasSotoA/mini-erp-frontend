"use client"

import {
  Layers,
  Plus,
  Eye,
  Edit,
  Power,
  PowerOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Search,
  Tag,
  Type,
  Palette,
  Ruler,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { DatePicker } from "@/components/ui/date-picker"
import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import {
  useCamposExtra,
  useCreateCampoExtra,
  useUpdateCampoExtra,
  useActivateCampoExtra,
  useDeactivateCampoExtra,
  useDeleteCampoExtra,
  mapTipoDatoFrontendToBackend,
  mapTipoDatoBackendToFrontend,
} from "@/hooks/api/use-campos-extra"
import type { CampoExtraBackend, CreateCampoExtraDto, UpdateCampoExtraDto } from "@/lib/api/types"
import { PaginationConfig } from "@/lib/types/inventory-value"
import { EditExtraFieldModal } from "@/components/modals/EditExtraFieldModal"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function ExtraFields() {
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
  const [sortField, setSortField] = useState<"nombre" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Función helper para renderizar el input de valor por defecto según el tipo (solo para el modal de creación)
  const renderDefaultValueInput = (type: string, value: string, onChange: (value: string) => void, disabled?: boolean) => {
    switch (type) {
      case "texto":
        return (
          <Input
            type="text"
            placeholder="Valor por defecto del campo"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
          />
        )
      
      case "si/no":
        return (
          <Select value={value} onValueChange={onChange} disabled={disabled}>
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
            disabled={disabled}
          />
        )
    }
  }

  // Estado para el modal de nuevo campo
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false)
  const [newFieldData, setNewFieldData] = useState<{
    name: string
    type: string
    defaultValue: string
    description: string
    isRequired: boolean
  }>({
    name: "",
    type: "texto",
    defaultValue: "",
    description: "",
    isRequired: false,
  })

  // Estado para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<CampoExtraBackend | null>(null)

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
      params.orderBy = "nombre"
      params.orderDesc = sortDirection === "desc"
    }

    return params
  }, [currentPage, itemsPerPage, searchTerm, sortField, sortDirection])

  // Obtener campos extra del backend
  const { data: camposExtraData, isLoading, error } = useCamposExtra(apiParams)

  // Mutaciones
  const createMutation = useCreateCampoExtra()
  const updateMutation = useUpdateCampoExtra()
  const activateMutation = useActivateCampoExtra()
  const deactivateMutation = useDeactivateCampoExtra()
  const deleteMutation = useDeleteCampoExtra()

  // Datos procesados
  const extraFields = camposExtraData?.items || []
  const pagination: PaginationConfig = useMemo(() => {
    if (!camposExtraData) {
      return {
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 0,
      }
    }
    return {
      currentPage: camposExtraData.page,
      itemsPerPage: camposExtraData.pageSize,
      totalItems: camposExtraData.totalCount,
      totalPages: camposExtraData.totalPages,
    }
  }, [camposExtraData])

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
  const selectedFields = extraFields.filter((f) => selectedIds.has(f.id))
  const allSelectedActive = selectedFields.length > 0 && selectedFields.every((f) => f.activo)
  const allSelectedInactive = selectedFields.length > 0 && selectedFields.every((f) => !f.activo)

  // Manejar ordenamiento
  const handleSort = (field: "nombre") => {
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
      // Detectar error específico de campo requerido con productos asociados solo al desactivar
      if (!isActive) {
        const errorMsg = error?.message || ""
        if (errorMsg.includes("productos") || errorMsg.includes("producto")) {
          // Extraer información del mensaje
          const fieldNameMatch = errorMsg.match(/campo extra requerido '([^']+)'/i) || errorMsg.match(/campo requerido '([^']+)'/i)
          const productCountMatch = errorMsg.match(/(\d+)\s*producto/i)
          
          const fieldName = fieldNameMatch ? fieldNameMatch[1] : "seleccionado"
          const productCount = productCountMatch ? productCountMatch[1] : ""
          
          // Crear mensaje más corto y claro
          let shortMessage = `No se puede desactivar el campo requerido "${fieldName}"`
          if (productCount) {
            shortMessage += ` porque está asignado a ${productCount} producto(s).`
          } else {
            shortMessage += ` porque tiene productos asociados.`
          }
          shortMessage += ` Para desactivarlo: 1) Cambia "EsRequerido" a false, o 2) Elimina el campo de todos los productos.`
          
          setErrorMessage(shortMessage)
          setShowErrorToast(true)
          setTimeout(() => setShowErrorToast(false), 8000)
        }
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
      setSuccessMessage(`${selectedIds.size} campo(s) eliminado(s) exitosamente.`)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error: any) {
      // Detectar error específico de regla de negocio para eliminación
      if (error?.message && error.message.includes("productos")) {
        setErrorMessage(error.message)
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 5000)
      }
      // Los demás errores se manejan en los hooks
    }
  }

  // Función para cambiar estado de un campo
  const toggleFieldStatus = async (id: string) => {
    const field = extraFields.find((f) => f.id === id)
    if (!field) return

    try {
      if (field.activo) {
        // Solo desactivar - aquí puede ocurrir el error de productos asignados
        await deactivateMutation.mutateAsync(id)
      } else {
        // Solo activar - no debería mostrar error de productos asignados
        await activateMutation.mutateAsync(id)
      }
    } catch (error: any) {
      // Detectar error específico de regla de negocio solo al desactivar
      if (field.activo && error?.message && error.message.includes("productos")) {
        setErrorMessage(error.message)
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 5000)
      }
      // Los demás errores se manejan en los hooks
    }
  }

  // Función para eliminar un campo
  const deleteField = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setSuccessMessage("Campo eliminado exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error: any) {
      // Detectar error específico de regla de negocio para eliminación
      if (error?.message && error.message.includes("productos")) {
        setErrorMessage(error.message)
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 5000)
      }
      // Los demás errores se manejan en los hooks
    }
  }

  // Funciones para el modal de nuevo campo
  const handleNewFieldInputChange = (field: string, value: string | boolean) => {
    setNewFieldData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveNewField = async () => {
    if (!newFieldData.name.trim()) {
      toast({
        title: "Campo obligatorio",
        description: "El nombre del campo es obligatorio.",
        variant: "destructive",
      })
      return
    }

    try {
      const createData: CreateCampoExtraDto = {
        nombre: newFieldData.name.trim(),
        tipoDato: mapTipoDatoFrontendToBackend(newFieldData.type),
        descripcion: newFieldData.description.trim() || null,
        valorPorDefecto: newFieldData.defaultValue.trim() || null,
        esRequerido: newFieldData.isRequired,
      }

      await createMutation.mutateAsync(createData)

    // Limpiar el formulario y cerrar el modal
    setNewFieldData({ name: "", type: "texto", defaultValue: "", description: "", isRequired: false })
    setIsNewFieldModalOpen(false)
      setSuccessMessage("Campo creado exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  }

  const handleCancelNewField = () => {
    setNewFieldData({ name: "", type: "texto", defaultValue: "", description: "", isRequired: false })
    setIsNewFieldModalOpen(false)
  }

  // Funciones para el modal de edición
  const handleEditField = (field: CampoExtraBackend) => {
    setEditingField(field)
    setIsEditModalOpen(true)
  }

  const handleSaveEditField = async (data: { nombre: string; tipoDato: string; descripcion: string | null; valorPorDefecto: string | null; esRequerido: boolean }) => {
    if (!editingField) return

    try {
      const updateData: UpdateCampoExtraDto = {
        nombre: data.nombre,
        tipoDato: data.tipoDato,
        descripcion: data.descripcion,
        valorPorDefecto: data.valorPorDefecto,
        esRequerido: data.esRequerido,
      }

      await updateMutation.mutateAsync({ id: editingField.id, data: updateData })
    setIsEditModalOpen(false)
    setEditingField(null)
      setSuccessMessage("Campo actualizado exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  }

  const handleCancelEditField = () => {
    setIsEditModalOpen(false)
    setEditingField(null)
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
              <Layers className="mr-3 h-8 w-8 text-camouflage-green-700" />
              Campos Extra
            </h1>
            <p className="mt-1 text-camouflage-green-600">
              Define características específicas para tus productos y servicios.
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
              onClick={() => setIsNewFieldModalOpen(true)}
              disabled={isLoadingData}
            >
            <Plus className="mr-2 h-4 w-4" />
              Nuevo Campo
          </Button>
        </div>
        </div>

        {/* Tabla de Campos Extra */}
        <Card className="border-camouflage-green-200">
              <CardHeader>
                <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">
                {isLoading ? (
                  "Cargando campos..."
                ) : (
                  <>
                    Campos Registrados ({pagination.totalItems.toLocaleString()})
                    {searchTerm && extraFields.length !== pagination.totalItems && (
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
                            <AlertDialogTitle>Activar campos seleccionados</AlertDialogTitle>
                            <AlertDialogDescription>Se activarán {selectedCount} campo(s).</AlertDialogDescription>
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
                            <AlertDialogTitle>Desactivar campos seleccionados</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se desactivarán {selectedCount} campo(s).
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
                            disabled={isLoadingData}
                          >
                            Eliminar
                    </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar campos seleccionados</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminarán {selectedCount} campo(s).
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
                  <p className="text-sm text-camouflage-green-600">Cargando campos...</p>
                </div>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">
                <p>Error al cargar los campos. Por favor, intenta nuevamente.</p>
              </div>
            ) : (
              <>
            <Table>
              <TableHeader>
                <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                  <TableHead className="w-[36px]">
                    <div className="pl-3">
                      <Checkbox
                        checked={selectedCount === extraFields.length && extraFields.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds(new Set(extraFields.map((f) => f.id)))
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
                  <TableHead className="w-[300px] font-semibold text-camouflage-green-700">Descripción</TableHead>
                  <TableHead className="w-[150px] font-semibold text-camouflage-green-700">Tipo</TableHead>
                  <TableHead className="w-[160px] font-semibold text-camouflage-green-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extraFields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-camouflage-green-600">
                      {searchTerm
                        ? "No se encontraron campos que coincidan con la búsqueda."
                        : "No hay campos registrados."}
                    </TableCell>
                  </TableRow>
                ) : (
                  extraFields.map((field) => (
                  <TableRow
                    key={field.id}
                    className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
                  >
                    <TableCell className="w-[36px]">
                      <div className="pl-3">
                        <Checkbox
                          checked={isSelected(field.id)}
                          onCheckedChange={() => toggleSelect(field.id)}
                          aria-label={`Seleccionar ${field.nombre}`}
                          disabled={isLoadingData}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <button
                        onClick={() => router.push(`/inventory/extra-fields/${field.id}`)}
                        className="text-left font-medium text-camouflage-green-900 transition-colors hover:text-camouflage-green-700 hover:underline"
                        disabled={isLoadingData}
                      >
                        {field.nombre}
                      </button>
                    </TableCell>
                    <TableCell className="w-[300px]">
                      <div
                        className="max-w-[280px] truncate text-sm text-camouflage-green-600"
                        title={field.descripcion || ""}
                      >
                        {field.descripcion || "-"}
                </div>
                    </TableCell>
                    <TableCell className="w-[150px]">
                      <span className="rounded-full bg-camouflage-green-100 px-2 py-1 text-sm font-medium text-camouflage-green-800 capitalize">
                        {mapTipoDatoBackendToFrontend(field.tipoDato)}
                      </span>
                    </TableCell>
                    <TableCell className="w-[160px]">
                      <div className="flex items-center justify-start gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                          title="Ver detalles"
                          onClick={() => router.push(`/inventory/extra-fields/${field.id}`)}
                          disabled={isLoadingData}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                          title="Editar"
                          onClick={() => handleEditField(field)}
                          disabled={isLoadingData}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                          title={field.activo ? "Desactivar" : "Activar"}
                          onClick={() => toggleFieldStatus(field.id)}
                          disabled={isLoadingData}
                        >
                          {field.activo ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
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
                              <AlertDialogTitle>Eliminar campo</AlertDialogTitle>
                              <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará "{field.nombre}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => deleteField(field.id)}
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
      </div>

      {/* Modal para nuevo campo */}
      <Modal isOpen={isNewFieldModalOpen} onClose={handleCancelNewField} title="Nuevo Campo">
        <div className="space-y-4">
          <div className="space-y-1 pt-2.5">
            <Label htmlFor="field-name" className="font-medium text-camouflage-green-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="field-name"
              type="text"
              placeholder="Ej: Color, Peso, Fecha de Vencimiento..."
              value={newFieldData.name}
              onChange={(e) => handleNewFieldInputChange("name", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-type" className="font-medium text-camouflage-green-700">
              Tipo de Campo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={newFieldData.type}
              onValueChange={(value) => handleNewFieldInputChange("type", value)}
              disabled={createMutation.isPending}
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
            <Label htmlFor="field-default" className="font-medium text-camouflage-green-700">
              Valor por Defecto
            </Label>
            {renderDefaultValueInput(
              newFieldData.type,
              newFieldData.defaultValue,
              (value) => handleNewFieldInputChange("defaultValue", value),
              createMutation.isPending
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-description" className="font-medium text-camouflage-green-700">
              Descripción
            </Label>
            <Textarea
              id="field-description"
              placeholder="Descripción del campo adicional"
              value={newFieldData.description}
              onChange={(e) => handleNewFieldInputChange("description", e.target.value)}
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="field-required"
              checked={newFieldData.isRequired}
              onCheckedChange={(checked) => handleNewFieldInputChange("isRequired", checked as boolean)}
              disabled={createMutation.isPending}
            />
            <Label htmlFor="field-required" className="text-sm font-medium text-camouflage-green-700">
              Campo requerido
            </Label>
                </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelNewField}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNewField}
              variant="primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para editar campo */}
      {editingField && (
        <EditExtraFieldModal
          isOpen={isEditModalOpen}
          onClose={handleCancelEditField}
          field={{
            id: editingField.id,
            name: editingField.nombre,
            type: editingField.tipoDato,
            description: editingField.descripcion || "",
            defaultValue: editingField.valorPorDefecto || "",
            isRequired: editingField.esRequerido,
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
              {errorMessage || "No se puede desactivar/eliminar el campo porque está siendo usado en productos."}
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
