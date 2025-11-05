"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InventoryValueProduct } from "@/lib/types/inventory-value"

interface InventoryTableProps {
  products: InventoryValueProduct[]
}

export function InventoryTable({ products }: InventoryTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-camouflage-green-200">
      <Table>
        <TableHeader>
          <TableRow className="border-camouflage-green-200 hover:bg-transparent">
            <TableHead className="pl-5 font-semibold text-camouflage-green-700">Producto</TableHead>
            <TableHead className="font-semibold text-camouflage-green-700">SKU</TableHead>
            <TableHead className="font-semibold text-camouflage-green-700">Bodega</TableHead>
            <TableHead className="font-semibold text-camouflage-green-700">Cantidad</TableHead>
            <TableHead className="font-semibold text-camouflage-green-700">Costo Unitario</TableHead>
            <TableHead className="font-semibold text-camouflage-green-700">Valor Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow
              key={`${product.codigoSku}-${product.bodega}-${index}`}
              className="border-camouflage-green-100 transition-colors hover:bg-camouflage-green-50/50"
            >
              <TableCell>
                <div className="pl-4 font-medium text-camouflage-green-900">{product.nombre}</div>
                <div className="pl-4 text-xs text-camouflage-green-500">{product.categoria}</div>
              </TableCell>
              <TableCell>
                <div className="font-mono text-sm text-camouflage-green-600">{product.codigoSku}</div>
              </TableCell>
              <TableCell className="text-camouflage-green-700">{product.bodega}</TableCell>
              <TableCell>
                <span
                  className={`min-w-[50px] rounded-full px-3 py-1 text-center text-sm font-semibold ${
                    product.cantidad > 0
                      ? "bg-camouflage-green-100 text-camouflage-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.cantidad.toLocaleString()}
                </span>
              </TableCell>
              <TableCell className="font-medium text-camouflage-green-900">
                {formatCurrency(product.costoUnitario)}
              </TableCell>
              <TableCell className="font-bold text-camouflage-green-900">
                {formatCurrency(product.valorTotal)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {products.length === 0 && (
        <div className="py-8 text-center text-camouflage-green-600">
          <p>No se encontraron productos con los filtros aplicados.</p>
        </div>
      )}
    </div>
  )
}
