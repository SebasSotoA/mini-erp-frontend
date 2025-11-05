/**
 * Hooks personalizados de React Query para Inventario
 */

import { useQuery } from "@tanstack/react-query"
import { inventarioService } from "@/lib/api/services/inventario.service"
import type { InventarioFilterDto, InventarioResumenDto } from "@/lib/api/types"

/**
 * Query key factory para inventario
 */
export const inventarioKeys = {
  all: ["inventario"] as const,
  resumen: (params?: InventarioFilterDto) => [...inventarioKeys.all, "resumen", params] as const,
}

/**
 * Hook para obtener el resumen de inventario con filtros y paginación
 */
export function useInventarioResumen(params?: InventarioFilterDto) {
  return useQuery({
    queryKey: inventarioKeys.resumen(params),
    queryFn: async () => {
      const response = await inventarioService.getInventarioResumen(params)
      return response.data
    },
    enabled: true, // Siempre habilitado
  })
}

