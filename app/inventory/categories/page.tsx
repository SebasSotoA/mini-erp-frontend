"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tags, Plus, Eye, Edit, Power, PowerOff, Trash2, ChevronUp, ChevronDown, X, Search, CloudUpload, Image as ImageIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
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

const initialCategories = [
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

export default function Categories() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Estado para las categorías
  const [categories, setCategories] = useState(initialCategories)
  
  // Estado para el modal de nueva categoría
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false)
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    description: '',
    image: null as File | null
  })
  const [isImageDragOver, setIsImageDragOver] = useState(false)
  
  // Estado para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<typeof categories[0] | null>(null)
  const [editCategoryData, setEditCategoryData] = useState({
    name: '',
    description: '',
    image: null as File | null
  })
  
  // Estado para búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estado para selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedCount = selectedIds.size
  const isSelected = (id: string) => selectedIds.has(id)
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())

  // Lógica para determinar el estado de los botones de acciones masivas
  const selectedCategories = categories.filter(c => selectedIds.has(c.id))
  const allSelectedActive = selectedCategories.length > 0 && selectedCategories.every(c => c.isActive)
  const allSelectedInactive = selectedCategories.length > 0 && selectedCategories.every(c => !c.isActive)
  const hasMixedStates = selectedCategories.length > 0 && !allSelectedActive && !allSelectedInactive
  
  // Estado para ordenamiento
  const [sortField, setSortField] = useState<'name' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  const handleSort = (field: 'name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    // Limpiar selección al cambiar ordenamiento
    clearSelection()
  }
  
  // Función para filtrar y ordenar las categorías
  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories
    
    // Aplicar filtro de búsqueda por nombre
    if (searchTerm.trim()) {
      filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Aplicar ordenamiento
    if (!sortField) return filtered
    
    return [...filtered].sort((a, b) => {
      const aValue = a[sortField].toLowerCase()
      const bValue = b[sortField].toLowerCase()
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })
  }, [categories, sortField, sortDirection, searchTerm])
  
  // Acciones masivas
  const bulkSetActive = (isActive: boolean) => {
    if (selectedIds.size === 0) return
    setCategories(prevCategories => 
      prevCategories.map(category => 
        selectedIds.has(category.id) ? { ...category, isActive } : category
      )
    )
    toast({ 
      title: isActive ? "Categorías activadas" : "Categorías desactivadas", 
      description: `${selectedIds.size} categoría(s) actualizadas.` 
    })
    clearSelection()
  }
  
  const bulkDelete = () => {
    if (selectedIds.size === 0) return
    setCategories(prevCategories => 
      prevCategories.filter(category => !selectedIds.has(category.id))
    )
    toast({ 
      title: "Categorías eliminadas", 
      description: `${selectedIds.size} categoría(s) eliminadas.` 
    })
    clearSelection()
  }
  
  // Función para cambiar estado de una categoría
  const toggleCategoryStatus = (id: string) => {
    setCategories(prevCategories => 
      prevCategories.map(category => {
        if (category.id === id) {
          const updatedCategory = { ...category, isActive: !category.isActive }
          toast({ 
            title: updatedCategory.isActive ? "Categoría activada" : "Categoría desactivada", 
            description: `"${category.name}" ha sido ${updatedCategory.isActive ? 'activada' : 'desactivada'}.` 
          })
          return updatedCategory
        }
        return category
      })
    )
  }
  
  // Función para eliminar una categoría
  const deleteCategory = (id: string) => {
    const category = categories.find(c => c.id === id)
    if (category) {
      setCategories(prevCategories => 
        prevCategories.filter(c => c.id !== id)
      )
      toast({ 
        title: "Categoría eliminada", 
        description: `"${category.name}" ha sido eliminada.` 
      })
    }
  }
  
  // Funciones para el modal de nueva categoría
  const handleNewCategoryInputChange = (field: string, value: string) => {
    setNewCategoryData(prev => ({ ...prev, [field]: value }))
  }

  // Funciones para manejar imagen
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
    if (file && file.type.startsWith('image/')) {
      setNewCategoryData(prev => ({ ...prev, image: file }))
    } else {
      toast({
        title: "Formato no válido",
        description: "Por favor, selecciona un archivo de imagen válido.",
        variant: "destructive",
      })
    }
  }

  const handleImageAreaClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setNewCategoryData(prev => ({ ...prev, image: file }))
      }
    }
    input.click()
  }

  const removeImage = () => {
    setNewCategoryData(prev => ({ ...prev, image: null }))
  }
  
  const handleSaveNewCategory = () => {
    if (!newCategoryData.name.trim()) {
      toast({
        title: "Campo obligatorio",
        description: "El nombre de la categoría es obligatorio.",
        variant: "destructive",
      })
      return
    }
    
    toast({
      title: "Categoría creada",
      description: `"${newCategoryData.name}" ha sido creada exitosamente.`,
    })
    
    // Limpiar el formulario y cerrar el modal
    setNewCategoryData({ name: '', description: '', image: null })
    setIsNewCategoryModalOpen(false)
  }
  
  const handleCancelNewCategory = () => {
    setNewCategoryData({ name: '', description: '', image: null })
    setIsNewCategoryModalOpen(false)
  }

  // Funciones para el modal de edición
  const handleEditCategory = (category: typeof categories[0]) => {
    setEditingCategory(category)
    setEditCategoryData({
      name: category.name,
      description: category.description,
      image: null
    })
    setIsEditModalOpen(true)
  }

  const handleEditCategoryInputChange = (field: keyof typeof editCategoryData, value: string) => {
    setEditCategoryData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveEditCategory = () => {
    if (!editCategoryData.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" })
      return
    }
    
    toast({ 
      title: "Categoría actualizada", 
      description: `"${editCategoryData.name}" fue actualizada exitosamente.` 
    })
    setIsEditModalOpen(false)
    setEditingCategory(null)
  }

  const handleCancelEditCategory = () => {
    if (editingCategory) {
      setEditCategoryData({
        name: editingCategory.name,
        description: editingCategory.description,
        image: null
      })
    }
    setIsEditModalOpen(false)
    setEditingCategory(null)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-camouflage-green-900 flex items-center">
              <Tags className="h-8 w-8 mr-3 text-camouflage-green-700" />
              Categorías
            </h1>
            <p className="text-camouflage-green-600 mt-1">Organiza tus productos por categorías para una mejor gestión.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Barra de búsqueda compacta */}
            <div className="flex items-center gap-2 bg-white border border-camouflage-green-300 rounded-lg px-3 h-10 shadow-sm">
              <Search className="h-4 w-4 text-camouflage-green-600" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  // Limpiar selección al filtrar
                  clearSelection()
                }}
                className="w-64 border-0 focus:ring-0 focus:outline-none bg-transparent placeholder:text-gray-400 text-sm h-full"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    // Limpiar selección al limpiar filtro
                    clearSelection()
                  }}
                  className="h-4 w-4 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button 
              size="md2" 
              className="bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white pl-4 pr-4"
              onClick={() => setIsNewCategoryModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </div>
        </div>

        {/* Tabla de Categorías */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">
                Categorías Registradas ({filteredAndSortedCategories.length.toLocaleString()})
                {searchTerm && categories.length !== filteredAndSortedCategories.length && (
                  <span className="text-sm font-normal text-camouflage-green-600 ml-2">
                    de {categories.length.toLocaleString()} total
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <div className="flex items-center gap-2 bg-camouflage-green-50/60 border border-camouflage-green-200 rounded-lg px-2 py-1 text-sm text-camouflage-green-800">
                    <span>{selectedCount} seleccionado(s)</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100"
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
                            className="h-8 px-2 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100"
                            disabled={allSelectedActive}
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
                            className="h-8 px-2 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100"
                            disabled={allSelectedInactive}
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
                          <Button size="sm" variant="outline" className="h-8 px-2 border-camouflage-green-300 text-red-700 hover:bg-red-50 hover:border-red-300">
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar categorías seleccionadas</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminarán {selectedCount} categoría(s).</AlertDialogDescription>
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
                <TableRow className="hover:bg-transparent border-camouflage-green-200">
                  <TableHead className="w-[36px]">
                    <div className="pl-3">
                      <Checkbox 
                        checked={selectedCount === categories.length && categories.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds(new Set(categories.map(c => c.id)))
                          } else {
                            setSelectedIds(new Set())
                          }
                        }}
                        aria-label="Seleccionar todos"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[200px] text-camouflage-green-700 font-semibold">
                    <div>
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group"
                      >
                        Nombre
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronUp className={`h-3 w-3 ${sortField === 'name' && sortDirection === 'asc' ? 'text-camouflage-green-900' : ''}`} />
                          <ChevronDown className={`h-3 w-3 ${sortField === 'name' && sortDirection === 'desc' ? 'text-camouflage-green-900' : ''}`} />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[400px] text-camouflage-green-700 font-semibold">
                    Descripción
                  </TableHead>
                  <TableHead className="w-[160px] text-camouflage-green-700 font-semibold">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCategories.map((category) => (
                  <TableRow 
                    key={category.id}
                    className="border-camouflage-green-100 hover:bg-camouflage-green-50/50 transition-colors"
                  >
                    <TableCell className="w-[36px]">
                      <div className="pl-3">
                        <Checkbox 
                          checked={isSelected(category.id)} 
                          onCheckedChange={() => toggleSelect(category.id)} 
                          aria-label={`Seleccionar ${category.name}`} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <button
                        onClick={() => router.push(`/inventory/categories/${category.id}`)}
                        className="font-medium text-camouflage-green-900 hover:text-camouflage-green-700 hover:underline transition-colors text-left"
                      >
                        {category.name}
                      </button>
                    </TableCell>
                    <TableCell className="w-[400px]">
                      <div className="text-camouflage-green-600 text-sm max-w-[380px] truncate" title={category.description}>
                        {category.description}
                      </div>
                    </TableCell>
                    <TableCell className="w-[160px]">
                      <div className="flex items-center justify-start gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 border-camouflage-green-300 hover:border-camouflage-green-400"
                          title="Ver detalles"
                          onClick={() => router.push(`/inventory/categories/${category.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 border-camouflage-green-300 hover:border-camouflage-green-400"
                          title="Editar"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-camouflage-green-300 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 hover:border-camouflage-green-400"
                          title={category.isActive ? "Desactivar" : "Activar"}
                          onClick={() => toggleCategoryStatus(category.id)}
                        >
                          {category.isActive ? (
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
                              className="h-8 w-8 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 border-camouflage-green-300 hover:border-camouflage-green-400"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
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
                                  deleteCategory(category.id)
                                  setSelectedIds(prev => {
                                    const next = new Set(prev)
                                    next.delete(category.id)
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
                {filteredAndSortedCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Tags className="h-12 w-12 text-camouflage-green-300" />
                        <div>
                          <p className="text-camouflage-green-600 font-medium">
                            {searchTerm ? 'No se encontraron categorías' : 'No hay categorías registradas'}
                          </p>
                          <p className="text-camouflage-green-500 text-sm mt-1">
                            {searchTerm 
                              ? `No se encontraron categorías que coincidan con "${searchTerm}"`
                              : 'Comienza agregando tu primera categoría'
                            }
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal para nueva categoría */}
      <Modal
        isOpen={isNewCategoryModalOpen}
        onClose={handleCancelNewCategory}
        title="Nueva Categoría"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name" className="text-camouflage-green-700 font-medium">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="category-name"
              type="text"
              placeholder="Ingresa el nombre de la categoría"
              value={newCategoryData.name}
              onChange={(e) => handleNewCategoryInputChange('name', e.target.value)}
              className="border-camouflage-green-300 focus:ring-camouflage-green-500 focus:border-camouflage-green-500 bg-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description" className="text-camouflage-green-700 font-medium">
              Descripción
            </Label>
            <Textarea
              id="category-description"
              placeholder="Ingresa una descripción de la categoría"
              value={newCategoryData.description}
              onChange={(e) => handleNewCategoryInputChange('description', e.target.value)}
              className="border-camouflage-green-300 focus:ring-camouflage-green-500 focus:border-camouflage-green-500 bg-white placeholder:text-gray-400 min-h-[80px] resize-none scrollbar-thin scrollbar-thumb-camouflage-green-300 scrollbar-track-gray-100"
              style={{
                outline: 'none',
                boxShadow: 'none'
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-camouflage-green-700 font-medium">
              Imagen de la categoría
            </Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isImageDragOver 
                  ? 'border-camouflage-green-500 bg-camouflage-green-50' 
                  : 'border-camouflage-green-300 hover:border-camouflage-green-400 hover:bg-camouflage-green-25'
              }`}
              onClick={handleImageAreaClick}
              onDragOver={handleImageDragOver}
              onDragLeave={handleImageDragLeave}
              onDrop={handleImageDrop}
            >
              {newCategoryData.image ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <img
                      src={URL.createObjectURL(newCategoryData.image)}
                      alt="Vista previa"
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-camouflage-green-700">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{newCategoryData.image.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage()
                    }}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar imagen
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center gap-3">
                    <CloudUpload className="h-8 w-8 text-camouflage-green-500" />
                  </div>
                  <p className="text-sm text-camouflage-green-600 font-medium">
                    Arrastra una imagen aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-camouflage-green-500">
                    JPG, PNG, GIF (máximo 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelNewCategory}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNewCategory}
              className="bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white"
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para editar categoría */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCancelEditCategory}
        title="Editar Categoría"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-category-name" className="text-camouflage-green-700 font-medium">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-category-name"
              type="text"
              placeholder="Ingresa el nombre de la categoría"
              value={editCategoryData.name}
              onChange={(e) => handleEditCategoryInputChange('name', e.target.value)}
              className="border-camouflage-green-300 focus:ring-camouflage-green-500 focus:border-camouflage-green-500 bg-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category-description" className="text-camouflage-green-700 font-medium">
              Descripción
            </Label>
            <Textarea
              id="edit-category-description"
              placeholder="Ingresa una descripción de la categoría"
              value={editCategoryData.description}
              onChange={(e) => handleEditCategoryInputChange('description', e.target.value)}
              className="border-camouflage-green-300 focus:ring-camouflage-green-500 focus:border-camouflage-green-500 bg-white placeholder:text-gray-400 min-h-[80px] resize-none scrollbar-thin scrollbar-thumb-camouflage-green-300 scrollbar-track-gray-100"
              style={{
                outline: 'none',
                boxShadow: 'none'
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none'
                e.target.style.boxShadow = 'none'
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
              className="bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white"
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
