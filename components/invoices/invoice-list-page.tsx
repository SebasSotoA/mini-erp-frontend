"use client"

import {
  Receipt,
  Plus,
  Filter,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { PaginationControls } from "@/components/inventory-value/pagination-controls"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { PaginationConfig } from "@/lib/types/inventory-value"
import { InvoiceFilters } from "@/components/invoices/types"
import { InvoiceTable } from "@/components/invoices/invoice-table"
import { InvoiceFiltersRow } from "@/components/invoices/invoice-filters-row"

interface InvoiceListPageProps<T> {
  title: string
  description: string
  icon: React.ReactNode
  newInvoicePath: string
  invoices: T[]
  updateInvoice: (id: string, updates: Partial<T>) => void
  viewInvoicePath: (id: string) => string
  editInvoicePath: (id: string) => string
  filterConfig: {
    searchField: keyof InvoiceFilters
    searchPlaceholder: string
    dropdownField?: keyof InvoiceFilters
    dropdownOptions?: Array<{ value: string; label: string }>
    dropdownPlaceholder?: string
  }
  tableConfig: {
    columns: Array<{
      key: keyof T
      label: string
      width: string
      sortable?: boolean
    }>
    renderCell: (invoice: T, column: keyof T) => React.ReactNode
    getInvoiceNumber: (invoice: T) => string
    getInvoiceStatus: (invoice: T) => string
    getInvoiceDate: (invoice: T) => string
    getInvoiceTotal: (invoice: T) => number
  }
  filterFunction: (invoices: T[], filters: InvoiceFilters) => T[]
}

export function InvoiceListPage<T extends { id: string }>({
  title,
  description,
  icon,
  newInvoicePath,
  invoices,
  updateInvoice,
  viewInvoicePath,
  editInvoicePath,
  filterConfig,
  tableConfig,
  filterFunction,
}: InvoiceListPageProps<T>) {
  const router = useRouter()
  const { toast } = useToast()

  // Estado local
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<InvoiceFilters>({
    search: "",
    dropdown: "",
    status: "",
    dateFrom: "",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<keyof T | "">("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Aplicar filtros
  const filteredInvoices = useMemo(() => {
    return filterFunction(invoices, filters)
  }, [invoices, filters, filterFunction])

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

  const handleSort = (field: keyof T) => {
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
      search: "",
      dropdown: "",
      status: "",
      dateFrom: "",
    })
    setCurrentPage(1)
  }

  const handleCancelInvoice = (id: string) => {
    updateInvoice(id, { status: "cancelled" } as Partial<T>)
    toast({
      title: "Factura anulada",
      description: "La factura se ha anulado correctamente.",
    })
  }

  const handleViewInvoice = (id: string) => {
    router.push(viewInvoicePath(id))
  }

  const handleEditInvoice = (id: string) => {
    router.push(editInvoicePath(id))
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              {icon}
              {title}
            </h1>
            <p className="mt-1 text-camouflage-green-600">{description}</p>
          </div>
          <Button
            size="md2"
            className="bg-camouflage-green-700 pl-4 pr-4 text-white hover:bg-camouflage-green-800"
            onClick={() => router.push(newInvoicePath)}
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
                {title} ({pagination.totalItems.toLocaleString()})
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
            <InvoiceTable
              invoices={currentInvoices}
              columns={tableConfig.columns}
              showFilters={showFilters}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              onSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
              onView={handleViewInvoice}
              onEdit={handleEditInvoice}
              onCancel={handleCancelInvoice}
              renderCell={tableConfig.renderCell}
              getInvoiceNumber={tableConfig.getInvoiceNumber}
              getInvoiceStatus={tableConfig.getInvoiceStatus}
              filterConfig={filterConfig}
              pagination={pagination}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
