/**
 * Hooks personalizados de React Query para Categorías
 */

import { useQuery } from "@tanstack/react-query"
import { categoriasService } from "@/lib/api/services/categorias.service"
import type { CategoriaBackend } from "@/lib/api/types"

/**
 * Query key factory para categorías
 */
export const categoriasKeys = {
  all: ["categorias"] as const,
  lists: () => [...categoriasKeys.all, "list"] as const,
  list: (params?: { activas?: boolean }) => [...categoriasKeys.lists(), params] as const,
}

/**
 * Hook para obtener categorías activas (para formularios)
 */
export function useCategorias(onlyActive: boolean = true) {
  return useQuery({
    queryKey: categoriasKeys.list({ activas: onlyActive }),
    queryFn: async () => {
      const response = await categoriasService.getCategorias({
        activo: onlyActive ? true : undefined,
        pageSize: 100,
      })
      return response.data.items
    },
  })
}

