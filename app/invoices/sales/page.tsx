"use client"

import { InvoiceListPage } from "@/components/invoices/invoice-list-page"
import { useInventory } from "@/contexts/inventory-context"
import { useSalesInvoiceFilters } from "@/components/invoices/hooks/use-invoice-filters"
import {
  salesInvoicePageConfig,
  salesInvoiceFilterConfig,
  salesInvoiceTableConfig,
} from "@/components/invoices/configs/sales-config"

export default function SalesInvoices() {
  const { salesInvoices, updateSalesInvoice } = useInventory()

  const filterFunction = useSalesInvoiceFilters

  return (
    <InvoiceListPage
      title={salesInvoicePageConfig.title}
      description={salesInvoicePageConfig.description}
      icon={salesInvoicePageConfig.icon}
      newInvoicePath={salesInvoicePageConfig.newInvoicePath}
      invoices={salesInvoices}
      updateInvoice={updateSalesInvoice}
      viewInvoicePath={salesInvoicePageConfig.viewInvoicePath}
      editInvoicePath={salesInvoicePageConfig.editInvoicePath}
      filterConfig={salesInvoiceFilterConfig}
      tableConfig={salesInvoiceTableConfig}
      filterFunction={filterFunction}
    />
  )
}