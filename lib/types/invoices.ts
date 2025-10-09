// lib/types/invoices.ts

// Vendedor para facturas de venta
export interface Salesperson {
  id: string
  name: string
  identification: string // Cédula, DNI, etc.
  observation?: string
  isActive: boolean
  createdAt: string
}

// Proveedor para facturas de compra
export interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  isActive: boolean
  createdAt: string
}

// Item de factura de venta
export interface SalesInvoiceItem {
  id: string
  productId: string
  productName: string
  price: number
  discount: number // Porcentaje (0-100)
  taxRate: number // Porcentaje (0-100)
  quantity: number
  subtotal: number // price * quantity
  discountAmount: number // (subtotal * discount) / 100
  taxAmount: number // ((subtotal - discountAmount) * taxRate) / 100
  total: number // subtotal - discountAmount + taxAmount
}

// Item de factura de compra (con concepto personalizado)
export interface PurchaseInvoiceItem {
  id: string
  concept: string // Concepto personalizado
  price: number
  discount: number // Porcentaje (0-100)
  taxRate: number // Porcentaje (0-100)
  quantity: number
  subtotal: number // price * quantity
  discountAmount: number // (subtotal * discount) / 100
  taxAmount: number // ((subtotal - discountAmount) * taxRate) / 100
  total: number // subtotal - discountAmount + taxAmount
}

// Factura de venta
export interface SalesInvoice {
  id: string
  invoiceNumber: string
  warehouseId: string
  warehouseName: string
  salespersonId: string
  salespersonName: string
  email?: string
  date: string
  paymentType: 'cash' | 'credit' // Contado o crédito
  paymentMethod: string // Medio de pago (dropdown definido)
  items: SalesInvoiceItem[]
  subtotal: number
  totalDiscount: number
  totalTax: number
  totalAmount: number
  status: 'draft' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

// Factura de compra
export interface PurchaseInvoice {
  id: string
  invoiceNumber: string
  warehouseId: string
  warehouseName: string
  supplierId: string
  supplierName: string
  date: string
  items: PurchaseInvoiceItem[]
  subtotal: number
  totalDiscount: number
  totalTax: number
  totalAmount: number
  status: 'draft' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

// Opciones para dropdowns
export interface PaymentMethod {
  id: string
  name: string
  isActive: boolean
}

// Filtros para las tablas
export interface InvoiceFilters {
  dateFrom?: string
  dateTo?: string
  warehouseId?: string
  salespersonId?: string
  supplierId?: string
  status?: string
  search?: string
}

// Resumen de facturas
export interface InvoiceSummary {
  totalInvoices: number
  totalAmount: number
  completedInvoices: number
  draftInvoices: number
  cancelledInvoices: number
}

// Tipos para formularios
export interface SalesInvoiceFormData {
  warehouseId: string
  salespersonId: string
  email?: string
  date: string
  paymentType: 'cash' | 'credit'
  paymentMethod: string
  items: Omit<SalesInvoiceItem, 'id' | 'subtotal' | 'discountAmount' | 'taxAmount' | 'total'>[]
}

export interface PurchaseInvoiceFormData {
  warehouseId: string
  supplierId: string
  date: string
  items: Omit<PurchaseInvoiceItem, 'id' | 'subtotal' | 'discountAmount' | 'taxAmount' | 'total'>[]
}

// Tipos para modales
export interface SalespersonFormData {
  name: string
  identification: string
  observation?: string
  isActive: boolean
}

export interface SupplierFormData {
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  isActive: boolean
}
