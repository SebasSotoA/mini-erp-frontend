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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const initialWarehouses = [
  {
    id: "1",
    name: "Bodega Principal",
    location: "Calle Mayor 123, Madrid, España",
    observations: "Bodega principal para almacenamiento de productos de alta rotación",
    isActive: true,
  },
  {
    id: "2",
    name: "Bodega Norte",
    location: "Avenida Diagonal 456, Barcelona, España",
    observations: "Almacén especializado en productos electrónicos y frágiles",
    isActive: true,
  },
  {
    id: "3",
    name: "Bodega Sur",
    location: "Plaza de España 789, Sevilla, España",
    observations: "En mantenimiento - Reabrirá próximamente",
    isActive: false,
  },
  {
    id: "4",
    name: "Centro de Distribución",
    location: "Polígono Industrial Norte, Valencia, España",
    observations: "Centro de distribución regional con acceso directo a autopista",
    isActive: true,
  },
  {
    id: "5",
    name: "Almacén Temporal",
    location: "Zona Portuaria, Bilbao, España",
    observations: "Almacén temporal para productos en tránsito",
    isActive: false,
  },
]

export default function Warehouses() {
  const router = useRouter()
  const { toast } = useToast()

  // Estado para las bodegas
  const [warehouses, setWarehouses] = useState(initialWarehouses)

  // Estado para el modal de nueva bodega
  const [isNewWarehouseModalOpen, setIsNewWarehouseModalOpen] = useState(false)
  const [newWarehouseData, setNewWarehouseData] = useState({
    name: "",
    location: "",
    observations: "",
  })

  // Estado para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<(typeof warehouses)[0] | null>(null)
  const [editWarehouseData, setEditWarehouseData] = useState({
    name: "",
    location: "",
    observations: "",
  })

  // Estado para búsqueda
  const [searchTerm, setSearchTerm] = useState("")

  // Estado para selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedCount = selectedIds.size
  console.log("Current selectedCount:", selectedCount, "selectedIds:", Array.from(selectedIds))
  const isSelected = (id: string) => selectedIds.has(id)
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        console.log("Removing from selection:", id)
        next.delete(id)
      } else {
        console.log("Adding to selection:", id)
        next.add(id)
      }
      console.log("New selectedIds:", Array.from(next))
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())

  // Lógica para determinar el estado de los botones de acciones masivas
  const selectedWarehouses = warehouses.filter((w) => selectedIds.has(w.id))
  const allSelectedActive = selectedWarehouses.length > 0 && selectedWarehouses.every((w) => w.isActive)
  const allSelectedInactive = selectedWarehouses.length > 0 && selectedWarehouses.every((w) => !w.isActive)
  const hasMixedStates = selectedWarehouses.length > 0 && !allSelectedActive && !allSelectedInactive

  // Estado para ordenamiento
  const [sortField, setSortField] = useState<"name" | "location" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (field: "name" | "location") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    // Limpiar selección al cambiar ordenamiento
    clearSelection()
  }

  // Función para filtrar y ordenar las bodegas
  const filteredAndSortedWarehouses = useMemo(() => {
    let filtered = warehouses

    // Aplicar filtro de búsqueda por nombre
    if (searchTerm.trim()) {
      filtered = warehouses.filter((warehouse) => warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
  }, [warehouses, sortField, sortDirection, searchTerm])

  // Acciones masivas
  const bulkSetActive = (isActive: boolean) => {
    console.log("bulkSetActive called with:", { isActive, selectedIds: Array.from(selectedIds) })
    const currentSelectedIds = selectedIds
    if (currentSelectedIds.size === 0) return
    setWarehouses((prevWarehouses) => {
      console.log(
        "Updating warehouses:",
        prevWarehouses.map((w) => ({ id: w.id, name: w.name, isActive: w.isActive })),
      )
      return prevWarehouses.map((warehouse) =>
        currentSelectedIds.has(warehouse.id) ? { ...warehouse, isActive } : warehouse,
      )
    })
    toast({
      title: isActive ? "Bodegas activadas" : "Bodegas desactivadas",
      description: `${currentSelectedIds.size} bodega(s) actualizadas.`,
    })
    clearSelection()
  }

  const bulkDelete = () => {
    console.log("bulkDelete called with selectedIds:", Array.from(selectedIds))
    const currentSelectedIds = selectedIds
    if (currentSelectedIds.size === 0) return
    setWarehouses((prevWarehouses) => {
      console.log(
        "Deleting warehouses:",
        prevWarehouses.filter((w) => currentSelectedIds.has(w.id)).map((w) => ({ id: w.id, name: w.name })),
      )
      return prevWarehouses.filter((warehouse) => !currentSelectedIds.has(warehouse.id))
    })
    toast({
      title: "Bodegas eliminadas",
      description: `${currentSelectedIds.size} bodega(s) eliminadas.`,
    })
    clearSelection()
  }

  // Función para cambiar estado de una bodega
  const toggleWarehouseStatus = (id: string) => {
    setWarehouses((prevWarehouses) =>
      prevWarehouses.map((warehouse) => {
        if (warehouse.id === id) {
          const updatedWarehouse = { ...warehouse, isActive: !warehouse.isActive }
          toast({
            title: updatedWarehouse.isActive ? "Bodega activada" : "Bodega desactivada",
            description: `"${warehouse.name}" ha sido ${updatedWarehouse.isActive ? "activada" : "desactivada"}.`,
          })
          return updatedWarehouse
        }
        return warehouse
      }),
    )
  }

  // Función para eliminar una bodega
  const deleteWarehouse = (id: string) => {
    const warehouse = warehouses.find((w) => w.id === id)
    if (warehouse) {
      setWarehouses((prevWarehouses) => prevWarehouses.filter((w) => w.id !== id))
      toast({
        title: "Bodega eliminada",
        description: `"${warehouse.name}" ha sido eliminada.`,
      })
    }
  }

  // Funciones para el modal de nueva bodega
  const handleNewWarehouseInputChange = (field: string, value: string) => {
    setNewWarehouseData((prev) => ({ ...prev, [field]: value }))
  }

  // Debug: verificar el estado inicial
  console.log("Estado inicial de newWarehouseData:", newWarehouseData)

  const handleSaveNewWarehouse = () => {
    if (!newWarehouseData.name.trim()) {
      toast({
        title: "Campo obligatorio",
        description: "El nombre de la bodega es obligatorio.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Bodega creada",
      description: `"${newWarehouseData.name}" ha sido creada exitosamente.`,
    })

    // Limpiar el formulario y cerrar el modal
    setNewWarehouseData({ name: "", location: "", observations: "" })
    setIsNewWarehouseModalOpen(false)
  }

  const handleCancelNewWarehouse = () => {
    setNewWarehouseData({ name: "", location: "", observations: "" })
    setIsNewWarehouseModalOpen(false)
  }

  // Funciones para el modal de edición
  const handleEditWarehouse = (warehouse: (typeof warehouses)[0]) => {
    setEditingWarehouse(warehouse)
    setEditWarehouseData({
      name: warehouse.name,
      location: warehouse.location,
      observations: warehouse.observations,
    })
    setIsEditModalOpen(true)
  }

  const handleEditWarehouseInputChange = (field: keyof typeof editWarehouseData, value: string) => {
    setEditWarehouseData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveEditWarehouse = () => {
    if (!editWarehouseData.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" })
      return
    }

    toast({
      title: "Bodega actualizada",
      description: `"${editWarehouseData.name}" fue actualizada exitosamente.`,
    })
    setIsEditModalOpen(false)
    setEditingWarehouse(null)
  }

  const handleCancelEditWarehouse = () => {
    if (editingWarehouse) {
      setEditWarehouseData({
        name: editingWarehouse.name,
        location: editingWarehouse.location,
        observations: editingWarehouse.observations,
      })
    }
    setIsEditModalOpen(false)
    setEditingWarehouse(null)
  }

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
              onClick={() => setIsNewWarehouseModalOpen(true)}
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
                Bodegas Registradas ({filteredAndSortedWarehouses.length.toLocaleString()})
                {searchTerm && warehouses.length !== filteredAndSortedWarehouses.length && (
                  <span className="ml-2 text-sm font-normal text-camouflage-green-600">
                    de {warehouses.length.toLocaleString()} total
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
                            disabled={allSelectedInactive}
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
            <Table>
              <TableHeader>
                <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                  <TableHead className="w-[36px]">
                    <div className="pl-3">
                      <Checkbox
                        checked={
                          selectedCount === filteredAndSortedWarehouses.length && filteredAndSortedWarehouses.length > 0
                        }
                        onCheckedChange={(checked) => {
                          console.log("Select all checkbox changed:", {
                            checked,
                            filteredAndSortedWarehouses: filteredAndSortedWarehouses.map((w) => ({
                              id: w.id,
                              name: w.name,
                            })),
                          })
                          if (checked) {
                            const newSelection = new Set(filteredAndSortedWarehouses.map((w) => w.id))
                            console.log("Setting selectedIds to:", Array.from(newSelection))
                            setSelectedIds(newSelection)
                          } else {
                            console.log("Clearing selectedIds")
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
                  <TableHead className="w-[300px] font-semibold text-camouflage-green-700">
                    <div>
                      <button
                        onClick={() => handleSort("location")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                      >
                        Dirección
                        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronUp
                            className={`h-3 w-3 ${sortField === "location" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                          />
                          <ChevronDown
                            className={`h-3 w-3 ${sortField === "location" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
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
                {filteredAndSortedWarehouses.map((warehouse) => (
                  <TableRow
                    key={warehouse.id}
                    className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
                  >
                    <TableCell className="w-[36px]">
                      <div className="pl-3">
                        <Checkbox
                          checked={isSelected(warehouse.id)}
                          onCheckedChange={() => {
                            console.log(
                              "Individual checkbox clicked for warehouse:",
                              warehouse.name,
                              "ID:",
                              warehouse.id,
                            )
                            toggleSelect(warehouse.id)
                          }}
                          aria-label={`Seleccionar ${warehouse.name}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <button
                        onClick={() => router.push(`/inventory/warehouses/${warehouse.id}`)}
                        className="text-left font-medium text-camouflage-green-900 transition-colors hover:text-camouflage-green-700 hover:underline"
                      >
                        {warehouse.name}
                      </button>
                    </TableCell>
                    <TableCell className="w-[300px]">
                      <div className="text-sm text-camouflage-green-600">{warehouse.location}</div>
                    </TableCell>
                    <TableCell className="w-[300px]">
                      <div
                        className="max-w-[280px] truncate text-sm text-camouflage-green-600"
                        title={warehouse.observations}
                      >
                        {warehouse.observations}
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
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                          title="Editar"
                          onClick={() => handleEditWarehouse(warehouse)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                          title={warehouse.isActive ? "Desactivar" : "Activar"}
                          onClick={() => toggleWarehouseStatus(warehouse.id)}
                        >
                          {warehouse.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
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
                              <AlertDialogTitle>Eliminar bodega</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará "{warehouse.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => {
                                  deleteWarehouse(warehouse.id)
                                  setSelectedIds((prev) => {
                                    const next = new Set(prev)
                                    next.delete(warehouse.id)
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
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal para nueva bodega */}
      <Modal isOpen={isNewWarehouseModalOpen} onClose={handleCancelNewWarehouse} title="Nueva Bodega">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse-name" className="font-medium text-camouflage-green-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="warehouse-name"
              type="text"
              placeholder="Ingresa el nombre de la bodega"
              value={newWarehouseData.name}
              onChange={(e) => handleNewWarehouseInputChange("name", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
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
              value={newWarehouseData.location}
              onChange={(e) => handleNewWarehouseInputChange("location", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse-observations" className="font-medium text-camouflage-green-700">
              Observaciones
            </Label>
            <Textarea
              id="warehouse-observations"
              placeholder="Ingresa observaciones adicionales sobre la bodega"
              value={newWarehouseData.observations}
              onChange={(e) => handleNewWarehouseInputChange("observations", e.target.value)}
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

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelNewWarehouse}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNewWarehouse}
              className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para editar bodega */}
      <Modal isOpen={isEditModalOpen} onClose={handleCancelEditWarehouse} title="Editar Bodega">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-warehouse-name" className="font-medium text-camouflage-green-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-warehouse-name"
              type="text"
              placeholder="Ingresa el nombre de la bodega"
              value={editWarehouseData.name}
              onChange={(e) => handleEditWarehouseInputChange("name", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-warehouse-location" className="font-medium text-camouflage-green-700">
              Dirección
            </Label>
            <Input
              id="edit-warehouse-location"
              type="text"
              placeholder="Ingresa la dirección de la bodega"
              value={editWarehouseData.location}
              onChange={(e) => handleEditWarehouseInputChange("location", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-warehouse-observations" className="font-medium text-camouflage-green-700">
              Observaciones
            </Label>
            <Textarea
              id="edit-warehouse-observations"
              placeholder="Ingresa observaciones adicionales sobre la bodega"
              value={editWarehouseData.observations}
              onChange={(e) => handleEditWarehouseInputChange("observations", e.target.value)}
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

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelEditWarehouse}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEditWarehouse}
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
