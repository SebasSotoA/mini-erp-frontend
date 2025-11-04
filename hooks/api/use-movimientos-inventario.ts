/**
 * Hooks personalizados de React Query para Movimientos de Inventario
 */

import { useQuery } from "@tanstack/react-query"
import { movimientosInventarioService } from "@/lib/api/services/movimientos-inventario.service"
import type { StockMovement } from "@/contexts/inventory-context"

/**
 * Query key factory para movimientos
 */
export const movimientosKeys = {
  all: ["movimientos-inventario"] as const,
  byProducto: (productoId: string) => [...movimientosKeys.all, "producto", productoId] as const,
}

/**
 * Hook para obtener movimientos (kardex) de un producto
 */
export function useMovimientosByProducto(productoId: string | undefined) {
  return useQuery({
    queryKey: movimientosKeys.byProducto(productoId || ""),
    queryFn: async () => {
      if (!productoId) throw new Error("Product ID is required")
      const movimientos = await movimientosInventarioService.getMovimientosByProducto(productoId)
      // Ordenar por fecha descendente (más recientes primero)
      return movimientos.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })
    },
    enabled: !!productoId,
  })
}

