"use client"

import { InvoiceListPage } from "@/components/invoices/invoice-list-page"
import { useInventory } from "@/contexts/inventory-context"
import { usePurchaseInvoiceFilters } from "@/components/invoices/hooks/use-invoice-filters"
import {
  purchaseInvoicePageConfig,
  purchaseInvoiceFilterConfig,
  purchaseInvoiceTableConfig,
} from "@/components/invoices/configs/purchase-config"

export default function PurchaseInvoices() {
  const { purchaseInvoices, updatePurchaseInvoice } = useInventory()

  const filterFunction = usePurchaseInvoiceFilters

  return (
    <InvoiceListPage
      title={purchaseInvoicePageConfig.title}
      description={purchaseInvoicePageConfig.description}
      icon={purchaseInvoicePageConfig.icon}
      newInvoicePath={purchaseInvoicePageConfig.newInvoicePath}
      invoices={purchaseInvoices}
      updateInvoice={updatePurchaseInvoice}
      viewInvoicePath={purchaseInvoicePageConfig.viewInvoicePath}
      editInvoicePath={purchaseInvoicePageConfig.editInvoicePath}
      filterConfig={purchaseInvoiceFilterConfig}
      tableConfig={purchaseInvoiceTableConfig}
      filterFunction={filterFunction}
    />
  )
}
