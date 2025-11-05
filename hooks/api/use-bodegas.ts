/**
 * Hooks personalizados de React Query para Bodegas
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { bodegasService } from "@/lib/api/services/bodegas.service"
import type { BodegaBackend, CreateBodegaDto } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { NetworkError, ApiError } from "@/lib/api/errors"

/**
 * Query key factory para bodegas
 */
export const bodegasKeys = {
  all: ["bodegas"] as const,
  lists: () => [...bodegasKeys.all, "list"] as const,
  list: (params?: { activas?: boolean }) => [...bodegasKeys.lists(), params] as const,
}

/**
 * Hook para obtener bodegas activas (para formularios)
 */
export function useBodegas(onlyActive: boolean = true) {
  return useQuery({
    queryKey: bodegasKeys.list({ activas: onlyActive }),
    queryFn: async () => {
      const response = await bodegasService.getBodegas({
        activo: onlyActive ? true : undefined,
        pageSize: 100,
      })
      return response.data.items
    },
  })
}

/**
 * Hook para crear bodega
 */
export function useCreateBodega() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateBodegaDto) => {
      return await bodegasService.createBodega(data)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: bodegasKeys.lists() })
      
      toast({
        title: "Bodega creada",
        description: response.message || "Bodega creada exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al crear la bodega."
      let errorTitle = "Error al crear bodega"

      if (error instanceof NetworkError) {
        errorTitle = "Error de conexión"
        errorMessage = "No se pudo conectar con el servidor. Por favor, verifica que la API esté en ejecución e intenta nuevamente."
      } else if (error instanceof ApiError) {
        errorMessage = error.message || errorMessage
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      })
    },
  })
}

