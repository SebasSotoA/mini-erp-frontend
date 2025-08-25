"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
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
} from "lucide-react"
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
  { name: "Gestión de Items", href: "/inventory/management", icon: Package },
  { name: "Bodegas", href: "/inventory/warehouses", icon: Warehouse },
  { name: "Categorías", href: "/inventory/categories", icon: Tags },
  { name: "Atributos", href: "/inventory/attributes", icon: Layers },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isInventoryOpen, setIsInventoryOpen] = useState(
    pathname.startsWith("/inventory") || pathname.startsWith("/products") || pathname.startsWith("/stock"),
  )

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Inventory Pro</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-6">
        {/* Inicio */}
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700",
                )}
              />
              <div>
                <div>{item.name}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </Link>
          )
        })}

        {/* Inventario con submenú */}
        <div className="space-y-1">
          <button
            onClick={() => setIsInventoryOpen(!isInventoryOpen)}
            className={cn(
              "w-full group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              pathname.startsWith("/inventory") || pathname.startsWith("/products") || pathname.startsWith("/stock")
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            <div className="flex items-center">
              <Package
                className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  pathname.startsWith("/inventory") || pathname.startsWith("/products") || pathname.startsWith("/stock")
                    ? "text-blue-600"
                    : "text-gray-500 group-hover:text-gray-700",
                )}
              />
              <div>
                <div>Inventario</div>
                <div className="text-xs text-gray-500">Gestión completa</div>
              </div>
            </div>
            {isInventoryOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {/* Submenú de Inventario */}
          {isInventoryOpen && (
            <div className="ml-6 space-y-1 border-l border-gray-200 pl-4">
              {inventoryNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-2 h-4 w-4",
                        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600",
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
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Usuario</p>
            <p className="text-xs text-gray-500 truncate">admin@inventorypro.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
