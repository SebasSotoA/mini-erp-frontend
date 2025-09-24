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
  { name: "Gestión de Items", href: "/inventory/management", icon: Package },
  { name: "Bodegas", href: "/inventory/warehouses", icon: Warehouse },
  { name: "Categorías", href: "/inventory/categories", icon: Tags },
  { name: "Atributos", href: "/inventory/attributes", icon: Layers },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const pathname = usePathname()
  const [isInventoryOpen, setIsInventoryOpen] = useState(
    pathname.startsWith("/inventory") || pathname.startsWith("/products") || pathname.startsWith("/stock"),
  )

  return (
    <div className="flex h-full w-64 flex-col border-r border-camouflage-green-500 bg-camouflage-green-800 shadow-lg">
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
      <nav className="flex-1 space-y-2 px-4 py-6">
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
              pathname.startsWith("/inventory") || pathname.startsWith("/products") || pathname.startsWith("/stock")
                ? "border border-camouflage-green-500 bg-camouflage-green-600 text-white shadow-md"
                : "text-camouflage-green-100 hover:bg-camouflage-green-700 hover:text-white",
            )}
          >
            <div className="flex items-center">
              <Package
                className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  pathname.startsWith("/inventory") || pathname.startsWith("/products") || pathname.startsWith("/stock")
                    ? "text-white"
                    : "text-camouflage-green-200 group-hover:text-white",
                )}
              />
              <div>
                <div className="pr-8">Inventario</div>
                <div
                  className={cn(
                    "text-xs transition-colors",
                    pathname.startsWith("/inventory") ||
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
