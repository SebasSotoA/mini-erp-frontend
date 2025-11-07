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
import { PaginationConfig } from "@/lib/types/inventory-value"
import { useMovimientos } from "@/hooks/api/use-movimientos-inventario"
import { useBodegasActive } from "@/hooks/api/use-bodegas"
import { useDebounce } from "@/hooks/use-debounce"
import type { MovimientosQueryParams } from "@/lib/api/services/movimientos-inventario.service"

interface MovementFilters {
  productSearch: string
  warehouseId: string
  movementType: string
  dateFrom: string
}

export default function StockMovementsHistory() {
  // Obtener bodegas activas para el dropdown
  const { data: warehousesData } = useBodegasActive(true)
  const warehouses = warehousesData || []
  
  // Estado para filtros
  const [filters, setFilters] = useState<MovementFilters>({
    productSearch: "",
    warehouseId: "all",
    movementType: "all",
    dateFrom: "",
  })

  // Estado para mostrar/ocultar filtros
  const [showFilters, setShowFilters] = useState(false)
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Estado para ordenamiento
  const [sortField, setSortField] = useState<"date" | "productName" | "quantity" | "type" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Debounce para búsqueda de producto
  const debouncedProductSearch = useDebounce(filters.productSearch || "", 500)

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

  // Construir parámetros para la API
  const apiParams = useMemo<MovimientosQueryParams>(() => {
    // Mapear ordenamiento del frontend al backend
    const orderByMap: Record<string, "fecha" | "cantidad" | "tipoMovimiento" | "productoNombre" | "bodegaNombre"> = {
      date: "fecha",
      productName: "productoNombre",
      quantity: "cantidad",
      type: "tipoMovimiento",
    }
    const params: MovimientosQueryParams = {
      page: currentPage,
      pageSize: itemsPerPage,
    }

    // Filtro por búsqueda de producto
    if (debouncedProductSearch.trim()) {
      params.productoNombre = debouncedProductSearch.trim()
    }

    // Filtro por bodega
    if (filters.warehouseId && filters.warehouseId !== "all") {
      params.bodegaId = filters.warehouseId
    }

    // Filtro por tipo de movimiento (mapear in/out a COMPRA/VENTA)
    if (filters.movementType && filters.movementType !== "all") {
      if (filters.movementType === "in") {
        params.tipoMovimiento = "COMPRA"
      } else if (filters.movementType === "out") {
        params.tipoMovimiento = "VENTA"
      }
      // Para "adjustment" y "return" no enviamos filtro (mostrar todos)
    }

    // Filtro por fecha exacta (usar fechaDesde y fechaHasta con la misma fecha para filtrar todo el día)
    if (filters.dateFrom) {
      // El input type="date" devuelve formato YYYY-MM-DD
      // Convertir a UTC midnight para fechaDesde (inicio del día)
      const [year, month, day] = filters.dateFrom.split('-').map(Number)
      const utcDateStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
      params.fechaDesde = utcDateStart.toISOString()
      
      // Convertir a UTC end of day para fechaHasta (fin del día)
      const utcDateEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
      params.fechaHasta = utcDateEnd.toISOString()
    }

    // Ordenamiento
    if (sortField) {
      const backendOrderBy = orderByMap[sortField]
      if (backendOrderBy) {
        params.orderBy = backendOrderBy
        params.orderDesc = sortDirection === "desc"
      }
    } else {
      // Por defecto, ordenar por fecha descendente
      params.orderBy = "fecha"
      params.orderDesc = true
    }

    return params
  }, [currentPage, itemsPerPage, debouncedProductSearch, filters.warehouseId, filters.movementType, filters.dateFrom, sortField, sortDirection])

  // Obtener movimientos del backend
  const { data: movimientosResponse, isLoading, error } = useMovimientos(apiParams)

  // Extraer datos de la respuesta
  const movimientos = movimientosResponse?.data?.items || []
  const paginationData = movimientosResponse?.data

  // Configuración de paginación
  const pagination: PaginationConfig = useMemo(() => {
    if (!paginationData) {
      return {
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 0,
      }
    }

    return {
      currentPage: paginationData.page,
      itemsPerPage: paginationData.pageSize,
      totalItems: paginationData.totalCount,
      totalPages: paginationData.totalPages,
    }
  }, [paginationData])

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

  // Los movimientos ya vienen del backend con toda la información necesaria
  const currentMovements = movimientos

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
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="sm"
                  className={`border-camouflage-green-300 text-camouflage-green-700 transition-all duration-200 hover:bg-camouflage-green-50 ${
                    showFilters ? "border-camouflage-green-400 bg-camouflage-green-100" : ""
                  }`}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {/* Fila de filtros */}
                {showFilters && (
                  <TableRow className="border-camouflage-green-200 bg-camouflage-green-50/30 hover:bg-camouflage-green-50/30">
                    <TableHead className="w-[200px]">
                      <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                        <input
                          type="date"
                          value={filters.dateFrom || ""}
                          onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                          className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[150px]">
                      <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                        <Select
                          value={filters.movementType}
                          onValueChange={(value) => handleFilterChange("movementType", value)}
                        >
                          <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent className="rounded-3xl">
                            <SelectItem value="all">Tipo</SelectItem>
                            <SelectItem value="in">Compra</SelectItem>
                            <SelectItem value="out">Venta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableHead>
                    <TableHead className="w-[150px]">
                      <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                        <Select
                          value={filters.warehouseId}
                          onValueChange={(value) => handleFilterChange("warehouseId", value)}
                        >
                          <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                            <SelectValue placeholder="Bodega" />
                          </SelectTrigger>
                          <SelectContent className="rounded-3xl">
                            <SelectItem value="all">Bodega</SelectItem>
                            {warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableHead>
                    <TableHead className="w-[200px]">
                      <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-camouflage-green-400" />
                          <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={filters.productSearch}
                            onChange={(e) => handleFilterChange("productSearch", e.target.value)}
                            className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white pl-10 pr-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                          />
                        </div>
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                        <Button
                          onClick={clearFilters}
                          size="sm"
                          variant="outline"
                          className="h-9 w-14 border-camouflage-green-300 p-0 text-camouflage-green-700 hover:bg-camouflage-green-100"
                          title="Limpiar filtros"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead className="w-[250px]">
                      <div className="py-3"></div>
                    </TableHead>
                  </TableRow>
                )}
                
                {/* Headers de columnas */}
                <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                  <TableHead className="w-[200px] font-semibold text-camouflage-green-700">
                    <div>
                      <button
                        onClick={() => handleSort("date")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900 px-2"
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
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900 px-3"
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
                  <TableHead className="w-[150px] font-semibold text-camouflage-green-700 px-4">Bodega</TableHead>
                  <TableHead className="w-[200px] font-semibold text-camouflage-green-700">
                    <div>
                      <button
                        onClick={() => handleSort("productName")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900 px-4"
                      >
                        Producto
                        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronUp
                            className={`h-3 w-3 ${sortField === "productName" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                          />
                          <ChevronDown
                            className={`h-3 w-3 ${sortField === "productName" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                          />
                        </div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] font-semibold text-camouflage-green-700">
                    <div>
                      <button
                        onClick={() => handleSort("quantity")}
                        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900 px-1"
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
                  <TableHead className="w-[250px] font-semibold text-camouflage-green-700">Observación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Package className="h-12 w-12 text-camouflage-green-300 animate-pulse" />
                        <p className="font-medium text-camouflage-green-600">Cargando movimientos...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Package className="h-12 w-12 text-red-300" />
                        <p className="font-medium text-red-600">Error al cargar movimientos</p>
                        <p className="mt-1 text-sm text-red-500">
                          {error instanceof Error ? error.message : "Ocurrió un error desconocido"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {currentMovements.map((movement) => {
                      return (
                        <TableRow
                          key={movement.id}
                          className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
                        >
                          <TableCell className="w-[200px] pl-3">
                            <div className="text-sm text-camouflage-green-900">
                              {format(new Date(movement.date), "dd/MM/yyyy", { locale: es })}
                            </div>
                          </TableCell>
                          <TableCell className="w-[150px] pl-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${getMovementTypeColor(movement.type)}`}
                            >
                              {getMovementTypeLabel(movement.type)}
                            </span>
                          </TableCell>
                          <TableCell className="w-[150px] pl-4">
                            <div className="text-sm text-camouflage-green-700">
                              {movement.warehouseName || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className="w-[200px] pl-5">
                            <div className="text-sm font-medium text-camouflage-green-900">
                              {movement.productName}
                            </div>
                          </TableCell>
                          <TableCell className="w-[120px] pl-2">
                            <div className="">
                              <span
                                className={`min-w-[50px] rounded-full px-4 py-2 text-center text-sm font-semibold ${
                                  movement.quantity > 0
                                    ? "bg-camouflage-green-100 text-camouflage-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {Math.abs(movement.quantity).toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="w-[250px]">
                            <div className="text-sm text-camouflage-green-700">
                              {movement.observation || movement.reason || "-"}
                            </div>                        
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
                                {pagination.totalItems === 0 ? "No hay movimientos registrados" : "No se encontraron movimientos"}
                              </p>
                              <p className="mt-1 text-sm text-camouflage-green-500">
                                {pagination.totalItems === 0
                                  ? "Los movimientos aparecerán aquí cuando se registren compras o ventas"
                                  : "Intenta ajustar los filtros de búsqueda"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
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
