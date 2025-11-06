"use client"

import {
  Tags,
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
  CloudUpload,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import Image from "next/image"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import { useToast } from "@/hooks/use-toast"
import {
  useCategorias,
  useCreateCategoria,
  useUpdateCategoria,
  useActivateCategoria,
  useDeactivateCategoria,
  useDeleteCategoria,
} from "@/hooks/api/use-categorias"
import type { CategoriaBackend, CreateCategoriaDto, UpdateCategoriaDto } from "@/lib/api/types"
import { PaginationConfig } from "@/lib/types/inventory-value"
import { uploadCategoryImage, deleteCategoryImage, moveImageToCategoryFolder } from "@/lib/storage/supabase-client"

export default function Categories() {
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

  // Estado para el modal de nueva categoría
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false)
  const [newCategoryData, setNewCategoryData] = useState<{ name: string; description: string; image: File | null }>({
    name: "",
    description: "",
    image: null,
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isImageDragOver, setIsImageDragOver] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)

  // Estado para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoriaBackend | null>(null)
  const [editCategoryData, setEditCategoryData] = useState<{ name: string; description: string; image: File | null; currentImageUrl: string | null }>({
    name: "",
    description: "",
    image: null,
    currentImageUrl: null,
  })
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [isEditImageDragOver, setIsEditImageDragOver] = useState(false)
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false)
  const [uploadedEditImageUrl, setUploadedEditImageUrl] = useState<string | null>(null)

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

  // Obtener categorías del backend
  const { data: categoriasData, isLoading, error } = useCategorias(apiParams)

  // Mutaciones
  const createMutation = useCreateCategoria()
  const updateMutation = useUpdateCategoria()
  const activateMutation = useActivateCategoria()
  const deactivateMutation = useDeactivateCategoria()
  const deleteMutation = useDeleteCategoria()

  // Datos procesados
  const categories = categoriasData?.items || []
  const pagination: PaginationConfig = useMemo(() => {
    if (!categoriasData) {
      return {
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 0,
      }
    }
    return {
      currentPage: categoriasData.page,
      itemsPerPage: categoriasData.pageSize,
      totalItems: categoriasData.totalCount,
      totalPages: categoriasData.totalPages,
    }
  }, [categoriasData])

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
  const selectedCategories = categories.filter((c) => selectedIds.has(c.id))
  const allSelectedActive = selectedCategories.length > 0 && selectedCategories.every((c) => c.activo)
  const allSelectedInactive = selectedCategories.length > 0 && selectedCategories.every((c) => !c.activo)

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
      setSuccessMessage(`${selectedIds.size} categoría(s) eliminada(s) exitosamente.`)
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

  // Función para cambiar estado de una categoría
  const toggleCategoryStatus = async (id: string) => {
    const category = categories.find((c) => c.id === id)
    if (!category) return

    try {
      if (category.activo) {
        // Solo desactivar - aquí puede ocurrir el error de productos asignados
        await deactivateMutation.mutateAsync(id)
      } else {
        // Solo activar - no debería mostrar error de productos asignados
        await activateMutation.mutateAsync(id)
      }
    } catch (error: any) {
      // Detectar error específico de regla de negocio solo al desactivar
      if (category.activo && error?.message && error.message.includes("productos asignados")) {
        setErrorMessage(error.message)
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 5000)
      }
      // Los demás errores se manejan en los hooks
    }
  }

  // Función para eliminar una categoría
  const deleteCategory = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setSuccessMessage("Categoría eliminada exitosamente.")
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

  // Funciones para el modal de nueva categoría
  const handleNewCategoryInputChange = (field: "name" | "description", value: string) => {
    setNewCategoryData((prev) => ({ ...prev, [field]: value }))
  }

  // Funciones para manejar imagen en creación
  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsImageDragOver(true)
  }

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsImageDragOver(false)
  }

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsImageDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      setNewCategoryData((prev) => ({ ...prev, image: file }))
      setImagePreview(URL.createObjectURL(file))
    } else {
      toast({
        title: "Formato no válido",
        description: "Por favor, selecciona un archivo de imagen válido.",
        variant: "destructive",
      })
    }
  }

  const handleImageAreaClick = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setNewCategoryData((prev) => ({ ...prev, image: file }))
        setImagePreview(URL.createObjectURL(file))
      }
    }
    input.click()
  }

  const removeImage = () => {
    if (uploadedImageUrl) {
      deleteCategoryImage(uploadedImageUrl).catch((error) => {
        console.error("Error al eliminar imagen de Supabase:", error)
      })
    }
    setNewCategoryData((prev) => ({ ...prev, image: null }))
    setImagePreview(null)
    setUploadedImageUrl(null)
  }

  const handleSaveNewCategory = async () => {
    if (!newCategoryData.name.trim()) {
      toast({
        title: "Campo obligatorio",
        description: "El nombre de la categoría es obligatorio.",
        variant: "destructive",
      })
      return
    }

    try {
      let finalImageUrl: string | null = null

      // Subir imagen a Supabase si hay un archivo nuevo
      if (newCategoryData.image) {
        try {
          setIsUploadingImage(true)
          // Subir a carpeta temporal primero
          finalImageUrl = await uploadCategoryImage(newCategoryData.image)
          setUploadedImageUrl(finalImageUrl)
        } catch (error: any) {
          toast({
            title: "Error al subir imagen",
            description: error.message || "No se pudo subir la imagen. Intenta nuevamente.",
            variant: "destructive",
          })
          setIsUploadingImage(false)
          return
        } finally {
          setIsUploadingImage(false)
        }
      }

      const createData: CreateCategoriaDto = {
        nombre: newCategoryData.name.trim(),
        descripcion: newCategoryData.description.trim() || null,
        imagenCategoriaUrl: finalImageUrl,
      }

      const response = await createMutation.mutateAsync(createData)

      // Si la categoría se creó exitosamente y hay una imagen temporal, moverla a la carpeta de la categoría
      if (finalImageUrl && response.data.id) {
        try {
          finalImageUrl = await moveImageToCategoryFolder(finalImageUrl, response.data.id)
          // Actualizar la categoría con la nueva URL de la imagen
          await updateMutation.mutateAsync({
            id: response.data.id,
            data: { imagenCategoriaUrl: finalImageUrl },
          })
        } catch (error: any) {
          console.error("Error al mover imagen:", error)
          // No fallar la creación si solo falla el movimiento de la imagen
        }
      }

      // Limpiar el formulario y cerrar el modal
      setNewCategoryData({ name: "", description: "", image: null })
      setImagePreview(null)
      setUploadedImageUrl(null)
      setIsNewCategoryModalOpen(false)
      setSuccessMessage("Categoría creada exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error) {
      // Si hubo un error y se subió una imagen, eliminarla
      if (uploadedImageUrl) {
        deleteCategoryImage(uploadedImageUrl).catch((error) => {
          console.error("Error al eliminar imagen de Supabase:", error)
        })
      }
      // Los errores ya se manejan en los hooks
    }
  }

  const handleCancelNewCategory = () => {
    if (uploadedImageUrl) {
      deleteCategoryImage(uploadedImageUrl).catch((error) => {
        console.error("Error al eliminar imagen de Supabase:", error)
      })
    }
    setNewCategoryData({ name: "", description: "", image: null })
    setImagePreview(null)
    setUploadedImageUrl(null)
    setIsNewCategoryModalOpen(false)
  }

  // Funciones para el modal de edición
  const handleEditCategory = (category: CategoriaBackend) => {
    setEditingCategory(category)
    setEditCategoryData({
      name: category.nombre,
      description: category.descripcion || "",
      image: null,
      currentImageUrl: category.imagenCategoriaUrl || null,
    })
    setEditImagePreview(null)
    setUploadedEditImageUrl(null)
    setIsEditModalOpen(true)
  }

  const handleEditCategoryInputChange = (field: "name" | "description", value: string) => {
    setEditCategoryData((prev) => ({ ...prev, [field]: value }))
  }

  // Funciones para manejar imagen en edición
  const handleEditImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsEditImageDragOver(true)
  }

  const handleEditImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsEditImageDragOver(false)
  }

  const handleEditImageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsEditImageDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      setEditCategoryData((prev) => ({ ...prev, image: file }))
      setEditImagePreview(URL.createObjectURL(file))
    } else {
      toast({
        title: "Formato no válido",
        description: "Por favor, selecciona un archivo de imagen válido.",
        variant: "destructive",
      })
    }
  }

  const handleEditImageAreaClick = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setEditCategoryData((prev) => ({ ...prev, image: file }))
        setEditImagePreview(URL.createObjectURL(file))
      }
    }
    input.click()
  }

  const removeEditImage = () => {
    if (uploadedEditImageUrl) {
      deleteCategoryImage(uploadedEditImageUrl).catch((error) => {
        console.error("Error al eliminar imagen de Supabase:", error)
      })
    }
    setEditCategoryData((prev) => ({ ...prev, image: null, currentImageUrl: null }))
    setEditImagePreview(null)
    setUploadedEditImageUrl(null)
  }

  const handleSaveEditCategory = async () => {
    if (!editingCategory) return

    if (!editCategoryData.name.trim()) {
      toast({
        title: "Campo obligatorio",
        description: "El nombre de la categoría es obligatorio.",
        variant: "destructive",
      })
      return
    }

    try {
      let finalImageUrl: string | null = editCategoryData.currentImageUrl || null

      // Si hay una nueva imagen, subirla
      if (editCategoryData.image) {
        try {
          setIsUploadingEditImage(true)
          // Subir a carpeta temporal primero
          const tempImageUrl = await uploadCategoryImage(editCategoryData.image)
          setUploadedEditImageUrl(tempImageUrl)

          // Mover a la carpeta de la categoría
          finalImageUrl = await moveImageToCategoryFolder(tempImageUrl, editingCategory.id)

          // Eliminar imagen anterior si existe y es diferente
          if (editCategoryData.currentImageUrl && editCategoryData.currentImageUrl !== finalImageUrl) {
            deleteCategoryImage(editCategoryData.currentImageUrl).catch((error) => {
              console.error("Error al eliminar imagen anterior:", error)
            })
          }
        } catch (error: any) {
          toast({
            title: "Error al subir imagen",
            description: error.message || "No se pudo subir la imagen. Intenta nuevamente.",
            variant: "destructive",
          })
          setIsUploadingEditImage(false)
          return
        } finally {
          setIsUploadingEditImage(false)
        }
      } else if (!editCategoryData.currentImageUrl && editCategoryData.image === null) {
        // Si se eliminó la imagen (currentImageUrl es null y no hay nueva imagen)
        finalImageUrl = null
        // Eliminar imagen anterior si existe
        if (editCategoryData.currentImageUrl) {
          deleteCategoryImage(editCategoryData.currentImageUrl).catch((error) => {
            console.error("Error al eliminar imagen anterior:", error)
          })
        }
      }

      const updateData: UpdateCategoriaDto = {
        nombre: editCategoryData.name.trim(),
        descripcion: editCategoryData.description.trim() || null,
        imagenCategoriaUrl: finalImageUrl,
      }

      await updateMutation.mutateAsync({ id: editingCategory.id, data: updateData })
      setIsEditModalOpen(false)
      setEditingCategory(null)
      setEditCategoryData({ name: "", description: "", image: null, currentImageUrl: null })
      setEditImagePreview(null)
      setUploadedEditImageUrl(null)
      setSuccessMessage("Categoría actualizada exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 5000)
    } catch (error) {
      // Si hubo un error y se subió una imagen nueva, eliminarla
      if (uploadedEditImageUrl) {
        deleteCategoryImage(uploadedEditImageUrl).catch((error) => {
          console.error("Error al eliminar imagen de Supabase:", error)
        })
      }
      // Los errores ya se manejan en los hooks
    }
  }

  const handleCancelEditCategory = () => {
    if (uploadedEditImageUrl) {
      deleteCategoryImage(uploadedEditImageUrl).catch((error) => {
        console.error("Error al eliminar imagen de Supabase:", error)
      })
    }
    setIsEditModalOpen(false)
    setEditingCategory(null)
    setEditCategoryData({ name: "", description: "", image: null, currentImageUrl: null })
    setEditImagePreview(null)
    setUploadedEditImageUrl(null)
  }

  // Verificar si hay cambios en los datos de edición
  const hasEditChanges = useMemo(() => {
    if (!editingCategory) return false

    // Comparar nombre
    const nameChanged = editCategoryData.name.trim() !== editingCategory.nombre.trim()

    // Comparar descripción (manejar null/undefined)
    const originalDesc = editingCategory.descripcion || ""
    const currentDesc = editCategoryData.description || ""
    const descriptionChanged = originalDesc.trim() !== currentDesc.trim()

    // Comparar imagen
    const originalImageUrl = editingCategory.imagenCategoriaUrl || null
    const currentImageUrl = editCategoryData.currentImageUrl || null
    
    // Si hay una nueva imagen seleccionada, hay cambios
    const hasNewImage = editCategoryData.image !== null
    
    // Si currentImageUrl es diferente de la original, la imagen fue eliminada o cambiada
    // También verificar si se eliminó la imagen (original tenía imagen pero currentImageUrl es null)
    const imageChanged = hasNewImage || currentImageUrl !== originalImageUrl

    return nameChanged || descriptionChanged || imageChanged
  }, [editingCategory, editCategoryData])

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
    deleteMutation.isPending ||
    isUploadingImage ||
    isUploadingEditImage

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <Tags className="mr-3 h-8 w-8 text-camouflage-green-700" />
              Categorías
            </h1>
            <p className="mt-1 text-camouflage-green-600">
              Organiza tus productos por categorías para una mejor gestión.
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
              onClick={() => setIsNewCategoryModalOpen(true)}
              disabled={isLoadingData}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </div>
        </div>

        {/* Tabla de Categorías */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">
                {isLoading ? (
                  "Cargando categorías..."
                ) : (
                  <>
                    Categorías Registradas ({pagination.totalItems.toLocaleString()})
                    {searchTerm && categories.length !== pagination.totalItems && (
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
                            <AlertDialogTitle>Activar categorías seleccionadas</AlertDialogTitle>
                            <AlertDialogDescription>Se activarán {selectedCount} categoría(s).</AlertDialogDescription>
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
                            <AlertDialogTitle>Desactivar categorías seleccionadas</AlertDialogTitle>
                            <AlertDialogDescription>Se desactivarán {selectedCount} categoría(s).</AlertDialogDescription>
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
                            <AlertDialogTitle>Eliminar categorías seleccionadas</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminarán {selectedCount} categoría(s).
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
                  <p className="text-sm text-camouflage-green-600">Cargando categorías...</p>
                </div>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">
                <p>Error al cargar las categorías. Por favor, intenta nuevamente.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                      <TableHead className="w-[36px]">
                        <div className="pl-3">
                          <Checkbox
                            checked={selectedCount === categories.length && categories.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedIds(new Set(categories.map((c) => c.id)))
                              } else {
                                clearSelection()
                              }
                            }}
                            aria-label="Seleccionar todos"
                            disabled={isLoadingData}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="w-[100px] font-semibold text-camouflage-green-700">Imagen</TableHead>
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
                      <TableHead className="w-[160px] font-semibold text-camouflage-green-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-camouflage-green-600">
                          {searchTerm
                            ? "No se encontraron categorías que coincidan con la búsqueda."
                            : "No hay categorías registradas."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => (
                        <TableRow
                          key={category.id}
                          className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
                        >
                          <TableCell className="w-[36px]">
                            <div className="pl-3">
                              <Checkbox
                                checked={isSelected(category.id)}
                                onCheckedChange={() => toggleSelect(category.id)}
                                aria-label={`Seleccionar ${category.nombre}`}
                                disabled={isLoadingData}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="w-[100px]">
                            {category.imagenCategoriaUrl ? (
                              <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                                <Image
                                  src={category.imagenCategoriaUrl}
                                  alt={category.nombre}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-camouflage-green-100">
                                <ImageIcon className="h-6 w-6 text-camouflage-green-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="w-[200px]">
                            <button
                              onClick={() => router.push(`/inventory/categories/${category.id}`)}
                              className="text-left font-medium text-camouflage-green-900 transition-colors hover:text-camouflage-green-700 hover:underline"
                              disabled={isLoadingData}
                            >
                              {category.nombre}
                            </button>
                          </TableCell>
                          <TableCell className="w-[300px]">
                            <div
                              className="max-w-[280px] truncate text-sm text-camouflage-green-600"
                              title={category.descripcion || ""}
                            >
                              {category.descripcion || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="w-[160px]">
                            <div className="flex items-center justify-start gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                                title="Ver detalles"
                                onClick={() => router.push(`/inventory/categories/${category.id}`)}
                                disabled={isLoadingData}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                                title="Editar"
                                onClick={() => handleEditCategory(category)}
                                disabled={isLoadingData}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                                title={category.activo ? "Desactivar" : "Activar"}
                                onClick={() => toggleCategoryStatus(category.id)}
                                disabled={isLoadingData}
                              >
                                {category.activo ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
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
                                    <AlertDialogTitle>Eliminar categoría</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará "{category.nombre}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => deleteCategory(category.id)}
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

        {/* Modal para nueva categoría */}
        <Modal isOpen={isNewCategoryModalOpen} onClose={handleCancelNewCategory} title="Nueva Categoría" size="lg">
          <div className="space-y-4">
            <div className="space-y-1 pt-2.5">
              <Label htmlFor="category-name" className="font-medium text-camouflage-green-700">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="category-name"
                type="text"
                placeholder="Ingresa el nombre de la categoría"
                value={newCategoryData.name}
                onChange={(e) => handleNewCategoryInputChange("name", e.target.value)}
                className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                disabled={createMutation.isPending || isUploadingImage}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description" className="font-medium text-camouflage-green-700">
                Descripción
              </Label>
              <Textarea
                id="category-description"
                placeholder="Ingresa una descripción de la categoría"
                value={newCategoryData.description}
                onChange={(e) => handleNewCategoryInputChange("description", e.target.value)}
                className="scrollbar-thin scrollbar-thumb-camouflage-green-300 scrollbar-track-gray-100 min-h-[80px] resize-none border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                style={{
                  outline: "none",
                  boxShadow: "none",
                }}
                onFocus={(e) => {
                  e.target.style.outline = "none"
                  e.target.style.boxShadow = "none"
                }}
                disabled={createMutation.isPending || isUploadingImage}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-camouflage-green-700">Imagen de la categoría</Label>
              <div
                className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  isImageDragOver
                    ? "border-camouflage-green-500 bg-camouflage-green-50"
                    : "hover:bg-camouflage-green-25 border-camouflage-green-300 hover:border-camouflage-green-400"
                }`}
                onClick={handleImageAreaClick}
                onDragOver={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
              >
                {imagePreview || uploadedImageUrl ? (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                        <Image
                          src={imagePreview || uploadedImageUrl || ""}
                          alt="Vista previa"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    {newCategoryData.image && (
                      <div className="flex items-center justify-center gap-2 text-camouflage-green-700">
                        <ImageIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">{newCategoryData.image.name}</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage()
                      }}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      disabled={createMutation.isPending || isUploadingImage}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Eliminar imagen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center gap-3">
                      <CloudUpload className="h-8 w-8 text-camouflage-green-500" />
                    </div>
                    <p className="text-sm font-medium text-camouflage-green-600">
                      Arrastra una imagen aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-camouflage-green-500">JPG, PNG, GIF (máximo 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancelNewCategory}
                className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                disabled={createMutation.isPending || isUploadingImage}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveNewCategory} variant="primary" disabled={createMutation.isPending || isUploadingImage}>
                {createMutation.isPending || isUploadingImage ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal para editar categoría */}
        <Modal isOpen={isEditModalOpen} onClose={handleCancelEditCategory} title="Editar Categoría" size="lg">
          <div className="space-y-4">
            <div className="space-y-1 pt-2.5">
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
                disabled={updateMutation.isPending || isUploadingEditImage}
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
                disabled={updateMutation.isPending || isUploadingEditImage}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-camouflage-green-700">Imagen de la categoría</Label>
              <div
                className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  isEditImageDragOver
                    ? "border-camouflage-green-500 bg-camouflage-green-50"
                    : "hover:bg-camouflage-green-25 border-camouflage-green-300 hover:border-camouflage-green-400"
                }`}
                onClick={handleEditImageAreaClick}
                onDragOver={handleEditImageDragOver}
                onDragLeave={handleEditImageDragLeave}
                onDrop={handleEditImageDrop}
              >
                {editImagePreview || editCategoryData.currentImageUrl ? (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                        <Image
                          src={editImagePreview || editCategoryData.currentImageUrl || ""}
                          alt="Vista previa"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    {editCategoryData.image && (
                      <div className="flex items-center justify-center gap-2 text-camouflage-green-700">
                        <ImageIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">{editCategoryData.image.name}</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeEditImage()
                      }}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      disabled={updateMutation.isPending || isUploadingEditImage}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Eliminar imagen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center gap-3">
                      <CloudUpload className="h-8 w-8 text-camouflage-green-500" />
                    </div>
                    <p className="text-sm font-medium text-camouflage-green-600">
                      Arrastra una imagen aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-camouflage-green-500">JPG, PNG, GIF (máximo 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancelEditCategory}
                className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                disabled={updateMutation.isPending || isUploadingEditImage}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEditCategory}
                variant="primary"
                disabled={updateMutation.isPending || isUploadingEditImage || !hasEditChanges}
              >
                {updateMutation.isPending || isUploadingEditImage ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Toast de error personalizado */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              {errorMessage || "No se puede desactivar la categoría porque tiene productos asignados."}
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
