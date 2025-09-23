"use client"

import { useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Warehouse, Plus, MapPin, Eye, Edit, Power, PowerOff, Trash2, ChevronUp, ChevronDown, X, Search } from "lucide-react"
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

const warehouses = [
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
  const { toast } = useToast()
  
  // Estado para el modal de nueva bodega
  const [isNewWarehouseModalOpen, setIsNewWarehouseModalOpen] = useState(false)
  const [newWarehouseData, setNewWarehouseData] = useState({
    name: '',
    location: '',
    observations: ''
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
  
  // Estado para ordenamiento
  const [sortField, setSortField] = useState<'name' | 'location' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  const handleSort = (field: 'name' | 'location') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  // Función para filtrar y ordenar las bodegas
  const filteredAndSortedWarehouses = useMemo(() => {
    let filtered = warehouses
    
    // Aplicar filtro de búsqueda por nombre
    if (searchTerm.trim()) {
      filtered = warehouses.filter(warehouse =>
        warehouse.name.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [warehouses, sortField, sortDirection, searchTerm])
  
  // Acciones masivas
  const bulkSetActive = (isActive: boolean) => {
    if (selectedIds.size === 0) return
    toast({ 
      title: isActive ? "Bodegas activadas" : "Bodegas desactivadas", 
      description: `${selectedIds.size} bodega(s) actualizadas.` 
    })
    clearSelection()
  }
  
  const bulkDelete = () => {
    if (selectedIds.size === 0) return
    toast({ 
      title: "Bodegas eliminadas", 
      description: `${selectedIds.size} bodega(s) eliminadas.` 
    })
    clearSelection()
  }
  
  // Función para cambiar estado de una bodega
  const toggleWarehouseStatus = (id: string) => {
    const warehouse = warehouses.find(w => w.id === id)
    if (warehouse) {
      toast({ 
        title: warehouse.isActive ? "Bodega desactivada" : "Bodega activada", 
        description: `"${warehouse.name}" ha sido ${warehouse.isActive ? 'desactivada' : 'activada'}.` 
      })
    }
  }
  
  // Función para eliminar una bodega
  const deleteWarehouse = (id: string) => {
    const warehouse = warehouses.find(w => w.id === id)
    if (warehouse) {
      toast({ 
        title: "Bodega eliminada", 
        description: `"${warehouse.name}" ha sido eliminada.` 
      })
    }
  }
  
  // Funciones para el modal de nueva bodega
  const handleNewWarehouseInputChange = (field: string, value: string) => {
    setNewWarehouseData(prev => ({ ...prev, [field]: value }))
  }
  
  // Debug: verificar el estado inicial
  console.log('Estado inicial de newWarehouseData:', newWarehouseData)
  
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
    setNewWarehouseData({ name: '', location: '', observations: '' })
    setIsNewWarehouseModalOpen(false)
  }
  
  const handleCancelNewWarehouse = () => {
    setNewWarehouseData({ name: '', location: '', observations: '' })
    setIsNewWarehouseModalOpen(false)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-camouflage-green-900 flex items-center">
              <Warehouse className="h-8 w-8 mr-3 text-camouflage-green-700" />
              Bodegas
            </h1>
            <p className="text-camouflage-green-600 mt-1">Gestiona tu inventario en diferentes lugares de almacenamiento y distribución.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Barra de búsqueda compacta */}
            <div className="flex items-center gap-2 bg-white border border-camouflage-green-300 rounded-lg px-3 h-10 shadow-sm">
              <Search className="h-4 w-4 text-camouflage-green-600" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 border-0 focus:ring-0 focus:outline-none bg-transparent placeholder:text-gray-400 text-sm h-full"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="h-4 w-4 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button 
              size="md2" 
              className="bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white pl-4 pr-4"
              onClick={() => setIsNewWarehouseModalOpen(true)}
            >
            <Plus className="h-4 w-4 mr-2" />
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
                  <span className="text-sm font-normal text-camouflage-green-600 ml-2">
                    de {warehouses.length.toLocaleString()} total
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
                          <Button size="sm" variant="outline" className="h-8 px-2 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100">
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
                          <Button size="sm" variant="outline" className="h-8 px-2 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100">
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
                          <Button size="sm" variant="outline" className="h-8 px-2 border-camouflage-green-300 text-red-700 hover:bg-red-50 hover:border-red-300">
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar bodegas seleccionadas</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminarán {selectedCount} bodega(s).</AlertDialogDescription>
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
                        checked={selectedCount === warehouses.length && warehouses.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds(new Set(warehouses.map(w => w.id)))
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
                  <TableHead className="w-[300px] text-camouflage-green-700 font-semibold">
                    <div>
                      <button
                        onClick={() => handleSort('location')}
                        className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group"
                      >
                        Dirección
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronUp className={`h-3 w-3 ${sortField === 'location' && sortDirection === 'asc' ? 'text-camouflage-green-900' : ''}`} />
                          <ChevronDown className={`h-3 w-3 ${sortField === 'location' && sortDirection === 'desc' ? 'text-camouflage-green-900' : ''}`} />
              </div>
                      </button>
        </div>
                  </TableHead>
                  <TableHead className="w-[300px] text-camouflage-green-700 font-semibold">
                    Observaciones
                  </TableHead>
                  <TableHead className="w-[160px] text-camouflage-green-700 font-semibold">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedWarehouses.map((warehouse) => (
                  <TableRow 
                    key={warehouse.id}
                    className="border-camouflage-green-100 hover:bg-camouflage-green-50/50 transition-colors"
                  >
                    <TableCell className="w-[36px]">
                      <div className="pl-3">
                        <Checkbox 
                          checked={isSelected(warehouse.id)} 
                          onCheckedChange={() => toggleSelect(warehouse.id)} 
                          aria-label={`Seleccionar ${warehouse.name}`} 
                    />
                  </div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <div className="font-medium text-camouflage-green-900">{warehouse.name}</div>
                    </TableCell>
                    <TableCell className="w-[300px]">
                      <div className="text-camouflage-green-600 text-sm">{warehouse.location}</div>
                    </TableCell>
                    <TableCell className="w-[300px]">
                      <div className="text-camouflage-green-600 text-sm max-w-[280px] truncate" title={warehouse.observations}>
                        {warehouse.observations}
                </div>
                    </TableCell>
                    <TableCell className="w-[160px]">
                      <div className="flex items-center justify-start gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 border-camouflage-green-300 hover:border-camouflage-green-400"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 border-camouflage-green-300 hover:border-camouflage-green-400"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-camouflage-green-300 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100 hover:border-camouflage-green-400"
                          title={warehouse.isActive ? "Desactivar" : "Activar"}
                          onClick={() => toggleWarehouseStatus(warehouse.id)}
                        >
                          {warehouse.isActive ? (
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
                                  setSelectedIds(prev => {
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
                {filteredAndSortedWarehouses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Warehouse className="h-12 w-12 text-camouflage-green-300" />
                        <div>
                          <p className="text-camouflage-green-600 font-medium">
                            {searchTerm ? 'No se encontraron bodegas' : 'No hay bodegas registradas'}
                          </p>
                          <p className="text-camouflage-green-500 text-sm mt-1">
                            {searchTerm 
                              ? `No se encontraron bodegas que coincidan con "${searchTerm}"`
                              : 'Comienza agregando tu primera bodega'
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

      {/* Modal para nueva bodega */}
      <Modal
        isOpen={isNewWarehouseModalOpen}
        onClose={handleCancelNewWarehouse}
        title="Nueva Bodega"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse-name" className="text-camouflage-green-700 font-medium">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="warehouse-name"
              type="text"
              placeholder="Ingresa el nombre de la bodega"
              value={newWarehouseData.name}
              onChange={(e) => handleNewWarehouseInputChange('name', e.target.value)}
              className="border-camouflage-green-300 focus:ring-camouflage-green-500 focus:border-camouflage-green-500 bg-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse-location" className="text-camouflage-green-700 font-medium">
              Dirección
            </Label>
            <Input
              id="warehouse-location"
              type="text"
              placeholder="Ingresa la dirección de la bodega"
              value={newWarehouseData.location}
              onChange={(e) => handleNewWarehouseInputChange('location', e.target.value)}
              className="border-camouflage-green-300 focus:ring-camouflage-green-500 focus:border-camouflage-green-500 bg-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse-observations" className="text-camouflage-green-700 font-medium">
              Observaciones
            </Label>
            <Textarea
              id="warehouse-observations"
              placeholder="Ingresa observaciones adicionales sobre la bodega"
              value={newWarehouseData.observations}
              onChange={(e) => handleNewWarehouseInputChange('observations', e.target.value)}
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
              onClick={handleCancelNewWarehouse}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNewWarehouse}
              className="bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white"
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
