"use client"

import {
  Eye,
  XCircle,
  ChevronUp,
  ChevronDown,
  X,
  Search,
} from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DatePicker } from "@/components/ui/date-picker"
import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import { PaginationConfig } from "@/lib/types/inventory-value"
import { InvoiceFilters, InvoiceColumn, FilterConfig } from "./types"

interface InvoiceTableProps<T extends { id: string }> {
  invoices: T[]
  columns: InvoiceColumn<T>[]
  showFilters: boolean
  filters: InvoiceFilters
  onFilterChange: (field: keyof InvoiceFilters, value: string) => void
  onClearFilters: () => void
  onSort: (field: keyof T) => void
  sortField: keyof T | ""
  sortDirection: "asc" | "desc"
  onView: (id: string) => void
  onEdit: (id: string) => void
  onCancel: (id: string) => void
  renderCell: (invoice: T, column: keyof T) => React.ReactNode
  getInvoiceNumber: (invoice: T) => string
  getInvoiceStatus: (invoice: T) => string
  filterConfig: FilterConfig
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
}

export function InvoiceTable<T extends { id: string }>({
  invoices,
  columns,
  showFilters,
  filters,
  onFilterChange,
  onClearFilters,
  onSort,
  sortField,
  sortDirection,
  onView,
  onEdit,
  onCancel,
  renderCell,
  getInvoiceNumber,
  getInvoiceStatus,
  filterConfig,
  pagination,
  onPageChange,
  onItemsPerPageChange,
}: InvoiceTableProps<T>) {
  const renderSortButton = (column: InvoiceColumn<T>) => {
    if (!column.sortable) {
      return <span>{column.label}</span>
    }

    return (
      <button
        onClick={() => onSort(column.key)}
        className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
      >
        {column.label}
        <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
          <ChevronUp
            className={`h-3 w-3 ${sortField === column.key && sortDirection === "asc" ? "text-camouflage-green-900" : ""}`}
          />
          <ChevronDown
            className={`h-3 w-3 ${sortField === column.key && sortDirection === "desc" ? "text-camouflage-green-900" : ""}`}
          />
        </div>
      </button>
    )
  }

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { bg: "bg-green-100", text: "text-green-800", label: "Completada" },
      draft: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Borrador" },
      cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Anulada" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft

    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {/* Fila de filtros */}
          {showFilters && (
            <TableRow className="border-camouflage-green-200 bg-camouflage-green-50/30 hover:bg-camouflage-green-50/30">
              {/* Número de factura */}
              <TableHead className="w-[180px]">
                <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-camouflage-green-400" />
                    <input
                      type="text"
                      placeholder="Número factura"
                      value={filters.numeroFactura || ""}
                      onChange={(e) => onFilterChange("numeroFactura", e.target.value)}
                      className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white pl-10 pr-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500"
                    />
                  </div>
                </div>
              </TableHead>

              {/* Bodega (dropdown) */}
              {filterConfig.dropdownField && filterConfig.dropdownOptions && (
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                    <Select
                      value={filters.bodegaId || "all"}
                      onValueChange={(value) => onFilterChange("bodegaId", value)}
                    >
                      <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                        <SelectValue placeholder="Bodega" />
                      </SelectTrigger>
                      <SelectContent className="rounded-3xl">
                        {filterConfig.dropdownOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableHead>
              )}

              {/* Proveedor (dropdown) */}
              {filterConfig.supplierOptions && (
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                    <Select
                      value={filters.proveedorId || "all"}
                      onValueChange={(value) => onFilterChange("proveedorId", value)}
                    >
                      <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                        <SelectValue placeholder="Proveedor" />
                      </SelectTrigger>
                      <SelectContent className="rounded-3xl">
                        {filterConfig.supplierOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableHead>
              )}

              {/* Vendedor (dropdown) */}
              {filterConfig.salespersonOptions && (
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                    <Select
                      value={filters.vendedorId || "all"}
                      onValueChange={(value) => onFilterChange("vendedorId", value)}
                    >
                      <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                        <SelectValue placeholder="Vendedor" />
                      </SelectTrigger>
                      <SelectContent className="rounded-3xl">
                        {filterConfig.salespersonOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableHead>
              )}

              {/* Fecha de creación */}
              <TableHead className="w-[140px]">
                <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                  <DatePicker
                    value={filters.date ? new Date(filters.date) : null}
                    onChange={(date) => onFilterChange("date", date ? date.toISOString().split('T')[0] : "")}
                    placeholder="Fecha"
                    className="w-full text-sm h-9"
                  />
                </div>
              </TableHead>

              {/* Filtro de estado */}
              <TableHead className="w-[140px]">
                <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) => onFilterChange("status", value)}
                  >
                    <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Anulada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableHead>

              {/* Filtro de forma de pago */}
              {filters.formaPago !== undefined && (
                <TableHead className="w-[140px]">
                  <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                    <Select
                      value={filters.formaPago || "all"}
                      onValueChange={(value) => onFilterChange("formaPago", value)}
                    >
                      <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                        <SelectValue placeholder="Forma pago" />
                      </SelectTrigger>
                      <SelectContent className="rounded-3xl">
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="cash">Contado</SelectItem>
                        <SelectItem value="credit">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableHead>
              )}

              {/* Filtro de medio de pago */}
              {filters.medioPago !== undefined && (
                <TableHead className="w-[140px]">
                  <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                    <Select
                      value={filters.medioPago || "all"}
                      onValueChange={(value) => onFilterChange("medioPago", value)}
                    >
                      <SelectTrigger className="w-full rounded-3xl border border-camouflage-green-300 bg-white hover:bg-white focus:bg-white active:bg-white px-3 py-2 text-sm text-camouflage-green-900 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500">
                        <SelectValue placeholder="Medio pago" />
                      </SelectTrigger>
                      <SelectContent className="rounded-3xl">
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                        <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="Transferencia">Transferencia</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableHead>
              )}

              {/* Botón limpiar filtros */}
              <TableHead className="w-[100px]">
                <div className="flex items-center gap-1 py-3 hover:bg-transparent">
                  <Button
                    onClick={onClearFilters}
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

          {/* Headers de columnas */}
          <TableRow className="border-camouflage-green-200 hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={String(column.key)} className={`${column.width} font-semibold text-camouflage-green-700`}>
                {renderSortButton(column)}
              </TableHead>
            ))}
            <TableHead className="w-[120px] font-semibold text-camouflage-green-700">
              Estado
            </TableHead>
            <TableHead className="w-[120px] font-semibold text-camouflage-green-700">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 2} className="h-24 text-center text-camouflage-green-500">
                No se encontraron facturas.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className="border-camouflage-green-100 hover:bg-camouflage-green-50/30"
                style={{ backgroundColor: 'transparent' }}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={String(column.key)} 
                    className={`${column.width} hover:bg-transparent`}
                    style={{ backgroundColor: 'transparent' }}
                  >
                    {renderCell(invoice, column.key)}
                  </TableCell>
                ))}
                <TableCell className="hover:bg-transparent" style={{ backgroundColor: 'transparent' }}>
                  {renderStatusBadge(getInvoiceStatus(invoice))}
                </TableCell>
                <TableCell className="hover:bg-transparent" style={{ backgroundColor: 'transparent' }}>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-600 hover:border-camouflage-green-400 hover:bg-camouflage-green-100 hover:text-camouflage-green-800"
                      onClick={(e) => {
                        e.stopPropagation()
                        onView(invoice.id)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {getInvoiceStatus(invoice) !== "cancelled" && (
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
                              ¿Estás seguro de que quieres anular la factura {getInvoiceNumber(invoice)}? Esta acción cambiará el estado a "Anulada".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => onCancel(invoice.id)}
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

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="border-t border-camouflage-green-200 bg-camouflage-green-50/30 px-6 py-4">
          <PaginationControls
            pagination={pagination}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange || (() => {})}
          />
        </div>
      )}
    </div>
  )
}
