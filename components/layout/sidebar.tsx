"use client"

import {
  Home,
  Package,
  ShoppingCart,
  DollarSign,
  Warehouse,
  Tags,
  Layers,
  ChevronDown,
  ChevronRight,
  BarChart3,
  X,
  History,
  FileText,
  Receipt,
  Building2,
  Users,
  Handshake,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Inicio",
    href: "/dashboard",
    icon: Home,
    description: "Tableros y análisis",
  },
]

const inventoryNavigation = [
  { name: "Items de venta", href: "/inventory/items", icon: ShoppingCart },
  { name: "Valor de Inventario", href: "/inventory/value", icon: DollarSign },
  { name: "Bodegas", href: "/inventory/warehouses", icon: Warehouse },
  { name: "Categorías", href: "/inventory/categories", icon: Tags },
  { name: "Campos Extra", href: "/inventory/extra-fields", icon: Layers },
  { name: "Historial", href: "/inventory/movements", icon: History }
]

const partnersNavigation = [
  { name: "Proveedores", href: "/inventory/providers", icon: Building2 },
  { name: "Vendedores", href: "/inventory/salespersons", icon: Users },
]

const invoiceNavigation = [
  { name: "Facturas de Venta", href: "/invoices/sales", icon: Receipt },
  { name: "Facturas de Compra", href: "/invoices/purchase", icon: FileText },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const pathname = usePathname()
  const [isInventoryOpen, setIsInventoryOpen] = useState(
    (pathname.startsWith("/inventory") && !pathname.startsWith("/inventory/providers") && !pathname.startsWith("/inventory/salespersons")) || 
    pathname.startsWith("/products") || 
    pathname.startsWith("/stock")
  )
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(
    pathname.startsWith("/invoices")
  )
  const [isPartnersOpen, setIsPartnersOpen] = useState(
    pathname.startsWith("/inventory/providers") || pathname.startsWith("/inventory/salespersons")
  )

  return (
    <div className="flex h-full w-64 flex-col overflow-hidden border-r border-camouflage-green-500 bg-camouflage-green-800 shadow-lg">
      {/* Mobile close button */}
      {onClose && (
        <div className="flex justify-end p-4 lg:hidden">
          <button
            onClick={onClose}
            className="rounded-md p-2 text-camouflage-green-200 hover:bg-camouflage-green-700 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex h-16 items-center border-b border-camouflage-green-700 px-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-camouflage-green-500 shadow-md">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Inventory Pro</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {/* Inicio */}
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border border-camouflage-green-500 bg-camouflage-green-600 text-white shadow-md"
                  : "text-camouflage-green-100 hover:bg-camouflage-green-700 hover:text-white",
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  isActive ? "text-white" : "mr-3 text-camouflage-green-200 group-hover:text-white",
                )}
              />
              <div>
                <div>{item.name}</div>
                <div
                  className={cn(
                    "text-xs transition-colors",
                    isActive
                      ? "text-camouflage-green-100"
                      : "text-camouflage-green-300 group-hover:text-camouflage-green-200",
                  )}
                >
                  {item.description}
                </div>
              </div>
            </Link>
          )
        })}

        {/* Inventario con submenú */}
        <div className="space-y-1">
          <button
            onClick={() => setIsInventoryOpen(!isInventoryOpen)}
            className={cn(
              "group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              (pathname.startsWith("/inventory") && !pathname.startsWith("/inventory/providers") && !pathname.startsWith("/inventory/salespersons")) || pathname.startsWith("/products") || pathname.startsWith("/stock")
                ? "border border-camouflage-green-500 bg-camouflage-green-600 text-white shadow-md"
                : "text-camouflage-green-100 hover:bg-camouflage-green-700 hover:text-white",
            )}
          >
            <div className="flex items-center">
              <Package
                className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  (pathname.startsWith("/inventory") && !pathname.startsWith("/inventory/providers") && !pathname.startsWith("/inventory/salespersons")) || pathname.startsWith("/products") || pathname.startsWith("/stock")
                    ? "text-white"
                    : "text-camouflage-green-200 group-hover:text-white",
                )}
              />
              <div>
                <div className="pr-8">Inventario</div>
                <div
                  className={cn(
                    "text-xs transition-colors",
                    (pathname.startsWith("/inventory") && !pathname.startsWith("/inventory/providers") && !pathname.startsWith("/inventory/salespersons")) ||
                      pathname.startsWith("/products") ||
                      pathname.startsWith("/stock")
                      ? "text-camouflage-green-100"
                      : "text-camouflage-green-300 group-hover:text-camouflage-green-200",
                  )}
                >
                  Gestión completa
                </div>
              </div>
            </div>
            {isInventoryOpen ? (
              <ChevronDown className="h-4 w-4 text-camouflage-green-200" />
            ) : (
              <ChevronRight className="h-4 w-4 text-camouflage-green-200" />
            )}
          </button>

          {/* Submenú de Inventario */}
          {isInventoryOpen && (
            <div className="ml-6 space-y-1 border-l border-camouflage-green-600 pl-4">
              {inventoryNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-camouflage-green-500 font-medium text-white shadow-sm"
                        : "text-camouflage-green-200 hover:bg-camouflage-green-600 hover:text-white",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-2 h-4 w-4",
                        isActive ? "text-white" : "text-camouflage-green-300 group-hover:text-white",
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Terceros con submenú */}
        <div className="space-y-1">
          <button
            onClick={() => setIsPartnersOpen(!isPartnersOpen)}
            className={cn(
              "group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname.startsWith("/inventory/providers") || pathname.startsWith("/inventory/salespersons")
                ? "border border-camouflage-green-500 bg-camouflage-green-600 text-white shadow-md"
                : "text-camouflage-green-100 hover:bg-camouflage-green-700 hover:text-white",
            )}
          >
            <div className="flex items-center">
              <Handshake
                className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  pathname.startsWith("/inventory/providers") || pathname.startsWith("/inventory/salespersons")
                    ? "text-white"
                    : "text-camouflage-green-200 group-hover:text-white",
                )}
              />
              <div>
                <div className="pr-14">Terceros</div>
                <div
                  className={cn(
                    "text-xs transition-colors",
                    pathname.startsWith("/inventory/providers") || pathname.startsWith("/inventory/salespersons")
                      ? "text-camouflage-green-100"
                      : "text-camouflage-green-300 group-hover:text-camouflage-green-200",
                  )}
                >
                  Gestión de terceros
                </div>
              </div>
            </div>
            {isPartnersOpen ? (
              <ChevronDown className="h-4 w-4 text-camouflage-green-200" />
            ) : (
              <ChevronRight className="h-4 w-4 text-camouflage-green-200" />
            )}
          </button>

          {/* Submenú de Terceros */}
          {isPartnersOpen && (
            <div className="ml-6 space-y-1 border-l border-camouflage-green-600 pl-4">
              {partnersNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-camouflage-green-500 font-medium text-white shadow-sm"
                        : "text-camouflage-green-200 hover:bg-camouflage-green-600 hover:text-white",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-2 h-4 w-4",
                        isActive ? "text-white" : "text-camouflage-green-300 group-hover:text-white",
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Facturación con submenú */}
        <div className="space-y-1">
          <button
            onClick={() => setIsInvoiceOpen(!isInvoiceOpen)}
            className={cn(
              "group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname.startsWith("/invoices")
                ? "border border-camouflage-green-500 bg-camouflage-green-600 text-white shadow-md"
                : "text-camouflage-green-100 hover:bg-camouflage-green-700 hover:text-white",
            )}
          >
            <div className="flex items-center">
              <FileText
                className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  pathname.startsWith("/invoices")
                    ? "text-white"
                    : "text-camouflage-green-200 group-hover:text-white",
                )}
              />
              <div>
                <div className="pr-6">Facturación</div>
                <div
                  className={cn(
                    "text-xs transition-colors",
                    pathname.startsWith("/invoices")
                      ? "text-camouflage-green-100"
                      : "text-camouflage-green-300 group-hover:text-camouflage-green-200",
                  )}
                >
                  Ventas y compras
                </div>
              </div>
            </div>
            {isInvoiceOpen ? (
              <ChevronDown className="h-4 w-4 text-camouflage-green-200" />
            ) : (
              <ChevronRight className="h-4 w-4 text-camouflage-green-200" />
            )}
          </button>

          {/* Submenú de Facturación */}
          {isInvoiceOpen && (
            <div className="ml-6 space-y-1 border-l border-camouflage-green-600 pl-4">
              {invoiceNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-camouflage-green-500 font-medium text-white shadow-sm"
                        : "text-camouflage-green-200 hover:bg-camouflage-green-600 hover:text-white",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-2 h-4 w-4",
                        isActive ? "text-white" : "text-camouflage-green-300 group-hover:text-white",
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-camouflage-green-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-camouflage-green-500 shadow-md">
            <span className="text-sm font-medium text-white">U</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">Usuario</p>
            <p className="truncate text-xs text-camouflage-green-200">admin@inventorypro.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
