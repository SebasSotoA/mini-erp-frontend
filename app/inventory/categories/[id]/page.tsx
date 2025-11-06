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
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import Image from "next/image"
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
import { useCategoria, useUpdateCategoria, useActivateCategoria, useDeactivateCategoria, useDeleteCategoria, useCategoriaProductos } from "@/hooks/api/use-categorias"
import { useActivateProducto, useDeactivateProducto, useDeleteProducto } from "@/hooks/api/use-productos"
import { ItemFilters, SortField, SortDirection } from "@/lib/types/items"
import type { ProductosQueryParams, CategoriaBackend } from "@/lib/api/types"
import { mapFiltersToQueryParams } from "@/lib/api/utils"
import { uploadCategoryImage, deleteCategoryImage, moveImageToCategoryFolder } from "@/lib/storage/supabase-client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CloudUpload, Image as ImageIcon } from "lucide-react"

export default function CategoryDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { data: category, isLoading: isLoadingCategory, error: categoryError } = useCategoria(id)
  const updateMutation = useUpdateCategoria()
  const activateMutation = useActivateCategoria()
  const deactivateMutation = useDeactivateCategoria()
  const deleteMutation = useDeleteCategoria()

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

  // Estado para errores de regla de negocio
  const [businessError, setBusinessError] = useState<{ title: string; message: string } | null>(null)

  // Estado para toast de error personalizado
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Estado para toast de éxito personalizado
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Construir parámetros para la API de productos de categoría usando la función de mapeo
  const productosParams = useMemo<ProductosQueryParams>(() => {
    return mapFiltersToQueryParams(
      filters,
      { page: currentPage, pageSize: itemsPerPage },
      sortField ? { field: sortField, direction: sortDirection } : undefined,
    )
  }, [currentPage, itemsPerPage, filters, sortField, sortDirection])

  // Obtener productos de la categoría usando el endpoint específico
  const { data: productosData, isLoading: isLoadingProductos } = useCategoriaProductos(id, productosParams)

  const categoryProducts = productosData?.items || []

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
  const selectedProducts = categoryProducts.filter((p) => selectedIds.has(p.id))
  const allSelectedActive = selectedProducts.length > 0 && selectedProducts.every((p) => p.isActive ?? true)
  const allSelectedInactive = selectedProducts.length > 0 && selectedProducts.every((p) => !(p.isActive ?? true))

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setCurrentPage(1) // Reset a la primera página al cambiar ordenamiento
  }

  const handleFilterChange = (field: keyof ItemFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setCurrentPage(1) // Reset a la primera página al cambiar filtros
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

  // Los productos ya vienen filtrados y ordenados del backend
  const totalItems = productosData?.totalCount || 0
  const totalPages = productosData?.totalPages || 0
  const currentProducts = categoryProducts
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
    // TODO: Implementar acciones masivas usando los hooks de productos
    toast({
      title: isActive ? "Ítems activados" : "Ítems desactivados",
      description: `${selectedIds.size} ítem(s) actualizados.`,
    })
    clearSelection()
  }
  const bulkDelete = () => {
    // TODO: Implementar acciones masivas usando los hooks de productos
    toast({ title: "Ítems eliminados", description: `${selectedIds.size} ítem(s) eliminados.` })
    clearSelection()
  }

  // Funciones para el modal de edición
  const handleEditCategory = (category: CategoriaBackend | undefined) => {
    if (!category) return
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
    if (!category) return

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
          finalImageUrl = await moveImageToCategoryFolder(tempImageUrl, category.id)

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

      const updateData = {
        nombre: editCategoryData.name.trim(),
        descripcion: editCategoryData.description.trim() || null,
        imagenCategoriaUrl: finalImageUrl,
      }

      await updateMutation.mutateAsync({ id: category.id, data: updateData })
      setIsEditModalOpen(false)
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
    setEditCategoryData({ name: "", description: "", image: null, currentImageUrl: null })
    setEditImagePreview(null)
    setUploadedEditImageUrl(null)
  }

  const handleActivate = async () => {
    if (!category) return

    // Limpiar error previo
    setBusinessError(null)

    try {
      await activateMutation.mutateAsync(category.id)
    } catch (error: any) {
      // Los errores se manejan en los hooks
    }
  }

  const handleDeactivate = async () => {
    if (!category) return

    // Limpiar error previo
    setBusinessError(null)

    try {
      await deactivateMutation.mutateAsync(category.id)
    } catch (error: any) {
      // Detectar error específico de regla de negocio solo al desactivar
      if (error?.message && error.message.includes("productos asignados")) {
        setBusinessError({
          title: "No se puede desactivar la categoría",
          message: error.message,
        })
      }
      // Los demás errores se manejan en los hooks
    }
  }

  const handleDeleteCategory = async () => {
    if (!category) return

    try {
      // Eliminar imagen de Supabase si existe
      if (category.imagenCategoriaUrl) {
        await deleteCategoryImage(category.imagenCategoriaUrl).catch((error) => {
          console.error("Error al eliminar imagen de Supabase:", error)
        })
      }

      await deleteMutation.mutateAsync(category.id)
      setSuccessMessage("Categoría eliminada exitosamente.")
      setShowSuccessToast(true)
      setTimeout(() => {
        setShowSuccessToast(false)
        router.push("/inventory/categories")
      }, 1500) // Esperar 1.5 segundos para mostrar el toast antes de navegar
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

  if (isLoadingCategory) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-camouflage-green-300 border-t-camouflage-green-600"></div>
            <p className="text-sm text-camouflage-green-600">Cargando categoría...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (categoryError || !category) {
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
              {category.nombre}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="md2"
            onClick={() => router.push("/inventory/categories")}
            className="text-black bg-white hover:text-black border border-gray-700 hover:bg-gray-100"
            title="Volver a Categorías"
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

        {/* Acciones sobre la categoría */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant={category.activo ? "outline" : "primary"}
              className={category.activo ? "border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50" : ""}
              onClick={handleActivate}
              disabled={activateMutation.isPending || deactivateMutation.isPending || category.activo}
            >
              Activar
            </Button>
            <Button
              variant={!category.activo ? "outline" : "primary"}
              className={!category.activo ? "border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50" : ""}
              onClick={handleDeactivate}
              disabled={activateMutation.isPending || deactivateMutation.isPending || !category.activo}
            >
              Desactivar
            </Button>
          </div>
          <Button
            variant="outline"
            className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            onClick={() => handleEditCategory(category)}
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
                  Esta acción no se puede deshacer. Se eliminará "{category.nombre}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteCategory}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Información de la categoría */}
        <Card className="border-camouflage-green-200">
          <CardContent>
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Imagen de la categoría */}
              <div className="flex justify-center lg:justify-start">
                <div className="relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-lg border-2 border-camouflage-green-200 bg-camouflage-green-50">
                  {category.imagenCategoriaUrl ? (
                    <Image
                      src={category.imagenCategoriaUrl}
                      alt={`Imagen de ${category.nombre}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Tags className="h-20 w-20 text-camouflage-green-400" />
                  )}
                </div>
              </div>

              {/* Información de la categoría */}
              <div className="flex-1">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-base text-camouflage-green-600">Nombre</div>
                    <div className="font-medium text-camouflage-green-900">{category.nombre}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-base text-camouflage-green-600">Estado</div>
                    <div className="font-medium text-camouflage-green-900">
                      {category.activo ? "Activa" : "Inactiva"}
                    </div>
                  </div>
                  {category.descripcion && (
                    <div className="space-y-1 sm:col-span-2">
                      <div className="text-base text-camouflage-green-600">Descripción</div>
                      <div className="font-medium text-camouflage-green-900">{category.descripcion}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de ítems asociados a la categoría */}
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
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {/* Fila de filtros con transición suave - SOLO cuando showFilters es true */}
                {showFilters && (
                  <TableRow className="animate-in slide-in-from-top-2 border-camouflage-green-200 bg-camouflage-green-50/30 duration-300 hover:bg-transparent">
                    <TableHead className="w-[36px]">
                      <div className="pl-3">{/* Columna vacía para alinear con checkbox */}</div>
                    </TableHead>
                    <TableHead className="w-[200px] pl-0">
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
                    <TableHead className="w-[120px] pl-0">
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
                    <TableHead className="w-[100px] pl-0">
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
                    <TableHead className="w-[250px] pl-0">
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
                    <TableHead className="w-[120px] text-center">
                      <div className="flex items-center justify-center gap-1 py-3">
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
                    <TableHead className="w-[160px]">
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
                {isLoadingProductos ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
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
                        <div className="font-semibold text-camouflage-green-700">
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(product.price)}
                        </div>
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
                            className={`min-w-[50px] rounded-full px-4 py-2 text-center text-sm font-semibold ${product.stock > product.minStock ? "bg-camouflage-green-100 text-camouflage-green-800" : "bg-red-100 text-red-800"}`}
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
                            onClick={() => {
                              router.push(`/inventory/items/${product.id}/edit`)
                            }}
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
                              if (current) {
                                deactivateProductoMutation.mutate(product.id)
                              } else {
                                activateProductoMutation.mutate(product.id)
                              }
                            }}
                            disabled={activateProductoMutation.isPending || deactivateProductoMutation.isPending}
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
                                  Esta acción no se puede deshacer. Se eliminará permanentemente "{product.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => {
                                    deleteProductoMutation.mutate(product.id, {
                                      onSuccess: () => {
                                        setSelectedIds((prev) => {
                                          const next = new Set(prev)
                                          next.delete(product.id)
                                          return next
                                        })
                                        setSuccessMessage("Item eliminado exitosamente.")
                                        setShowSuccessToast(true)
                                        setTimeout(() => setShowSuccessToast(false), 5000)
                                      },
                                    })
                                  }}
                                  disabled={deleteProductoMutation.isPending}
                                >
                                  {deleteProductoMutation.isPending ? "Eliminando..." : "Eliminar"}
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
                        <Tags className="h-12 w-12 text-camouflage-green-300" />
                        <div>
                          <p className="font-medium text-camouflage-green-600">No hay ítems asociados a esta categoría</p>
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
          {totalPages > 0 && (
            <PaginationControls
              pagination={{ currentPage, itemsPerPage, totalItems, totalPages }}
              onPageChange={(page) => {
                setCurrentPage(page)
                clearSelection()
              }}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n)
                setCurrentPage(1)
                clearSelection()
              }}
            />
          )}
        </Card>
      </div>

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
              disabled={updateMutation.isPending || isUploadingEditImage}
            >
              {updateMutation.isPending || isUploadingEditImage ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast de error personalizado */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              {errorMessage || "No se puede eliminar la categoría porque tiene productos asignados."}
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
