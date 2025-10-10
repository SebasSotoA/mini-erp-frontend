"use client"

import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  XCircle,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInventory } from "@/contexts/inventory-context"
import { useToast } from "@/hooks/use-toast"
import { PaginationConfig } from "@/lib/types/inventory-value"

interface InvoiceFilters {
  supplierSearch: string
  warehouse: string
  status: string
  dateFrom: string
}

export default function PurchaseInvoices() {
  const { purchaseInvoices, updatePurchaseInvoice } = useInventory()
  const router = useRouter()
  const { toast } = useToast()

  // Estado local
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<InvoiceFilters>({
    supplierSearch: "",
    warehouse: "",
    status: "",
    dateFrom: "",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<keyof typeof purchaseInvoices[0] | "">("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Aplicar filtros
  const filteredInvoices = useMemo(() => {
    return purchaseInvoices.filter((invoice) => {
      const matchesSupplierSearch = !filters.supplierSearch || 
        invoice.supplierName.toLowerCase().includes(filters.supplierSearch.toLowerCase())
      
      const matchesWarehouse = !filters.warehouse || filters.warehouse === "all" || invoice.warehouseId === filters.warehouse
      const matchesStatus = !filters.status || filters.status === "all" || invoice.status === filters.status
      
      const matchesDateFrom = !filters.dateFrom || new Date(invoice.date) >= new Date(filters.dateFrom)

      return matchesSupplierSearch && matchesWarehouse && matchesStatus && matchesDateFrom
    })
  }, [purchaseInvoices, filters])

  // Aplicar ordenamiento
  const sortedInvoices = useMemo(() => {
    if (!sortField) return filteredInvoices

    return [...filteredInvoices].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue == null || bValue == null) return 0
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [filteredInvoices, sortField, sortDirection])

  // Configuración de paginación
  const pagination: PaginationConfig = useMemo(() => {
    const totalItems = sortedInvoices.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
    }
  }, [sortedInvoices.length, currentPage, itemsPerPage])

  // Facturas para mostrar en la página actual
  const currentInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedInvoices.slice(startIndex, endIndex)
  }, [sortedInvoices, currentPage, itemsPerPage])

  const handleSort = (field: keyof typeof purchaseInvoices[0]) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleFilterChange = (field: keyof InvoiceFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      supplierSearch: "",
      warehouse: "",
      status: "",
      dateFrom: "",
    })
    setCurrentPage(1)
  }

  const handleCancelInvoice = (id: string) => {
    console.log("Anulando factura:", id)
    updatePurchaseInvoice(id, { status: "cancelled" })
    console.log("Factura anulada, nuevo estado:", purchaseInvoices.find(i => i.id === id))
    toast({
      title: "Factura anulada",
      description: "La factura se ha anulado correctamente.",
    })
  }

  const handleViewInvoice = (id: string) => {
    router.push(`/invoices/purchase/${id}`)
  }

  const handleEditInvoice = (id: string) => {
    router.push(`/invoices/purchase/${id}/edit`)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <Receipt className="mr-3 h-8 w-8 text-camouflage-green-700" />
              Facturas de Compra
            </h1>
            <p className="mt-1 text-camouflage-green-600">Gestiona las facturas de compra del sistema.</p>
          </div>
          <Button
            size="md2"
            className="bg-camouflage-green-700 pl-4 pr-4 text-white hover:bg-camouflage-green-800"
            onClick={() => router.push("/invoices/purchase/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        </div>

        {/* Tabla de Facturas */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">
                Facturas de Compra ({pagination.totalItems.toLocaleString()})
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {showFilters && (
                    <TableRow className="border-camouflage-green-200 bg-camouflage-green-50/30 hover:bg-camouflage-green-50/30">
                      <TableHead className="w-[200px]">
                        <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-camouflage-green-400" />
                            <input
                              type="text"
                              placeholder="Buscar proveedor..."
                              value={filters.supplierSearch}
                              onChange={(e) => handleFilterChange("supplierSearch", e.target.value)}
                              className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white pl-10 pr-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                            />
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="w-[200px]">
                        <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                          <Select
                            value={filters.warehouse}
                            onValueChange={(value) => handleFilterChange("warehouse", value)}
                          >
                            <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                              <SelectValue placeholder="Buscar por bodega" />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl">
                              <SelectItem value="all">Buscar por bodega</SelectItem>
                              <SelectItem value="1">Bodega Principal</SelectItem>
                              <SelectItem value="2">Bodega Secundaria</SelectItem>
                              <SelectItem value="3">Almacén Norte</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableHead>
                      <TableHead className="w-[150px]">
                        <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                          <input
                            type="date"
                            placeholder="Fecha de creación"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                            className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                          />
                        </div>
                      </TableHead>
                      <TableHead className="w-[120px]">
                        <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                          <Select
                            value={filters.status}
                            onValueChange={(value) => handleFilterChange("status", value)}
                          >
                            <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl">
                              <SelectItem value="all">Estado</SelectItem>
                              <SelectItem value="draft">Borrador</SelectItem>
                              <SelectItem value="completed">Completada</SelectItem>
                              <SelectItem value="cancelled">Anulada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableHead>
                      <TableHead className="w-[120px]">
                        <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                          <Button
                            onClick={clearFilters}
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 border-camouflage-green-300 p-0 text-camouflage-green-700 hover:bg-camouflage-green-100"
                            title="Limpiar filtros"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableHead>
                    </TableRow>
                  )}
                  {/* Fila de headers de columnas */}
                  <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                    <TableHead className="w-[200px] font-semibold text-camouflage-green-700">
                      <div>
                        <button
                          onClick={() => handleSort("invoiceNumber")}
                          className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                        >
                          Número
                          <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                            <ChevronUp
                              className={`h-3 w-3 ${sortField === "invoiceNumber" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                            />
                            <ChevronDown
                              className={`h-3 w-3 ${sortField === "invoiceNumber" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                            />
                          </div>
                        </button>
                      </div>
                    </TableHead>
                    <TableHead className="w-[200px] font-semibold text-camouflage-green-700">
                      <div>
                        <button
                          onClick={() => handleSort("supplierName")}
                          className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                        >
                          Proveedor
                          <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                            <ChevronUp
                              className={`h-3 w-3 ${sortField === "supplierName" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                            />
                            <ChevronDown
                              className={`h-3 w-3 ${sortField === "supplierName" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                            />
                          </div>
                        </button>
                      </div>
                    </TableHead>
                    <TableHead className="w-[150px] font-semibold text-camouflage-green-700">
                      <div>
                        <button
                          onClick={() => handleSort("date")}
                          className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                        >
                          Creación
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
                          onClick={() => handleSort("totalAmount")}
                          className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                        >
                          Total
                          <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                            <ChevronUp
                              className={`h-3 w-3 ${sortField === "totalAmount" && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
                            />
                            <ChevronDown
                              className={`h-3 w-3 ${sortField === "totalAmount" && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
                            />
                          </div>
                        </button>
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px] font-semibold text-camouflage-green-700">
                      Estado
                    </TableHead>
                    <TableHead className="w-[120px] font-semibold text-camouflage-green-700">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-camouflage-green-500">
                        No se encontraron facturas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="border-camouflage-green-100 hover:bg-camouflage-green-50/30"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <TableCell className="font-medium hover:bg-transparent" style={{ backgroundColor: 'transparent' }}>
                          <button
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="text-camouflage-green-900 hover:text-camouflage-green-700 hover:underline cursor-pointer bg-transparent border-none p-0"
                          >
                            {invoice.invoiceNumber}
                          </button>
                        </TableCell>
                        <TableCell className="text-camouflage-green-700 hover:bg-transparent" style={{ backgroundColor: 'transparent' }}>
                          {invoice.supplierName}
                        </TableCell>
                        <TableCell className="text-camouflage-green-700 hover:bg-transparent" style={{ backgroundColor: 'transparent' }}>
                          {new Date(invoice.date).toLocaleDateString('es-CO')}
                        </TableCell>
                        <TableCell className="font-medium text-camouflage-green-900 hover:bg-transparent" style={{ backgroundColor: 'transparent' }}>
                          ${invoice.totalAmount.toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell className="hover:bg-transparent" style={{ backgroundColor: 'transparent' }}>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              invoice.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : invoice.status === "draft"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {invoice.status === "completed" ? "Completada" : invoice.status === "draft" ? "Borrador" : "Anulada"}
                          </span>
                        </TableCell>
                        <TableCell className="hover:bg-transparent" style={{ backgroundColor: 'transparent' }}>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewInvoice(invoice.id)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditInvoice(invoice.id)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {invoice.status !== "cancelled" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Anular factura</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Estás seguro de que quieres anular la factura {invoice.invoiceNumber}? Esta acción cambiará el estado a "Anulada".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => handleCancelInvoice(invoice.id)}
                                    >
                                      Anular
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="border-t border-camouflage-green-200 bg-camouflage-green-50/30 px-6 py-4">
                <PaginationControls
                  pagination={pagination}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={() => {}}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
