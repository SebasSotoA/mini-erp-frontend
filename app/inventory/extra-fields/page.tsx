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
import { useMemo, useState } from "react"

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

const initialExtraFields = [
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

export default function ExtraFields() {
  const router = useRouter()
  const { toast } = useToast()

  // Estado para los campos adicionales
  const [extraFields, setExtraFields] = useState(initialExtraFields)

  // Estado para el modal de nuevo campo
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false)
  const [newFieldData, setNewFieldData] = useState({
    name: "",
    type: "texto",
    defaultValue: "",
    description: "",
    isRequired: false,
  })

  // Estado para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<(typeof extraFields)[0] | null>(null)
  const [editFieldData, setEditFieldData] = useState({
    name: "",
    type: "texto",
    defaultValue: "",
    description: "",
    isRequired: false,
  })

  // Estado para búsqueda
  const [searchTerm, setSearchTerm] = useState("")

  // Estado para selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedCount = selectedIds.size
  const isSelected = (id: string) => selectedIds.has(id)
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())

  // Lógica para determinar el estado de los botones de acciones masivas
  const selectedFields = extraFields.filter((f) => selectedIds.has(f.id))
  const allSelectedActive = selectedFields.length > 0 && selectedFields.every((f) => f.isActive)
  const allSelectedInactive = selectedFields.length > 0 && selectedFields.every((f) => !f.isActive)
  const hasMixedStates = selectedFields.length > 0 && !allSelectedActive && !allSelectedInactive

  // Estado para ordenamiento
  const [sortField, setSortField] = useState<"name" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (field: "name") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    // Limpiar selección al cambiar ordenamiento
    clearSelection()
  }

  // Función para filtrar y ordenar los campos adicionales
  const filteredAndSortedFields = useMemo(() => {
    let filtered = extraFields

    // Aplicar filtro de búsqueda por nombre
    if (searchTerm.trim()) {
      filtered = extraFields.filter((field) => field.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Aplicar ordenamiento
    if (!sortField) return filtered

    return [...filtered].sort((a, b) => {
      const aValue = a[sortField].toLowerCase()
      const bValue = b[sortField].toLowerCase()

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })
  }, [extraFields, sortField, sortDirection, searchTerm])

  // Acciones masivas
  const bulkSetActive = (isActive: boolean) => {
    if (selectedIds.size === 0) return
    setExtraFields((prevFields) =>
      prevFields.map((field) => (selectedIds.has(field.id) ? { ...field, isActive } : field)),
    )
    toast({
      title: isActive ? "Campos activados" : "Campos desactivados",
      description: `${selectedIds.size} campo(s) actualizado(s).`,
    })
    clearSelection()
  }

  const bulkDelete = () => {
    if (selectedIds.size === 0) return
    setExtraFields((prevFields) => prevFields.filter((field) => !selectedIds.has(field.id)))
    toast({
      title: "Campos eliminados",
      description: `${selectedIds.size} campo(s) eliminado(s).`,
    })
    clearSelection()
  }

  // Función para cambiar estado de un campo
  const toggleFieldStatus = (id: string) => {
    setExtraFields((prevFields) =>
      prevFields.map((field) => {
        if (field.id === id) {
          const updatedField = { ...field, isActive: !field.isActive }
          toast({
            title: updatedField.isActive ? "Campo activado" : "Campo desactivado",
            description: `"${field.name}" ha sido ${updatedField.isActive ? "activado" : "desactivado"}.`,
          })
          return updatedField
        }
        return field
      }),
    )
  }

  // Función para eliminar un campo
  const deleteField = (id: string) => {
    const field = extraFields.find((f) => f.id === id)
    if (field) {
      setExtraFields((prevFields) => prevFields.filter((f) => f.id !== id))
      toast({
        title: "Campo eliminado",
        description: `"${field.name}" ha sido eliminado.`,
      })
    }
  }

  // Funciones para el modal de nuevo campo
  const handleNewFieldInputChange = (field: string, value: string | boolean) => {
    setNewFieldData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveNewField = () => {
    if (!newFieldData.name.trim()) {
      toast({
        title: "Campo obligatorio",
        description: "El nombre del campo es obligatorio.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Campo creado",
      description: `"${newFieldData.name}" ha sido creado exitosamente.`,
    })

    // Limpiar el formulario y cerrar el modal
    setNewFieldData({ name: "", type: "texto", defaultValue: "", description: "", isRequired: false })
    setIsNewFieldModalOpen(false)
  }

  const handleCancelNewField = () => {
    setNewFieldData({ name: "", type: "texto", defaultValue: "", description: "", isRequired: false })
    setIsNewFieldModalOpen(false)
  }

  // Funciones para el modal de edición
  const handleEditField = (field: (typeof extraFields)[0]) => {
    setEditingField(field)
    setEditFieldData({
      name: field.name,
      type: field.type,
      defaultValue: field.defaultValue,
      description: field.description,
      isRequired: field.isRequired,
    })
    setIsEditModalOpen(true)
  }

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
    setEditingField(null)
  }

  const handleCancelEditField = () => {
    if (editingField) {
      setEditFieldData({
        name: editingField.name,
        type: editingField.type,
        defaultValue: editingField.defaultValue,
        description: editingField.description,
        isRequired: editingField.isRequired,
      })
    }
    setIsEditModalOpen(false)
    setEditingField(null)
  }

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
            <div className="flex h-10 items-center gap-2 rounded-lg border border-camouflage-green-300 bg-white px-3 shadow-sm">
              <Search className="h-4 w-4 text-camouflage-green-600" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  // Limpiar selección al filtrar
                  clearSelection()
                }}
                className="h-full w-64 border-0 bg-transparent text-sm placeholder:text-gray-400 focus:outline-none focus:ring-0"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    // Limpiar selección al limpiar filtro
                    clearSelection()
                  }}
                  className="h-4 w-4 p-0 text-camouflage-green-600 hover:bg-transparent hover:text-camouflage-green-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button
              size="md2"
              className="bg-camouflage-green-700 pl-4 pr-4 text-white hover:bg-camouflage-green-800"
              onClick={() => setIsNewFieldModalOpen(true)}
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
                Campos Registrados ({filteredAndSortedFields.length.toLocaleString()})
                {searchTerm && extraFields.length !== filteredAndSortedFields.length && (
                  <span className="ml-2 text-sm font-normal text-camouflage-green-600">
                    de {extraFields.length.toLocaleString()} total
                  </span>
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
                            disabled={allSelectedInactive}
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
                            setSelectedIds(new Set())
                          }
                        }}
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
                  <TableHead className="w-[300px] font-semibold text-camouflage-green-700">Descripción</TableHead>
                  <TableHead className="w-[150px] font-semibold text-camouflage-green-700">Tipo</TableHead>
                  <TableHead className="w-[160px] font-semibold text-camouflage-green-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedFields.map((field) => (
                  <TableRow
                    key={field.id}
                    className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
                  >
                    <TableCell className="w-[36px]">
                      <div className="pl-3">
                        <Checkbox
                          checked={isSelected(field.id)}
                          onCheckedChange={() => toggleSelect(field.id)}
                          aria-label={`Seleccionar ${field.name}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <button
                        onClick={() => router.push(`/inventory/extra-fields/${field.id}`)}
                        className="text-left font-medium text-camouflage-green-900 transition-colors hover:text-camouflage-green-700 hover:underline"
                      >
                        {field.name}
                      </button>
                    </TableCell>
                    <TableCell className="w-[300px]">
                      <div
                        className="max-w-[280px] truncate text-sm text-camouflage-green-600"
                        title={field.description}
                      >
                        {field.description}
                </div>
                    </TableCell>
                    <TableCell className="w-[150px]">
                      <span className="rounded-full bg-camouflage-green-100 px-2 py-1 text-sm font-medium text-camouflage-green-800 capitalize">
                        {field.type}
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
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                          title="Editar"
                          onClick={() => handleEditField(field)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                          title={field.isActive ? "Desactivar" : "Activar"}
                          onClick={() => toggleFieldStatus(field.id)}
                        >
                          {field.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
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
                              <AlertDialogTitle>Eliminar campo</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará "{field.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => {
                                  deleteField(field.id)
                                  setSelectedIds((prev) => {
                                    const next = new Set(prev)
                                    next.delete(field.id)
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
                {filteredAndSortedFields.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Layers className="h-12 w-12 text-camouflage-green-300" />
                        <div>
                          <p className="font-medium text-camouflage-green-600">
                            {searchTerm ? "No se encontraron campos" : "No hay campos registrados"}
                          </p>
                          <p className="mt-1 text-sm text-camouflage-green-500">
                            {searchTerm
                              ? `No se encontraron campos que coincidan con "${searchTerm}"`
                              : "Comienza agregando tu primer campo adicional"}
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-type" className="font-medium text-camouflage-green-700">
              Tipo de Campo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={newFieldData.type}
              onValueChange={(value) => handleNewFieldInputChange("type", value)}
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
            <Input
              id="field-default"
              type="text"
              placeholder="Valor por defecto del campo"
              value={newFieldData.defaultValue}
              onChange={(e) => handleNewFieldInputChange("defaultValue", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            />
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
            />
                </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="field-required"
              checked={newFieldData.isRequired}
              onCheckedChange={(checked) => handleNewFieldInputChange("isRequired", checked as boolean)}
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
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNewField}
              className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
            >
              Guardar
                </Button>
          </div>
        </div>
      </Modal>

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
            <Input
              id="edit-field-default"
              type="text"
              placeholder="Valor por defecto del campo"
              value={editFieldData.defaultValue}
              onChange={(e) => handleEditFieldInputChange("defaultValue", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            />
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
