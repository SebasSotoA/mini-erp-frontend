"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaginationConfig } from "@/lib/types/inventory-value"

interface PaginationControlsProps {
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

export function PaginationControls({ pagination, onPageChange, onItemsPerPageChange }: PaginationControlsProps) {
  const { currentPage, itemsPerPage, totalItems, totalPages } = pagination

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-camouflage-green-200 bg-camouflage-green-50/30 px-4 py-3 sm:flex-row">
      {/* Información de resultados */}
      <div className="text-sm text-camouflage-green-700">
        Mostrando {startItem} a {endItem} de {totalItems.toLocaleString()} resultados
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Items por página */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-camouflage-green-700">Mostrar:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(parseInt(value))}>
            <SelectTrigger className="h-8 w-[65px] border-camouflage-green-300 bg-white text-camouflage-green-900 focus:border-camouflage-green-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-camouflage-green-200 bg-white">
              <SelectItem value="10" className="text-camouflage-green-900 hover:bg-camouflage-green-50">
                10
              </SelectItem>
              <SelectItem value="20" className="text-camouflage-green-900 hover:bg-camouflage-green-50">
                20
              </SelectItem>
              <SelectItem value="50" className="text-camouflage-green-900 hover:bg-camouflage-green-50">
                50
              </SelectItem>
              <SelectItem value="100" className="text-camouflage-green-900 hover:bg-camouflage-green-50">
                100
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Navegación de páginas */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-700 hover:bg-camouflage-green-50 disabled:opacity-50"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-700 hover:bg-camouflage-green-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Páginas */}
          <div className="mx-2 flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber: number

              if (totalPages <= 5) {
                pageNumber = i + 1
              } else if (currentPage <= 3) {
                pageNumber = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i
              } else {
                pageNumber = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNumber}
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  className={`h-8 w-8 p-0 ${
                    currentPage === pageNumber
                      ? "border-camouflage-green-600 bg-camouflage-green-600 text-white hover:bg-camouflage-green-700"
                      : "border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                  }`}
                >
                  {pageNumber}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-700 hover:bg-camouflage-green-50 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 border-camouflage-green-300 p-0 text-camouflage-green-700 hover:bg-camouflage-green-50 disabled:opacity-50"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
