"use client"

import {
  Package,
  Search,
  Filter,
  Calendar,
  ChevronUp,
  ChevronDown,
  X,
  TrendingUp,
  TrendingDown,
  User,
} from "lucide-react"
import { useMemo, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { MainLayout } from "@/components/layout/main-layout"
import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInventory } from "@/contexts/inventory-context"
import { PaginationConfig } from "@/lib/types/inventory-value"

interface MovementFilters {
  productSearch: string
  warehouseId: string
  movementType: string
  dateFrom: string
  dateTo: string
}

export default function StockMovementsHistory() {
  const { stockMovements, warehouses, products } = useInventory()
  
  // Estado para filtros
  const [filters, setFilters] = useState<MovementFilters>({
    productSearch: "",
    warehouseId: "all",
    movementType: "all",
    dateFrom: "",
    dateTo: "",
  })
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Estado para ordenamiento
  const [sortField, setSortField] = useState<"date" | "productName" | "quantity" | "type" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const handleFilterChange = (field: keyof MovementFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      productSearch: "",
      warehouseId: "all",
      movementType: "all",
      dateFrom: "",
      dateTo: "",
    })
    setCurrentPage(1)
  }

  const handleSort = (field: "date" | "productName" | "quantity" | "type") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Filtrar y ordenar movimientos
  const filteredAndSortedMovements = useMemo(() => {
    let filtered = stockMovements

    // Filtro por búsqueda de producto
    if (filters.productSearch.trim()) {
      filtered = filtered.filter(movement =>
        movement.productName.toLowerCase().includes(filters.productSearch.toLowerCase())
      )
    }

    // Filtro por tipo de movimiento
    if (filters.movementType && filters.movementType !== "all") {
      filtered = filtered.filter(movement => movement.type === filters.movementType)
    }

    // Filtro por rango de fechas
    if (filters.dateFrom) {
      filtered = filtered.filter(movement => movement.date >= filters.dateFrom)
    }
    if (filters.dateTo) {
      filtered = filtered.filter(movement => movement.date <= filters.dateTo)
    }

    // Ordenamiento
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (sortField) {
          case "date":
            aValue = new Date(a.date)
            bValue = new Date(b.date)
            break
          case "productName":
            aValue = a.productName.toLowerCase()
            bValue = b.productName.toLowerCase()
            break
          case "quantity":
            aValue = Math.abs(a.quantity)
            bValue = Math.abs(b.quantity)
            break
          case "type":
            aValue = a.type
            bValue = b.type
            break
          default:
            return 0
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [stockMovements, filters, sortField, sortDirection])

  // Configuración de paginación
  const pagination: PaginationConfig = useMemo(() => {
    const totalItems = filteredAndSortedMovements.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
    }
  }, [filteredAndSortedMovements.length, currentPage, itemsPerPage])

  // Movimientos para mostrar en la página actual
  const currentMovements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedMovements.slice(startIndex, endIndex)
  }, [filteredAndSortedMovements, currentPage, itemsPerPage])

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case "in":
        return "Compra"
      case "out":
        return "Venta"
      case "adjustment":
        return "Ajuste"
      case "return":
        return "Devolución"
      default:
        return type
    }
  }

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case "in":
        return "bg-camouflage-green-100 text-camouflage-green-800"
      case "out":
        return "bg-red-100 text-red-800"
      case "adjustment":
        return "bg-blue-100 text-blue-800"
      case "return":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const activeWarehouses = warehouses.filter(w => w.isActive)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <Package className="mr-3 h-8 w-8 text-camouflage-green-700" />
              Historial de Movimientos
            </h1>
            <p className="mt-1 text-camouflage-green-600">
              Consulta todos los movimientos de stock registrados en el sistema.
            </p>
          </div>
        </div>

        {/* Tabla de Movimientos */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">
                Movimientos Registrados ({pagination.totalItems.toLocaleString()})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {/* Fila de filtros */}
                <TableRow className="border-camouflage-green-200 bg-camouflage-green-50/30 hover:bg-transparent">
                  <TableHead className="w-[200px]">
                    <div className="py-3">
                      <Input
                        type="text"
                        placeholder="Buscar producto..."
                        value={filters.productSearch}
                        onChange={(e) => handleFilterChange("productSearch", e.target.value)}
                        className="w-full rounded border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <div className="py-3">
                      <Select
                        value={filters.movementType}
                        onValueChange={(value) => handleFilterChange("movementType", value)}
                      >
                        <SelectTrigger className="w-full rounded border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="in">Compra</SelectItem>
                          <SelectItem value="out">Venta</SelectItem>
                          <SelectItem value="adjustment">Ajuste</SelectItem>
                          <SelectItem value="return">Devolución</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <div className="py-3">
                      <Input
                        type="date"
                        placeholder="Desde"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                        className="w-full rounded border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <div className="py-3">
                      <Input
                        type="date"
                        placeholder="Hasta"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                        className="w-full rounded border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <div className="py-3">
                      <Select
                        value={filters.warehouseId}
                        onValueChange={(value) => handleFilterChange("warehouseId", value)}
                      >
                        <SelectTrigger className="w-full rounded border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                          <SelectValue placeholder="Bodega" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {activeWarehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableHead>
                  <TableHead className="w-[200px]">
                    <div className="py-3">
                      <div className="text-sm text-camouflage-green-600">Usuario</div>
                    </div>
                  </TableHead>
                </TableRow>
                
                {/* Headers de columnas */}
                <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                  <TableHead className="w-[200px] font-semibold text-camouflage-green-700">
                    <div>
                      <button
                        onClick={() => handleSort("date")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                      >
                        Fecha
                        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronUp
                            className={`h-3 w-3 ${sortField === "date" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                          />
                          <ChevronDown
                            className={`h-3 w-3 ${sortField === "date" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                          />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[150px] font-semibold text-camouflage-green-700">
                    <div>
                      <button
                        onClick={() => handleSort("type")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                      >
                        Tipo
                        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronUp
                            className={`h-3 w-3 ${sortField === "type" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                          />
                          <ChevronDown
                            className={`h-3 w-3 ${sortField === "type" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                          />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] text-center font-semibold text-camouflage-green-700">
                    <div>
                      <button
                        onClick={() => handleSort("quantity")}
                        className="group flex items-center justify-center gap-1 transition-colors hover:text-camouflage-green-900"
                      >
                        Cantidad
                        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronUp
                            className={`h-3 w-3 ${sortField === "quantity" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                          />
                          <ChevronDown
                            className={`h-3 w-3 ${sortField === "quantity" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                          />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] text-center font-semibold text-camouflage-green-700">Producto</TableHead>
                  <TableHead className="w-[150px] font-semibold text-camouflage-green-700">Bodega</TableHead>
                  <TableHead className="w-[200px] font-semibold text-camouflage-green-700">Usuario</TableHead>
                  <TableHead className="w-[250px] font-semibold text-camouflage-green-700">Observación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMovements.map((movement) => {
                  const product = products.find(p => p.id === movement.productId)
                  const warehouse = warehouses.find(w => w.id === movement.warehouseId)
                  
                  return (
                    <TableRow
                      key={movement.id}
                      className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
                    >
                      <TableCell className="w-[200px]">
                        <div className="text-sm text-camouflage-green-900">
                          {format(new Date(movement.date), "dd/MM/yyyy", { locale: es })}
                        </div>
                        <div className="text-xs text-camouflage-green-500">
                          {format(new Date(movement.date), "HH:mm", { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell className="w-[150px]">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${getMovementTypeColor(movement.type)}`}
                        >
                          {getMovementTypeLabel(movement.type)}
                        </span>
                      </TableCell>
                      <TableCell className="w-[120px] text-center">
                        <div className="flex items-center justify-center gap-1">
                          {movement.quantity > 0 ? (
                            <TrendingUp className="h-4 w-4 text-camouflage-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={`font-semibold ${
                              movement.quantity > 0 ? "text-camouflage-green-700" : "text-red-700"
                            }`}
                          >
                            {Math.abs(movement.quantity)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[120px]">
                        <div className="text-sm font-medium text-camouflage-green-900">
                          {movement.productName}
                        </div>
                        {product && (
                          <div className="text-xs text-camouflage-green-500">
                            {product.sku}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="w-[150px]">
                        <div className="text-sm text-camouflage-green-700">
                          {warehouse?.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <div className="flex items-center gap-2 text-sm text-camouflage-green-600">
                          <User className="h-4 w-4" />
                          <span>Sistema</span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[250px]">
                        <div className="text-sm text-camouflage-green-700">
                          {movement.reason || "-"}
                        </div>
                        {movement.reference && (
                          <div className="text-xs text-camouflage-green-500">
                            Ref: {movement.reference}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {currentMovements.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Package className="h-12 w-12 text-camouflage-green-300" />
                        <div>
                          <p className="font-medium text-camouflage-green-600">
                            {filteredAndSortedMovements.length === 0 ? "No hay movimientos registrados" : "No se encontraron movimientos"}
                          </p>
                          <p className="mt-1 text-sm text-camouflage-green-500">
                            {filteredAndSortedMovements.length === 0
                              ? "Los movimientos aparecerán aquí cuando se registren compras o ventas"
                              : "Intenta ajustar los filtros de búsqueda"}
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
          <PaginationControls
            pagination={pagination}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </Card>
      </div>
    </MainLayout>
  )
}
