"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown } from "lucide-react"
import { InventoryValueProduct, SortConfig, SortField } from "@/lib/types/inventory-value"
import { useRouter } from "next/navigation"

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
    <div className="border border-camouflage-green-200 rounded-lg overflow-hidden">
             <Table>
         <TableHeader>
           <TableRow className="hover:bg-transparent border-camouflage-green-200">
             <TableHead 
               className="w-[220px] text-camouflage-green-700 font-semibold"
             >
               <div>
                 <button
                   onClick={() => handleSort('name')}
                   className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group"
                 >
                   Ítem
                   <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                     <ChevronUp className={`h-3 w-3 ${sortConfig.field === 'name' && sortConfig.direction === 'asc' ? 'text-camouflage-green-900' : ''}`} />
                     <ChevronDown className={`h-3 w-3 ${sortConfig.field === 'name' && sortConfig.direction === 'desc' ? 'text-camouflage-green-900' : ''}`} />
                   </div>
                 </button>
               </div>
             </TableHead>
             <TableHead className="w-[140px] text-camouflage-green-700 font-semibold">Referencia</TableHead>
             <TableHead className="w-[250px] text-camouflage-green-700 font-semibold">Descripción</TableHead>
             <TableHead 
               className="w-[120px] text-camouflage-green-700 font-semibold"
             >
               <div>
                 <button
                   onClick={() => handleSort('stock')}
                   className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group"
                 >
                   Cantidad
                   <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                     <ChevronUp className={`h-3 w-3 ${sortConfig.field === 'stock' && sortConfig.direction === 'asc' ? 'text-camouflage-green-900' : ''}`} />
                     <ChevronDown className={`h-3 w-3 ${sortConfig.field === 'stock' && sortConfig.direction === 'desc' ? 'text-camouflage-green-900' : ''}`} />
                   </div>
                 </button>
               </div>
             </TableHead>
             <TableHead className="w-[120px] text-camouflage-green-700 font-semibold">Unidad</TableHead>
             <TableHead className="w-[120px] text-camouflage-green-700 font-semibold">Estado</TableHead>
             <TableHead 
               className="w-[140px] text-camouflage-green-700 font-semibold"
             >
               <div>
                 <button
                   onClick={() => handleSort('cost')}
                   className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group"
                 >
                   <span className="whitespace-nowrap">Costo promedio</span>
                   <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                     <ChevronUp className={`h-3 w-3 ${sortConfig.field === 'cost' && sortConfig.direction === 'asc' ? 'text-camouflage-green-900' : ''}`} />
                     <ChevronDown className={`h-3 w-3 ${sortConfig.field === 'cost' && sortConfig.direction === 'desc' ? 'text-camouflage-green-900' : ''}`} />
                   </div>
                 </button>
               </div>
             </TableHead>
             <TableHead 
               className="w-[140px] text-camouflage-green-700 font-semibold"
             >
               <div>
                 <button
                   onClick={() => handleSort('total')}
                   className="flex items-center gap-1 hover:text-camouflage-green-900 transition-colors group"
                 >
                   Total
                   <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                     <ChevronUp className={`h-3 w-3 ${sortConfig.field === 'total' && sortConfig.direction === 'asc' ? 'text-camouflage-green-900' : ''}`} />
                     <ChevronDown className={`h-3 w-3 ${sortConfig.field === 'total' && sortConfig.direction === 'desc' ? 'text-camouflage-green-900' : ''}`} />
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
              className="border-camouflage-green-100 hover:bg-camouflage-green-50/50 transition-colors"
            >
              <TableCell className="w-[220px]">
                <button
                  onClick={() => router.push(`/inventory/items/${product.id}`)}
                  className="font-medium text-camouflage-green-900 hover:text-camouflage-green-700 hover:underline transition-colors text-left"
                >
                  {product.name}
                </button>
              </TableCell>
              <TableCell className="w-[140px]">
                <div className="text-camouflage-green-600 font-mono text-sm">{product.sku}</div>
              </TableCell>
              <TableCell className="w-[250px]">
                <div className="text-camouflage-green-600 text-sm max-w-[230px] truncate" title={product.description || '-'}>
                  {product.description || '-'}
                </div>
              </TableCell>
              <TableCell className="w-[120px]">
                <div className="">
                  <span
                    className={`px-4 py-2 text-sm font-semibold rounded-full min-w-[50px] text-center ${
                      product.stock > 0 
                        ? "bg-camouflage-green-100 text-camouflage-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.stock.toLocaleString()}
                  </span>
                </div>
              </TableCell>
              <TableCell className="w-[120px] text-camouflage-green-700">
                {product.unit || 'Unidad'}
              </TableCell>
              <TableCell className="w-[120px]">
                <Badge 
                  variant={product.isActive ? "default" : "secondary"}
                  className={
                    product.isActive 
                      ? "bg-camouflage-green-100 text-camouflage-green-800 border-camouflage-green-300 hover:bg-camouflage-green-100" 
                      : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-100"
                  }
                >
                  {product.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="w-[140px] text-camouflage-green-900 font-semibold">
                {formatCurrency(product.cost)}
              </TableCell>
              <TableCell className="w-[140px] text-camouflage-green-900 font-bold">
                {formatCurrency(product.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {products.length === 0 && (
        <div className="text-center py-8 text-camouflage-green-600">
          <p>No se encontraron productos que coincidan con los filtros aplicados.</p>
        </div>
      )}
    </div>
  )
}
