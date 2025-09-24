"use client"

import { ChevronUp, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InventoryValueProduct, SortConfig, SortField } from "@/lib/types/inventory-value"


interface InventoryTableProps {
  products: InventoryValueProduct[]
  sortConfig: SortConfig
  onSort: (field: SortField) => void
}

export function InventoryTable({ products, sortConfig, onSort }: InventoryTableProps) {
  const router = useRouter()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleSort = (field: SortField) => {
    onSort(field)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-camouflage-green-200">
      <Table>
        <TableHeader>
          <TableRow className="border-camouflage-green-200 hover:bg-transparent">
            <TableHead className="w-[220px] font-semibold text-camouflage-green-700">
              <div>
                <button
                  onClick={() => handleSort("name")}
                  className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                >
                  Ítem
                  <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                    <ChevronUp
                      className={`h-3 w-3 ${sortConfig.field === "name" && sortConfig.direction === "asc" ? "text-camouflage-green-900" : ""}`}
                    />
                    <ChevronDown
                      className={`h-3 w-3 ${sortConfig.field === "name" && sortConfig.direction === "desc" ? "text-camouflage-green-900" : ""}`}
                    />
                  </div>
                </button>
              </div>
            </TableHead>
            <TableHead className="w-[140px] font-semibold text-camouflage-green-700">Referencia</TableHead>
            <TableHead className="w-[250px] font-semibold text-camouflage-green-700">Descripción</TableHead>
            <TableHead className="w-[120px] font-semibold text-camouflage-green-700">
              <div>
                <button
                  onClick={() => handleSort("stock")}
                  className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                >
                  Cantidad
                  <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                    <ChevronUp
                      className={`h-3 w-3 ${sortConfig.field === "stock" && sortConfig.direction === "asc" ? "text-camouflage-green-900" : ""}`}
                    />
                    <ChevronDown
                      className={`h-3 w-3 ${sortConfig.field === "stock" && sortConfig.direction === "desc" ? "text-camouflage-green-900" : ""}`}
                    />
                  </div>
                </button>
              </div>
            </TableHead>
            <TableHead className="w-[120px] font-semibold text-camouflage-green-700">Unidad</TableHead>
            <TableHead className="w-[120px] font-semibold text-camouflage-green-700">Estado</TableHead>
            <TableHead className="w-[140px] font-semibold text-camouflage-green-700">
              <div>
                <button
                  onClick={() => handleSort("cost")}
                  className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                >
                  <span className="whitespace-nowrap">Costo promedio</span>
                  <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                    <ChevronUp
                      className={`h-3 w-3 ${sortConfig.field === "cost" && sortConfig.direction === "asc" ? "text-camouflage-green-900" : ""}`}
                    />
                    <ChevronDown
                      className={`h-3 w-3 ${sortConfig.field === "cost" && sortConfig.direction === "desc" ? "text-camouflage-green-900" : ""}`}
                    />
                  </div>
                </button>
              </div>
            </TableHead>
            <TableHead className="w-[140px] font-semibold text-camouflage-green-700">
              <div>
                <button
                  onClick={() => handleSort("total")}
                  className="group flex items-center gap-1 transition-colors hover:text-camouflage-green-900"
                >
                  Total
                  <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                    <ChevronUp
                      className={`h-3 w-3 ${sortConfig.field === "total" && sortConfig.direction === "asc" ? "text-camouflage-green-900" : ""}`}
                    />
                    <ChevronDown
                      className={`h-3 w-3 ${sortConfig.field === "total" && sortConfig.direction === "desc" ? "text-camouflage-green-900" : ""}`}
                    />
                  </div>
                </button>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
            >
              <TableCell className="w-[220px]">
                <button
                  onClick={() => router.push(`/inventory/items/${product.id}`)}
                  className="text-left font-medium text-camouflage-green-900 transition-colors hover:text-camouflage-green-700 hover:underline"
                >
                  {product.name}
                </button>
              </TableCell>
              <TableCell className="w-[140px]">
                <div className="font-mono text-sm text-camouflage-green-600">{product.sku}</div>
              </TableCell>
              <TableCell className="w-[250px]">
                <div
                  className="max-w-[230px] truncate text-sm text-camouflage-green-600"
                  title={product.description || "-"}
                >
                  {product.description || "-"}
                </div>
              </TableCell>
              <TableCell className="w-[120px]">
                <div className="">
                  <span
                    className={`min-w-[50px] rounded-full px-4 py-2 text-center text-sm font-semibold ${
                      product.stock > 0
                        ? "bg-camouflage-green-100 text-camouflage-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.stock.toLocaleString()}
                  </span>
                </div>
              </TableCell>
              <TableCell className="w-[120px] text-camouflage-green-700">{product.unit || "Unidad"}</TableCell>
              <TableCell className="w-[120px]">
                <Badge
                  variant={product.isActive ? "default" : "secondary"}
                  className={
                    product.isActive
                      ? "border-camouflage-green-300 bg-camouflage-green-100 text-camouflage-green-800 hover:bg-camouflage-green-100"
                      : "border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-100"
                  }
                >
                  {product.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="w-[140px] font-semibold text-camouflage-green-900">
                {formatCurrency(product.cost)}
              </TableCell>
              <TableCell className="w-[140px] font-bold text-camouflage-green-900">
                {formatCurrency(product.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {products.length === 0 && (
        <div className="py-8 text-center text-camouflage-green-600">
          <p>No se encontraron productos que coincidan con los filtros aplicados.</p>
        </div>
      )}
    </div>
  )
}
