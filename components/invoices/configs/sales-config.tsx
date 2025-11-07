import { Receipt } from "lucide-react"
import { SalesInvoice } from "@/lib/types/invoices"
import { InvoiceTableConfig, FilterConfig } from "../types"

export const salesInvoiceFilterConfig: FilterConfig = {
  searchField: "search",
  searchPlaceholder: "Buscar cliente...",
  dropdownField: "dropdown",
  dropdownOptions: [
    { value: "all", label: "Buscar por vendedor" },
    { value: "1", label: "Juan Pérez" },
    { value: "2", label: "María García" },
    { value: "3", label: "Carlos Rodríguez" },
  ],
  dropdownPlaceholder: "Buscar por vendedor",
}

export const salesInvoiceTableConfig: InvoiceTableConfig<SalesInvoice> = {
  columns: [
    { key: "invoiceNumber", label: "Número", width: "w-[200px]", sortable: true },
    { key: "salespersonName", label: "Vendedor", width: "w-[200px]", sortable: true },
    { key: "date", label: "Creación", width: "w-[150px]", sortable: true },
    { key: "totalAmount", label: "Total", width: "w-[150px]", sortable: true },
  ],
  renderCell: (invoice, column) => {
    switch (column) {
      case "invoiceNumber":
        return (
          <span className="font-medium text-camouflage-green-900 hover:text-camouflage-green-700 hover:underline cursor-pointer">
            {invoice.invoiceNumber}
          </span>
        )
      case "salespersonName":
        return <span className="text-camouflage-green-700">{invoice.salespersonName}</span>
      case "date":
        // Parsear la fecha correctamente para evitar problemas de zona horaria
        // Si viene como string ISO, extraer solo la parte de fecha (YYYY-MM-DD)
        const dateStr = typeof invoice.date === 'string' 
          ? invoice.date.split('T')[0] 
          : invoice.date
        const [year, month, day] = dateStr.split('-').map(Number)
        // Crear fecha local sin problemas de zona horaria
        const date = new Date(year, month - 1, day)
        return <span className="text-camouflage-green-700">{date.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
      case "totalAmount":
        return <span className="font-medium text-camouflage-green-900">${invoice.totalAmount.toLocaleString('es-CO')}</span>
      default:
        return null
    }
  },
  getInvoiceNumber: (invoice) => invoice.invoiceNumber,
  getInvoiceStatus: (invoice) => invoice.status,
  getInvoiceDate: (invoice) => invoice.date,
  getInvoiceTotal: (invoice) => invoice.totalAmount,
}

export const salesInvoicePageConfig = {
  title: "Facturas de Venta",
  description: "Gestiona las facturas de venta del sistema.",
  icon: <Receipt className="mr-3 h-8 w-8 text-camouflage-green-700" />,
  newInvoicePath: "/invoices/sales/new",
  viewInvoicePath: (id: string) => `/invoices/sales/${id}`,
  editInvoicePath: (id: string) => `/invoices/sales/${id}/edit`,
}
