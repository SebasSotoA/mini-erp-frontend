/**
 * Hooks personalizados de React Query para Bodegas
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { bodegasService } from "@/lib/api/services/bodegas.service"
import type { BodegaBackend, CreateBodegaDto, UpdateBodegaDto, ProductosQueryParams, ProductoBackend } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { NetworkError, ApiError } from "@/lib/api/errors"
import { mapProductoToProduct } from "@/lib/api/services/productos.service"
import type { Product } from "@/contexts/inventory-context"

/**
 * Query key factory para bodegas
 */
export const bodegasKeys = {
  all: ["bodegas"] as const,
  lists: () => [...bodegasKeys.all, "list"] as const,
  list: (params?: { page?: number; pageSize?: number; nombre?: string; activo?: boolean; orderBy?: string; orderDesc?: boolean }) => [...bodegasKeys.lists(), params] as const,
  details: () => [...bodegasKeys.all, "detail"] as const,
  detail: (id: string) => [...bodegasKeys.details(), id] as const,
  productos: (bodegaId: string, params?: ProductosQueryParams) => [...bodegasKeys.detail(bodegaId), "productos", params] as const,
}

/**
 * Hook para obtener bodegas con filtros y paginación
 */
export function useBodegas(params?: {
  page?: number
  pageSize?: number
  nombre?: string
  activo?: boolean
  orderBy?: string
  orderDesc?: boolean
}) {
  return useQuery({
    queryKey: bodegasKeys.list(params),
    queryFn: async () => {
      const response = await bodegasService.getBodegas(params)
      return {
        items: response.data?.items || [],
        page: response.data?.page || 1,
        pageSize: response.data?.pageSize || 20,
        totalCount: response.data?.totalCount || 0,
        totalPages: response.data?.totalPages || 0,
        hasPreviousPage: response.data?.hasPreviousPage || false,
        hasNextPage: response.data?.hasNextPage || false,
      }
    },
  })
}

/**
 * Hook para obtener bodegas activas (para formularios)
 */
export function useBodegasActive(onlyActive: boolean = true) {
  return useQuery({
    queryKey: bodegasKeys.list({ activo: onlyActive ? true : undefined }),
    queryFn: async () => {
      const response = await bodegasService.getBodegas({
        activo: onlyActive ? true : undefined,
        pageSize: 100,
      })
      return response.data?.items || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnMount: true,
  })
}

/**
 * Hook para obtener una bodega por ID
 */
export function useBodega(id: string | undefined) {
  return useQuery({
    queryKey: bodegasKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID is required")
      const response = await bodegasService.getBodegaById(id)
      return response.data
    },
    enabled: !!id,
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
      queryClient.invalidateQueries({ queryKey: bodegasKeys.all })
      
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

/**
 * Hook para actualizar bodega
 */
export function useUpdateBodega() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBodegaDto }) => {
      return await bodegasService.updateBodega(id, data)
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: bodegasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bodegasKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: bodegasKeys.all })
      
      toast({
        title: "Bodega actualizada",
        description: response.message || "Bodega actualizada exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al actualizar la bodega."
      let errorTitle = "Error al actualizar bodega"

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

/**
 * Hook para activar bodega
 */
export function useActivateBodega() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await bodegasService.activateBodega(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: bodegasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bodegasKeys.all })
      
      toast({
        title: "Bodega activada",
        description: response.message || "Bodega activada exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al activar la bodega."
      let errorTitle = "Error al activar bodega"

      if (error instanceof NetworkError) {
        errorTitle = "Error de conexión"
        errorMessage = "No se pudo conectar con el servidor."
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

/**
 * Hook para desactivar bodega
 */
export function useDeactivateBodega() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await bodegasService.deactivateBodega(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: bodegasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bodegasKeys.all })
      
      toast({
        title: "Bodega desactivada",
        description: response.message || "Bodega desactivada exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al desactivar la bodega."
      let errorTitle = "Error al desactivar bodega"

      if (error instanceof NetworkError) {
        errorTitle = "Error de conexión"
        errorMessage = "No se pudo conectar con el servidor."
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

/**
 * Hook para eliminar bodega
 */
export function useDeleteBodega() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await bodegasService.deleteBodega(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: bodegasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bodegasKeys.all })
      
      toast({
        title: "Bodega eliminada",
        description: response.message || "Bodega eliminada exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al eliminar la bodega."
      let errorTitle = "Error al eliminar bodega"

      if (error instanceof NetworkError) {
        errorTitle = "Error de conexión"
        errorMessage = "No se pudo conectar con el servidor."
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

/**
 * Hook para obtener productos de una bodega específica
 */
export function useBodegaProductos(bodegaId: string | undefined, params?: ProductosQueryParams) {
  return useQuery({
    queryKey: bodegasKeys.productos(bodegaId || "", params),
    queryFn: async () => {
      if (!bodegaId) throw new Error("Bodega ID is required")
      const response = await bodegasService.getBodegaProductos(bodegaId, params)
      return {
        items: (response.data?.items || []).map((producto: ProductoBackend) => {
          // Mapear usando cantidad específica de la bodega si está disponible
          const mapped = mapProductoToProduct(producto)
          // Si viene cantidadEnBodega (cantidad específica en esta bodega), usarla en lugar de stockActual
          if (producto.cantidadEnBodega !== undefined) {
            mapped.stock = producto.cantidadEnBodega
            // Preservar cantidadEnBodega directamente en el objeto para acceso directo
            ;(mapped as any).cantidadEnBodega = producto.cantidadEnBodega
          }
          // También preservar el objeto original del backend para acceso a campos adicionales
          ;(mapped as any).productoBackend = producto
          return mapped
        }),
        page: response.data?.page || 1,
        pageSize: response.data?.pageSize || 20,
        totalCount: response.data?.totalCount || 0,
        totalPages: response.data?.totalPages || 0,
        hasPreviousPage: response.data?.hasPreviousPage || false,
        hasNextPage: response.data?.hasNextPage || false,
      }
    },
    enabled: !!bodegaId,
  })
}

