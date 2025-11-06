/**
 * Hooks personalizados de React Query para Categorías
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { categoriasService } from "@/lib/api/services/categorias.service"
import type { CategoriaBackend, CreateCategoriaDto, UpdateCategoriaDto, ProductosQueryParams } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { NetworkError, ApiError } from "@/lib/api/errors"
import { mapProductoToProduct } from "@/lib/api/services/productos.service"
import type { Product } from "@/contexts/inventory-context"

/**
 * Query key factory para categorías
 */
export const categoriasKeys = {
  all: ["categorias"] as const,
  lists: () => [...categoriasKeys.all, "list"] as const,
  list: (params?: { page?: number; pageSize?: number; nombre?: string; activo?: boolean; orderBy?: string; orderDesc?: boolean }) => [...categoriasKeys.lists(), params] as const,
  details: () => [...categoriasKeys.all, "detail"] as const,
  detail: (id: string) => [...categoriasKeys.details(), id] as const,
  productos: (categoriaId: string, params?: ProductosQueryParams) => [...categoriasKeys.detail(categoriaId), "productos", params] as const,
}

/**
 * Hook para obtener categorías con filtros y paginación
 */
export function useCategorias(params?: {
  page?: number
  pageSize?: number
  nombre?: string
  activo?: boolean
  orderBy?: string
  orderDesc?: boolean
}) {
  return useQuery({
    queryKey: categoriasKeys.list(params),
    queryFn: async () => {
      const response = await categoriasService.getCategorias(params)
      return {
        items: response.data.items,
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalCount: response.data.totalCount,
        totalPages: response.data.totalPages,
        hasPreviousPage: response.data.hasPreviousPage,
        hasNextPage: response.data.hasNextPage,
      }
    },
  })
}

/**
 * Hook para obtener categorías activas (para formularios)
 */
export function useCategoriasActive(onlyActive: boolean = true) {
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

/**
 * Hook para obtener una categoría por ID
 */
export function useCategoria(id: string | undefined) {
  return useQuery({
    queryKey: categoriasKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID is required")
      const response = await categoriasService.getCategoriaById(id)
      return response.data
    },
    enabled: !!id,
  })
}

/**
 * Hook para crear categoría
 */
export function useCreateCategoria() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateCategoriaDto) => {
      return await categoriasService.createCategoria(data)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoriasKeys.all })
      
      toast({
        title: "Categoría creada",
        description: response.message || "Categoría creada exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al crear la categoría."
      let errorTitle = "Error al crear categoría"

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
 * Hook para actualizar categoría
 */
export function useUpdateCategoria() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoriaDto }) => {
      return await categoriasService.updateCategoria(id, data)
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoriasKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: categoriasKeys.all })
      
      toast({
        title: "Categoría actualizada",
        description: response.message || "Categoría actualizada exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al actualizar la categoría."
      let errorTitle = "Error al actualizar categoría"

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
 * Hook para activar categoría
 */
export function useActivateCategoria() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await categoriasService.activateCategoria(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoriasKeys.all })
      
      toast({
        title: "Categoría activada",
        description: response.message || "Categoría activada exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al activar la categoría."
      let errorTitle = "Error al activar categoría"

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
 * Hook para desactivar categoría
 */
export function useDeactivateCategoria() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await categoriasService.deactivateCategoria(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoriasKeys.all })
      
      toast({
        title: "Categoría desactivada",
        description: response.message || "Categoría desactivada exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al desactivar la categoría."
      let errorTitle = "Error al desactivar categoría"

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
 * Hook para eliminar categoría
 */
export function useDeleteCategoria() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await categoriasService.deleteCategoria(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoriasKeys.all })
      
      toast({
        title: "Categoría eliminada",
        description: response.message || "Categoría eliminada exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al eliminar la categoría."
      let errorTitle = "Error al eliminar categoría"

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
 * Hook para obtener productos de una categoría específica
 */
export function useCategoriaProductos(categoriaId: string | undefined, params?: ProductosQueryParams) {
  return useQuery({
    queryKey: categoriasKeys.productos(categoriaId || "", params),
    queryFn: async () => {
      if (!categoriaId) throw new Error("Categoria ID is required")
      const response = await categoriasService.getCategoriaProductos(categoriaId, params)
      return {
        items: response.data.items.map((producto) => {
          // Mapear usando cantidad específica de la categoría si está disponible
          const mapped = mapProductoToProduct(producto)
          // Si viene cantidadEnCategoria (cantidad específica en esta categoría), usarla en lugar de stockActual
          // Nota: cantidadEnCategoria siempre es igual a stockActual para categorías, pero se incluye por consistencia
          if ((producto as any).cantidadEnCategoria !== undefined) {
            mapped.stock = (producto as any).cantidadEnCategoria
          }
          return mapped
        }),
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalCount: response.data.totalCount,
        totalPages: response.data.totalPages,
        hasPreviousPage: response.data.hasPreviousPage,
        hasNextPage: response.data.hasNextPage,
      }
    },
    enabled: !!categoriaId,
  })
}

