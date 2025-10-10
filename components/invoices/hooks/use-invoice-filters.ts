import { useMemo } from "react"
import { SalesInvoice, PurchaseInvoice } from "@/lib/types/invoices"
import { InvoiceFilters } from "../types"

export function useSalesInvoiceFilters(invoices: SalesInvoice[], filters: InvoiceFilters) {
  return useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesClientSearch = !filters.search || 
        (invoice.email && invoice.email.toLowerCase().includes(filters.search.toLowerCase()))
      
      const matchesSalesperson = !filters.dropdown || filters.dropdown === "all" || invoice.salespersonId === filters.dropdown
      const matchesStatus = !filters.status || filters.status === "all" || invoice.status === filters.status
      
      const matchesDateFrom = !filters.dateFrom || new Date(invoice.date) >= new Date(filters.dateFrom)

      return matchesClientSearch && matchesSalesperson && matchesStatus && matchesDateFrom
    })
  }, [invoices, filters])
}

export function usePurchaseInvoiceFilters(invoices: PurchaseInvoice[], filters: InvoiceFilters) {
  return useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSupplierSearch = !filters.search || 
        invoice.supplierName.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesWarehouse = !filters.dropdown || filters.dropdown === "all" || invoice.warehouseId === filters.dropdown
      const matchesStatus = !filters.status || filters.status === "all" || invoice.status === filters.status
      
      const matchesDateFrom = !filters.dateFrom || new Date(invoice.date) >= new Date(filters.dateFrom)

      return matchesSupplierSearch && matchesWarehouse && matchesStatus && matchesDateFrom
    })
  }, [invoices, filters])
}
