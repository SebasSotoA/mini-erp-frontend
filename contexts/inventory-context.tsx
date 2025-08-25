"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

export interface Warehouse {
  id: string
  name: string
  location: string
  capacity: number
  manager: string
  isActive: boolean
}

export interface ProductStock {
  productId: string
  warehouseId: string
  quantity: number
  reservedQuantity: number
  lastUpdated: string
}

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  cost: number // Costo del producto
  category: string
  stock: number
  minStock: number
  maxStock: number
  description: string
  supplier: string
  expiryDate?: string
  createdAt: string
  lastSold?: string
  totalSold: number // Total vendido histórico
  reorderPoint: number
  leadTime: number // Días de tiempo de entrega
  warehouseId?: string // Bodega principal
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  quantity: number
  type: "in" | "out" | "adjustment" | "return"
  reason: string
  date: string
  cost?: number // Costo unitario del movimiento
  reference?: string // Número de factura, orden, etc.
}

export interface Sale {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  date: string
  customer?: string
}

export interface FinancialMetrics {
  totalInventoryValue: number
  totalInventoryCost: number
  grossMargin: number
  inventoryTurnover: number
  daysInventoryOutstanding: number
  deadStock: Product[]
  fastMovingItems: Product[]
  slowMovingItems: Product[]
  abcAnalysis: {
    A: Product[]
    B: Product[]
    C: Product[]
  }
}

interface InventoryContextType {
  products: Product[]
  stockMovements: StockMovement[]
  sales: Sale[]
  warehouses: Warehouse[]
  productStocks: ProductStock[]
  addProduct: (product: Omit<Product, "id" | "createdAt">) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  addStockMovement: (movement: Omit<StockMovement, "id" | "date">) => void
  addSale: (sale: Omit<Sale, "id" | "date">) => void
  getProductById: (id: string) => Product | undefined
  getLowStockProducts: () => Product[]
  getOverstockProducts: () => Product[]
  getStockByCategory: () => { category: string; stock: number; value: number }[]
  getStockByWarehouse: () => { warehouse: string; stock: number; value: number; products: number }[]
  getRecentMovements: () => { date: string; in: number; out: number }[]
  getFinancialMetrics: () => FinancialMetrics
  getSalesAnalytics: () => {
    dailySales: { date: string; sales: number; profit: number }[]
    topProducts: { product: string; revenue: number; quantity: number }[]
    categoryPerformance: { category: string; revenue: number; profit: number; margin: number }[]
  }
  getProfitabilityAnalysis: () => {
    productProfitability: { product: string; revenue: number; cost: number; profit: number; margin: number }[]
    monthlyTrends: { month: string; revenue: number; cost: number; profit: number }[]
  }
  getStockHealthMetrics: () => {
    totalProducts: number
    lowStock: number
    overStock: number
    optimalStock: number
    stockHealthPercentage: number
  }
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

// Datos mock de bodegas
const initialWarehouses: Warehouse[] = [
  {
    id: "1",
    name: "Bodega Central",
    location: "Ciudad Principal",
    capacity: 10000,
    manager: "Juan Pérez",
    isActive: true,
  },
  {
    id: "2", 
    name: "Bodega Norte",
    location: "Zona Norte",
    capacity: 5000,
    manager: "María García",
    isActive: true,
  },
  {
    id: "3",
    name: "Bodega Sur",
    location: "Zona Sur", 
    capacity: 7500,
    manager: "Carlos Rodríguez",
    isActive: true,
  },
  {
    id: "4",
    name: "Bodega Este (Inactiva)",
    location: "Zona Este",
    capacity: 3000,
    manager: "Ana López",
    isActive: false,
  },
]

// Datos mock expandidos y realistas
const initialProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max",
    sku: "IPH-15PM-001",
    price: 1199.99,
    cost: 750.0,
    category: "Electronics",
    stock: 45,
    minStock: 15,
    maxStock: 100,
    description: "Latest iPhone with titanium design and A17 Pro chip",
    supplier: "Apple Inc.",
    createdAt: "2024-01-15",
    lastSold: "2024-01-25",
    totalSold: 89,
    reorderPoint: 20,
    leadTime: 7,
  },
  {
    id: "2",
    name: "Samsung Galaxy S24 Ultra",
    sku: "SAM-S24U-002",
    price: 1099.99,
    cost: 680.0,
    category: "Electronics",
    stock: 32,
    minStock: 12,
    maxStock: 80,
    description: "Premium Android smartphone with S Pen",
    supplier: "Samsung Electronics",
    createdAt: "2024-01-16",
    lastSold: "2024-01-24",
    totalSold: 67,
    reorderPoint: 18,
    leadTime: 5,
  },
  {
    id: "3",
    name: "MacBook Pro 16 M3",
    sku: "MBP-16M3-003",
    price: 2499.99,
    cost: 1650.0,
    category: "Electronics",
    stock: 18,
    minStock: 8,
    maxStock: 40,
    description: "Professional laptop with M3 Max chip",
    supplier: "Apple Inc.",
    createdAt: "2024-01-17",
    lastSold: "2024-01-23",
    totalSold: 34,
    reorderPoint: 12,
    leadTime: 10,
  },
  {
    id: "4",
    name: "Sony WH-1000XM5",
    sku: "SNY-WH5-004",
    price: 399.99,
    cost: 220.0,
    category: "Electronics",
    stock: 67,
    minStock: 25,
    maxStock: 150,
    description: "Industry-leading noise canceling headphones",
    supplier: "Sony Corporation",
    createdAt: "2024-01-18",
    lastSold: "2024-01-25",
    totalSold: 156,
    reorderPoint: 35,
    leadTime: 3,
  },
  {
    id: "5",
    name: "Dell XPS 15",
    sku: "DEL-XPS15-005",
    price: 1899.99,
    cost: 1200.0,
    category: "Electronics",
    stock: 23,
    minStock: 10,
    maxStock: 50,
    description: "Creator laptop with OLED display",
    supplier: "Dell Technologies",
    createdAt: "2024-01-19",
    lastSold: "2024-01-22",
    totalSold: 41,
    reorderPoint: 15,
    leadTime: 7,
  },
  {
    id: "6",
    name: "iPad Pro 12.9 M2",
    sku: "IPD-PRO-006",
    price: 1299.99,
    cost: 820.0,
    category: "Electronics",
    stock: 38,
    minStock: 15,
    maxStock: 80,
    description: "Professional tablet with Liquid Retina XDR display",
    supplier: "Apple Inc.",
    createdAt: "2024-01-20",
    lastSold: "2024-01-24",
    totalSold: 78,
    reorderPoint: 20,
    leadTime: 7,
  },
  {
    id: "7",
    name: "Herman Miller Aeron Chair",
    sku: "HM-AERON-007",
    price: 1395.99,
    cost: 850.0,
    category: "Furniture",
    stock: 12,
    minStock: 5,
    maxStock: 30,
    description: "Ergonomic office chair with PostureFit SL",
    supplier: "Herman Miller",
    createdAt: "2024-01-21",
    lastSold: "2024-01-25",
    totalSold: 28,
    reorderPoint: 8,
    leadTime: 21,
  },
  {
    id: "8",
    name: "Standing Desk Pro",
    sku: "SDK-PRO-008",
    price: 799.99,
    cost: 450.0,
    category: "Furniture",
    stock: 15,
    minStock: 6,
    maxStock: 35,
    description: "Electric height-adjustable desk with memory presets",
    supplier: "Uplift Desk",
    createdAt: "2024-01-22",
    lastSold: "2024-01-23",
    totalSold: 22,
    reorderPoint: 10,
    leadTime: 14,
  },
  {
    id: "9",
    name: "Logitech MX Master 3S",
    sku: "LOG-MX3S-009",
    price: 99.99,
    cost: 55.0,
    category: "Electronics",
    stock: 89,
    minStock: 30,
    maxStock: 200,
    description: "Advanced wireless mouse for professionals",
    supplier: "Logitech International",
    createdAt: "2024-01-23",
    lastSold: "2024-01-25",
    totalSold: 234,
    reorderPoint: 45,
    leadTime: 2,
  },
  {
    id: "10",
    name: "LG UltraWide 34WP65C",
    sku: "LG-UW34-010",
    price: 549.99,
    cost: 320.0,
    category: "Electronics",
    stock: 28,
    minStock: 12,
    maxStock: 70,
    description: "34-inch curved UltraWide monitor",
    supplier: "LG Electronics",
    createdAt: "2024-01-24",
    lastSold: "2024-01-25",
    totalSold: 56,
    reorderPoint: 18,
    leadTime: 5,
  },
  {
    id: "11",
    name: "Mechanical Keyboard Pro",
    sku: "MKB-PRO-011",
    price: 179.99,
    cost: 95.0,
    category: "Electronics",
    stock: 45,
    minStock: 20,
    maxStock: 100,
    description: "RGB mechanical keyboard with Cherry MX switches",
    supplier: "Corsair Gaming",
    createdAt: "2024-01-25",
    lastSold: "2024-01-25",
    totalSold: 87,
    reorderPoint: 25,
    leadTime: 3,
  },
  {
    id: "12",
    name: "Webcam 4K Pro",
    sku: "WCM-4K-012",
    price: 199.99,
    cost: 110.0,
    category: "Electronics",
    stock: 34,
    minStock: 15,
    maxStock: 80,
    description: "4K webcam with auto-focus and noise reduction",
    supplier: "Logitech International",
    createdAt: "2024-01-26",
    lastSold: "2024-01-25",
    totalSold: 67,
    reorderPoint: 20,
    leadTime: 4,
  },
  {
    id: "13",
    name: "Office Lamp LED",
    sku: "OFL-LED-013",
    price: 89.99,
    cost: 45.0,
    category: "Furniture",
    stock: 56,
    minStock: 25,
    maxStock: 120,
    description: "Adjustable LED desk lamp with wireless charging",
    supplier: "Philips Lighting",
    createdAt: "2024-01-27",
    lastSold: "2024-01-24",
    totalSold: 123,
    reorderPoint: 30,
    leadTime: 6,
  },
  {
    id: "14",
    name: "Notebook Premium A5",
    sku: "NBK-A5-014",
    price: 24.99,
    cost: 8.0,
    category: "Stationery",
    stock: 145,
    minStock: 50,
    maxStock: 300,
    description: "Premium leather-bound notebook with dotted pages",
    supplier: "Moleskine",
    createdAt: "2024-01-28",
    lastSold: "2024-01-25",
    totalSold: 289,
    reorderPoint: 75,
    leadTime: 2,
  },
  {
    id: "15",
    name: "Pen Set Luxury",
    sku: "PEN-LUX-015",
    price: 149.99,
    cost: 65.0,
    category: "Stationery",
    stock: 23,
    minStock: 10,
    maxStock: 60,
    description: "Luxury fountain pen and ballpoint pen set",
    supplier: "Parker Pen Company",
    createdAt: "2024-01-29",
    lastSold: "2024-01-23",
    totalSold: 45,
    reorderPoint: 15,
    leadTime: 7,
  },
  {
    id: "16",
    name: "Bluetooth Speaker Portable",
    sku: "BTS-PORT-016",
    price: 129.99,
    cost: 70.0,
    category: "Electronics",
    stock: 67,
    minStock: 25,
    maxStock: 150,
    description: "Waterproof portable speaker with 20h battery",
    supplier: "JBL Audio",
    createdAt: "2024-01-30",
    lastSold: "2024-01-25",
    totalSold: 134,
    reorderPoint: 35,
    leadTime: 3,
  },
  {
    id: "17",
    name: "Monitor Stand Adjustable",
    sku: "MST-ADJ-017",
    price: 79.99,
    cost: 35.0,
    category: "Furniture",
    stock: 78,
    minStock: 30,
    maxStock: 180,
    description: "Ergonomic monitor stand with storage drawer",
    supplier: "VIVO Stands",
    createdAt: "2024-01-31",
    lastSold: "2024-01-24",
    totalSold: 156,
    reorderPoint: 40,
    leadTime: 5,
  },
  {
    id: "18",
    name: "USB-C Hub Pro",
    sku: "USB-HUB-018",
    price: 89.99,
    cost: 40.0,
    category: "Electronics",
    stock: 92,
    minStock: 35,
    maxStock: 200,
    description: "7-in-1 USB-C hub with 4K HDMI and fast charging",
    supplier: "Anker Innovations",
    createdAt: "2024-02-01",
    lastSold: "2024-01-25",
    totalSold: 178,
    reorderPoint: 50,
    leadTime: 2,
  },
  {
    id: "19",
    name: "Coffee Maker Premium",
    sku: "CFM-PREM-019",
    price: 299.99,
    cost: 180.0,
    category: "Kitchen",
    stock: 18,
    minStock: 8,
    maxStock: 45,
    description: "Automatic espresso machine with milk frother",
    supplier: "Breville",
    createdAt: "2024-02-02",
    lastSold: "2024-01-22",
    totalSold: 34,
    reorderPoint: 12,
    leadTime: 10,
  },
  {
    id: "20",
    name: "Water Bottle Smart",
    sku: "WTB-SMART-020",
    price: 49.99,
    cost: 22.0,
    category: "Kitchen",
    stock: 67,
    minStock: 25,
    maxStock: 150,
    description: "Smart water bottle with hydration tracking",
    supplier: "HidrateSpark",
    createdAt: "2024-02-03",
    lastSold: "2024-01-25",
    totalSold: 123,
    reorderPoint: 35,
    leadTime: 4,
  },
]

const initialStockMovements: StockMovement[] = [
  // Enero 2024
  {
    id: "1",
    productId: "1",
    productName: "iPhone 15 Pro Max",
    quantity: 50,
    type: "in",
    reason: "New stock arrival",
    date: "2024-01-01",
    cost: 750.0,
    reference: "PO-2024-001",
  },
  {
    id: "2",
    productId: "4",
    productName: "Sony WH-1000XM5",
    quantity: 30,
    type: "in",
    reason: "Restocking",
    date: "2024-01-02",
    cost: 220.0,
    reference: "PO-2024-002",
  },
  {
    id: "3",
    productId: "9",
    productName: "Logitech MX Master 3S",
    quantity: 100,
    type: "in",
    reason: "Bulk order",
    date: "2024-01-03",
    cost: 55.0,
    reference: "PO-2024-003",
  },
  {
    id: "4",
    productId: "1",
    productName: "iPhone 15 Pro Max",
    quantity: 8,
    type: "out",
    reason: "Customer sales",
    date: "2024-01-04",
    reference: "INV-2024-001",
  },
  {
    id: "5",
    productId: "14",
    productName: "Notebook Premium A5",
    quantity: 200,
    type: "in",
    reason: "New stock arrival",
    date: "2024-01-05",
    cost: 8.0,
    reference: "PO-2024-004",
  },
  {
    id: "6",
    productId: "4",
    productName: "Sony WH-1000XM5",
    quantity: 12,
    type: "out",
    reason: "Corporate sale",
    date: "2024-01-06",
    reference: "INV-2024-002",
  },
  {
    id: "7",
    productId: "16",
    productName: "Bluetooth Speaker Portable",
    quantity: 40,
    type: "in",
    reason: "Restocking",
    date: "2024-01-07",
    cost: 70.0,
    reference: "PO-2024-005",
  },
  {
    id: "8",
    productId: "18",
    productName: "USB-C Hub Pro",
    quantity: 80,
    type: "in",
    reason: "New product launch",
    date: "2024-01-08",
    cost: 40.0,
    reference: "PO-2024-006",
  },
  {
    id: "9",
    productId: "9",
    productName: "Logitech MX Master 3S",
    quantity: 25,
    type: "out",
    reason: "Bulk corporate sale",
    date: "2024-01-09",
    reference: "INV-2024-003",
  },
  {
    id: "10",
    productId: "2",
    productName: "Samsung Galaxy S24 Ultra",
    quantity: 35,
    type: "in",
    reason: "Restocking",
    date: "2024-01-10",
    cost: 680.0,
    reference: "PO-2024-007",
  },

  // Más movimientos para crear tendencias
  {
    id: "11",
    productId: "6",
    productName: "iPad Pro 12.9 M2",
    quantity: 15,
    type: "out",
    reason: "Customer sales",
    date: "2024-01-11",
    reference: "INV-2024-004",
  },
  {
    id: "12",
    productId: "11",
    productName: "Mechanical Keyboard Pro",
    quantity: 60,
    type: "in",
    reason: "New stock",
    date: "2024-01-12",
    cost: 95.0,
    reference: "PO-2024-008",
  },
  {
    id: "13",
    productId: "13",
    productName: "Office Lamp LED",
    quantity: 45,
    type: "in",
    reason: "Restocking",
    date: "2024-01-13",
    cost: 45.0,
    reference: "PO-2024-009",
  },
  {
    id: "14",
    productId: "17",
    productName: "Monitor Stand Adjustable",
    quantity: 50,
    type: "in",
    reason: "New stock",
    date: "2024-01-14",
    cost: 35.0,
    reference: "PO-2024-010",
  },
  {
    id: "15",
    productId: "20",
    productName: "Water Bottle Smart",
    quantity: 70,
    type: "in",
    reason: "Seasonal stock",
    date: "2024-01-15",
    cost: 22.0,
    reference: "PO-2024-011",
  },

  // Movimientos recientes
  {
    id: "16",
    productId: "1",
    productName: "iPhone 15 Pro Max",
    quantity: 5,
    type: "out",
    reason: "Customer sale",
    date: "2024-01-20",
    reference: "INV-2024-005",
  },
  {
    id: "17",
    productId: "4",
    productName: "Sony WH-1000XM5",
    quantity: 8,
    type: "out",
    reason: "Online orders",
    date: "2024-01-21",
    reference: "INV-2024-006",
  },
  {
    id: "18",
    productId: "9",
    productName: "Logitech MX Master 3S",
    quantity: 15,
    type: "out",
    reason: "Retail sales",
    date: "2024-01-22",
    reference: "INV-2024-007",
  },
  {
    id: "19",
    productId: "14",
    productName: "Notebook Premium A5",
    quantity: 30,
    type: "out",
    reason: "Back to school promotion",
    date: "2024-01-23",
    reference: "INV-2024-008",
  },
  {
    id: "20",
    productId: "16",
    productName: "Bluetooth Speaker Portable",
    quantity: 12,
    type: "out",
    reason: "Customer sales",
    date: "2024-01-24",
    reference: "INV-2024-009",
  },
  {
    id: "21",
    productId: "18",
    productName: "USB-C Hub Pro",
    quantity: 20,
    type: "out",
    reason: "Corporate bulk order",
    date: "2024-01-25",
    reference: "INV-2024-010",
  },
]

const initialSales: Sale[] = [
  // Ventas de Enero 2024 - Datos más extensos para gráficas
  {
    id: "1",
    productId: "1",
    productName: "iPhone 15 Pro Max",
    quantity: 2,
    unitPrice: 1199.99,
    totalAmount: 2399.98,
    date: "2024-01-01",
    customer: "John Smith",
  },
  {
    id: "2",
    productId: "4",
    productName: "Sony WH-1000XM5",
    quantity: 1,
    unitPrice: 399.99,
    totalAmount: 399.99,
    date: "2024-01-01",
    customer: "Sarah Johnson",
  },
  {
    id: "3",
    productId: "9",
    productName: "Logitech MX Master 3S",
    quantity: 3,
    unitPrice: 99.99,
    totalAmount: 299.97,
    date: "2024-01-02",
    customer: "TechCorp Inc.",
  },
  {
    id: "4",
    productId: "14",
    productName: "Notebook Premium A5",
    quantity: 5,
    unitPrice: 24.99,
    totalAmount: 124.95,
    date: "2024-01-02",
    customer: "Office Solutions",
  },
  {
    id: "5",
    productId: "16",
    productName: "Bluetooth Speaker Portable",
    quantity: 2,
    unitPrice: 129.99,
    totalAmount: 259.98,
    date: "2024-01-03",
    customer: "Maria Garcia",
  },

  {
    id: "6",
    productId: "2",
    productName: "Samsung Galaxy S24 Ultra",
    quantity: 1,
    unitPrice: 1099.99,
    totalAmount: 1099.99,
    date: "2024-01-04",
    customer: "David Wilson",
  },
  {
    id: "7",
    productId: "6",
    productName: "iPad Pro 12.9 M2",
    quantity: 1,
    unitPrice: 1299.99,
    totalAmount: 1299.99,
    date: "2024-01-04",
    customer: "Creative Studio LLC",
  },
  {
    id: "8",
    productId: "11",
    productName: "Mechanical Keyboard Pro",
    quantity: 4,
    unitPrice: 179.99,
    totalAmount: 719.96,
    date: "2024-01-05",
    customer: "Gaming Center",
  },
  {
    id: "9",
    productId: "18",
    productName: "USB-C Hub Pro",
    quantity: 6,
    unitPrice: 89.99,
    totalAmount: 539.94,
    date: "2024-01-05",
    customer: "Remote Workers Co.",
  },
  {
    id: "10",
    productId: "13",
    productName: "Office Lamp LED",
    quantity: 3,
    unitPrice: 89.99,
    totalAmount: 269.97,
    date: "2024-01-06",
    customer: "Home Office Plus",
  },

  {
    id: "11",
    productId: "1",
    productName: "iPhone 15 Pro Max",
    quantity: 1,
    unitPrice: 1199.99,
    totalAmount: 1199.99,
    date: "2024-01-07",
    customer: "Lisa Anderson",
  },
  {
    id: "12",
    productId: "17",
    productName: "Monitor Stand Adjustable",
    quantity: 8,
    unitPrice: 79.99,
    totalAmount: 639.92,
    date: "2024-01-07",
    customer: "Corporate Solutions",
  },
  {
    id: "13",
    productId: "20",
    productName: "Water Bottle Smart",
    quantity: 10,
    unitPrice: 49.99,
    totalAmount: 499.9,
    date: "2024-01-08",
    customer: "Fitness First",
  },
  {
    id: "14",
    productId: "12",
    productName: "Webcam 4K Pro",
    quantity: 2,
    unitPrice: 199.99,
    totalAmount: 399.98,
    date: "2024-01-08",
    customer: "Streaming Pro",
  },
  {
    id: "15",
    productId: "15",
    productName: "Pen Set Luxury",
    quantity: 1,
    unitPrice: 149.99,
    totalAmount: 149.99,
    date: "2024-01-09",
    customer: "Executive Gifts",
  },

  {
    id: "16",
    productId: "3",
    productName: "MacBook Pro 16 M3",
    quantity: 1,
    unitPrice: 2499.99,
    totalAmount: 2499.99,
    date: "2024-01-10",
    customer: "Video Production Co.",
  },
  {
    id: "17",
    productId: "5",
    productName: "Dell XPS 15",
    quantity: 1,
    unitPrice: 1899.99,
    totalAmount: 1899.99,
    date: "2024-01-10",
    customer: "Design Agency",
  },
  {
    id: "18",
    productId: "7",
    productName: "Herman Miller Aeron Chair",
    quantity: 1,
    unitPrice: 1395.99,
    totalAmount: 1395.99,
    date: "2024-01-11",
    customer: "Premium Office",
  },
  {
    id: "19",
    productId: "8",
    productName: "Standing Desk Pro",
    quantity: 1,
    unitPrice: 799.99,
    totalAmount: 799.99,
    date: "2024-01-11",
    customer: "Healthy Workspace",
  },
  {
    id: "20",
    productId: "19",
    productName: "Coffee Maker Premium",
    quantity: 2,
    unitPrice: 299.99,
    totalAmount: 599.98,
    date: "2024-01-12",
    customer: "Coffee Lovers Inc.",
  },

  // Más ventas para crear tendencias realistas
  {
    id: "21",
    productId: "4",
    productName: "Sony WH-1000XM5",
    quantity: 3,
    unitPrice: 399.99,
    totalAmount: 1199.97,
    date: "2024-01-13",
    customer: "Audio Enthusiasts",
  },
  {
    id: "22",
    productId: "9",
    productName: "Logitech MX Master 3S",
    quantity: 12,
    unitPrice: 99.99,
    totalAmount: 1199.88,
    date: "2024-01-13",
    customer: "Bulk Corporate Order",
  },
  {
    id: "23",
    productId: "14",
    productName: "Notebook Premium A5",
    quantity: 25,
    unitPrice: 24.99,
    totalAmount: 624.75,
    date: "2024-01-14",
    customer: "University Bookstore",
  },
  {
    id: "24",
    productId: "16",
    productName: "Bluetooth Speaker Portable",
    quantity: 5,
    unitPrice: 129.99,
    totalAmount: 649.95,
    date: "2024-01-14",
    customer: "Electronics Retailer",
  },
  {
    id: "25",
    productId: "18",
    productName: "USB-C Hub Pro",
    quantity: 8,
    unitPrice: 89.99,
    totalAmount: 719.92,
    date: "2024-01-15",
    customer: "Tech Startup",
  },

  // Ventas recientes para mostrar actividad
  {
    id: "26",
    productId: "1",
    productName: "iPhone 15 Pro Max",
    quantity: 3,
    unitPrice: 1199.99,
    totalAmount: 3599.97,
    date: "2024-01-20",
    customer: "Premium Mobile Store",
  },
  {
    id: "27",
    productId: "2",
    productName: "Samsung Galaxy S24 Ultra",
    quantity: 2,
    unitPrice: 1099.99,
    totalAmount: 2199.98,
    date: "2024-01-21",
    customer: "Mobile Solutions",
  },
  {
    id: "28",
    productId: "6",
    productName: "iPad Pro 12.9 M2",
    quantity: 4,
    unitPrice: 1299.99,
    totalAmount: 5199.96,
    date: "2024-01-22",
    customer: "Digital Artists Collective",
  },
  {
    id: "29",
    productId: "11",
    productName: "Mechanical Keyboard Pro",
    quantity: 6,
    unitPrice: 179.99,
    totalAmount: 1079.94,
    date: "2024-01-23",
    customer: "Gaming Community",
  },
  {
    id: "30",
    productId: "13",
    productName: "Office Lamp LED",
    quantity: 15,
    unitPrice: 89.99,
    totalAmount: 1349.85,
    date: "2024-01-24",
    customer: "Office Furniture Plus",
  },
  {
    id: "31",
    productId: "17",
    productName: "Monitor Stand Adjustable",
    quantity: 20,
    unitPrice: 79.99,
    totalAmount: 1599.8,
    date: "2024-01-25",
    customer: "Workspace Solutions",
  },
]

// Datos mock de stock por bodega
const initialProductStocks: ProductStock[] = [
  { productId: "1", warehouseId: "1", quantity: 25, reservedQuantity: 5, lastUpdated: "2024-01-25" },
  { productId: "1", warehouseId: "2", quantity: 15, reservedQuantity: 2, lastUpdated: "2024-01-25" },
  { productId: "1", warehouseId: "3", quantity: 5, reservedQuantity: 1, lastUpdated: "2024-01-25" },
  { productId: "2", warehouseId: "1", quantity: 10, reservedQuantity: 1, lastUpdated: "2024-01-25" },
  { productId: "2", warehouseId: "2", quantity: 15, reservedQuantity: 3, lastUpdated: "2024-01-25" },
  { productId: "2", warehouseId: "3", quantity: 7, reservedQuantity: 0, lastUpdated: "2024-01-25" },
  { productId: "3", warehouseId: "1", quantity: 12, reservedQuantity: 2, lastUpdated: "2024-01-25" },
  { productId: "3", warehouseId: "2", quantity: 4, reservedQuantity: 1, lastUpdated: "2024-01-25" },
  { productId: "3", warehouseId: "3", quantity: 2, reservedQuantity: 0, lastUpdated: "2024-01-25" },
]

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements)
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses)
  const [productStocks, setProductStocks] = useState<ProductStock[]>(initialProductStocks)

  const addProduct = (product: Omit<Product, "id" | "createdAt">) => {
    const newProduct: Product = {
      id: String(products.length + 1),
      createdAt: new Date().toISOString(),
      ...product,
    }
    setProducts([...products, newProduct])
  }

  const updateProduct = (id: string, product: Partial<Product>) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, ...product } : p)))
  }

  const deleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id))
  }

  const addStockMovement = (movement: Omit<StockMovement, "id" | "date">) => {
    const newMovement: StockMovement = {
      id: String(stockMovements.length + 1),
      date: new Date().toISOString(),
      ...movement,
    }
    setStockMovements([...stockMovements, newMovement])
  }

  const addSale = (sale: Omit<Sale, "id" | "date">) => {
    const newSale: Sale = {
      id: String(sales.length + 1),
      date: new Date().toISOString(),
      ...sale,
    }
    setSales([...sales, newSale])
  }

  const getProductById = (id: string) => products.find((p) => p.id === id)

  const getLowStockProducts = () => products.filter((p) => p.stock <= p.minStock)

  const getOverstockProducts = () => products.filter((p) => p.stock >= p.maxStock)

  const getStockByCategory = () => {
    const categoryStock: { [key: string]: { stock: number; value: number } } = {}

    products.forEach((product) => {
      if (!categoryStock[product.category]) {
        categoryStock[product.category] = { stock: 0, value: 0 }
      }
      categoryStock[product.category].stock += product.stock
      categoryStock[product.category].value += product.price * product.stock
    })

    return Object.entries(categoryStock).map(([category, { stock, value }]) => ({ category, stock, value }))
  }

  const getStockByWarehouse = () => {
    const warehouseStock: { [key: string]: { stock: number; value: number; products: number } } = {}

    warehouses.forEach((warehouse) => {
      warehouseStock[warehouse.name] = { stock: 0, value: 0, products: 0 }
    })

    productStocks.forEach((stock) => {
      const warehouse = warehouses.find(w => w.id === stock.warehouseId)
      const product = products.find(p => p.id === stock.productId)
      
      if (warehouse && product) {
        warehouseStock[warehouse.name].stock += stock.quantity
        warehouseStock[warehouse.name].value += product.price * stock.quantity
        warehouseStock[warehouse.name].products += 1
      }
    })

    return Object.entries(warehouseStock).map(([warehouse, { stock, value, products }]) => ({ 
      warehouse, stock, value, products 
    }))
  }

  const getStockHealthMetrics = () => {
    const totalProducts = products.length
    const lowStock = products.filter(p => p.stock <= p.minStock).length
    const overStock = products.filter(p => p.stock >= p.maxStock).length
    const optimalStock = totalProducts - lowStock - overStock
    const stockHealthPercentage = Math.round((optimalStock / totalProducts) * 100)

    return {
      totalProducts,
      lowStock,
      overStock,
      optimalStock,
      stockHealthPercentage
    }
  }

  const getRecentMovements = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split("T")[0]
    }).reverse()

    return last30Days.map((date) => {
      const dayMovements = stockMovements.filter((movement) => movement.date === date)
      let inMovements = dayMovements.filter((m) => m.type === "in").reduce((sum, m) => sum + m.quantity, 0)
      let outMovements = dayMovements.filter((m) => m.type === "out").reduce((sum, m) => sum + m.quantity, 0)

      // Simular datos para días sin movimientos reales
      if (inMovements === 0 && outMovements === 0) {
        inMovements = Math.floor(Math.random() * 50) + 10 // Entre 10-60
        outMovements = Math.floor(Math.random() * 40) + 5 // Entre 5-45
      }

      return { date, in: inMovements, out: outMovements }
    })
  }

  const getFinancialMetrics = () => {
    const totalInventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0)
    const totalInventoryCost = products.reduce((sum, product) => sum + product.cost * product.stock, 0)
    const grossMargin =
      totalInventoryValue > totalInventoryCost ? (totalInventoryValue - totalInventoryCost) / totalInventoryValue : 0

    const deadStock = products.filter((p) => p.stock === 0)
    const fastMovingItems = products.filter((p) => p.totalSold > 100)
    const slowMovingItems = products.filter((p) => p.totalSold <= 100)

    const abcAnalysis = {
      A: products.filter((p) => p.totalSold > 200),
      B: products.filter((p) => p.totalSold > 100 && p.totalSold <= 200),
      C: products.filter((p) => p.totalSold <= 100),
    }

    return {
      totalInventoryValue,
      totalInventoryCost,
      grossMargin,
      inventoryTurnover: 0, // Placeholder for actual calculation
      daysInventoryOutstanding: 0, // Placeholder for actual calculation
      deadStock,
      fastMovingItems,
      slowMovingItems,
      abcAnalysis,
    }
  }

  const getSalesAnalytics = () => {
    // Análisis de ventas diarias con datos más realistas
    const dailySales = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const daySales = sales.filter((sale) => sale.date === dateStr)
      const salesAmount = daySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const profit = daySales.reduce((sum, sale) => {
        const product = products.find((p) => p.id === sale.productId)
        return sum + (sale.unitPrice - (product?.cost || 0)) * sale.quantity
      }, 0)

      // Agregar datos simulados para días sin ventas reales
      const simulatedSales = salesAmount || Math.random() * 5000 + 1000
      const simulatedProfit = profit || simulatedSales * 0.3

      return {
        date: dateStr,
        sales: Math.round(simulatedSales),
        profit: Math.round(simulatedProfit),
      }
    }).reverse()

    // Top productos por ingresos
    const productSales = new Map<string, { revenue: number; quantity: number }>()
    sales.forEach((sale) => {
      const current = productSales.get(sale.productName) || { revenue: 0, quantity: 0 }
      productSales.set(sale.productName, {
        revenue: current.revenue + sale.totalAmount,
        quantity: current.quantity + sale.quantity,
      })
    })

    const topProducts = Array.from(productSales.entries())
      .map(([product, data]) => ({ product, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Performance por categoría con datos más completos
    const categoryPerformance = new Map<string, { revenue: number; cost: number }>()
    sales.forEach((sale) => {
      const product = products.find((p) => p.id === sale.productId)
      if (product) {
        const current = categoryPerformance.get(product.category) || { revenue: 0, cost: 0 }
        categoryPerformance.set(product.category, {
          revenue: current.revenue + sale.totalAmount,
          cost: current.cost + product.cost * sale.quantity,
        })
      }
    })

    const categoryPerf = Array.from(categoryPerformance.entries()).map(([category, data]) => ({
      category,
      revenue: data.revenue,
      profit: data.revenue - data.cost,
      margin: ((data.revenue - data.cost) / data.revenue) * 100,
    }))

    return { dailySales, topProducts, categoryPerformance: categoryPerf }
  }

  const getProfitabilityAnalysis = () => {
    // Rentabilidad por producto con datos más completos
    const productProfitability = products
      .map((product) => {
        const productSales = sales.filter((sale) => sale.productId === product.id)
        const revenue = productSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
        const cost = productSales.reduce((sum, sale) => sum + product.cost * sale.quantity, 0)
        const profit = revenue - cost
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0

        return {
          product: product.name,
          revenue,
          cost,
          profit,
          margin,
        }
      })
      .sort((a, b) => b.profit - a.profit)

    // Tendencias mensuales con datos simulados más realistas
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.toISOString().slice(0, 7)

      const monthSales = sales.filter((sale) => sale.date.startsWith(month))
      let revenue = monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      let cost = monthSales.reduce((sum, sale) => {
        const product = products.find((p) => p.id === sale.productId)
        return sum + (product?.cost || 0) * sale.quantity
      }, 0)

      // Simular datos para meses sin ventas reales
      if (revenue === 0) {
        revenue = Math.random() * 50000 + 20000 // Entre 20k y 70k
        cost = revenue * (0.6 + Math.random() * 0.2) // Costo entre 60-80% del revenue
      }

      return {
        month: date.toLocaleDateString("es-ES", { year: "numeric", month: "short" }),
        revenue: Math.round(revenue),
        cost: Math.round(cost),
        profit: Math.round(revenue - cost),
      }
    }).reverse()

    return { productProfitability, monthlyTrends }
  }

  return (
    <InventoryContext.Provider
      value={{
        products,
        stockMovements,
        sales,
        warehouses,
        productStocks,
        addProduct,
        updateProduct,
        deleteProduct,
        addStockMovement,
        addSale,
        getProductById,
        getLowStockProducts,
        getOverstockProducts,
        getStockByCategory,
        getStockByWarehouse,
        getRecentMovements,
        getFinancialMetrics,
        getSalesAnalytics,
        getProfitabilityAnalysis,
        getStockHealthMetrics,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider")
  }
  return context
}
