import { Receipt } from "lucide-react"
import { PurchaseInvoice } from "@/lib/types/invoices"
import { InvoiceTableConfig, FilterConfig } from "../types"

export const purchaseInvoiceFilterConfig: FilterConfig = {
  searchField: "search",
  searchPlaceholder: "Buscar proveedor...",
  dropdownField: "dropdown",
  dropdownOptions: [
    { value: "all", label: "Buscar por bodega" },
    { value: "1", label: "Bodega Principal" },
    { value: "2", label: "Bodega Secundaria" },
    { value: "3", label: "Almacén Norte" },
  ],
  dropdownPlaceholder: "Buscar por bodega",
}

export const purchaseInvoiceTableConfig: InvoiceTableConfig<PurchaseInvoice> = {
  columns: [
    { key: "invoiceNumber", label: "Número", width: "w-[200px]", sortable: true },
    { key: "supplierName", label: "Proveedor", width: "w-[200px]", sortable: true },
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
      case "supplierName":
        return <span className="text-camouflage-green-700">{invoice.supplierName}</span>
      case "date":
        return <span className="text-camouflage-green-700">{new Date(invoice.date).toLocaleDateString('es-CO')}</span>
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

export const purchaseInvoicePageConfig = {
  title: "Facturas de Compra",
  description: "Gestiona las facturas de compra del sistema.",
  icon: <Receipt className="mr-3 h-8 w-8 text-camouflage-green-700" />,
  newInvoicePath: "/invoices/purchase/new",
  viewInvoicePath: (id: string) => `/invoices/purchase/${id}`,
  editInvoicePath: (id: string) => `/invoices/purchase/${id}/edit`,
}
