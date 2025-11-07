/**
 * Hooks personalizados de React Query para Campos Extra
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { camposExtraService } from "@/lib/api/services/campos-extra.service"
import type { CampoExtraBackend, CreateCampoExtraDto, UpdateCampoExtraDto, ProductosQueryParams, ProductoBackend } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { NetworkError, ApiError } from "@/lib/api/errors"
import { mapProductoToProduct } from "@/lib/api/services/productos.service"
import type { Product } from "@/contexts/inventory-context"

/**
 * Query key factory para campos extra
 */
export const camposExtraKeys = {
  all: ["campos-extra"] as const,
  lists: () => [...camposExtraKeys.all, "list"] as const,
  list: (params?: { page?: number; pageSize?: number; nombre?: string; tipoDato?: string; esRequerido?: boolean; activo?: boolean; orderBy?: string; orderDesc?: boolean }) => [...camposExtraKeys.lists(), params] as const,
  details: () => [...camposExtraKeys.all, "detail"] as const,
  detail: (id: string) => [...camposExtraKeys.details(), id] as const,
  productos: (campoExtraId: string, params?: ProductosQueryParams) => [...camposExtraKeys.detail(campoExtraId), "productos", params] as const,
}

/**
 * Mapea el tipo de dato del backend al tipo del frontend
 */
export function mapTipoDatoBackendToFrontend(tipoDato: string): "texto" | "número" | "número decimal" | "fecha" | "si/no" {
  switch (tipoDato) {
    case "Texto":
      return "texto"
    case "Número":
      return "número"
    case "NúmeroDecimal":
      return "número decimal"
    case "Fecha":
      return "fecha"
    case "SiNo":
      return "si/no"
    default:
      return "texto"
  }
}

/**
 * Mapea el tipo de dato del frontend al tipo del backend
 */
export function mapTipoDatoFrontendToBackend(tipo: string): string {
  switch (tipo) {
    case "texto":
      return "Texto"
    case "número":
      return "Número"
    case "número decimal":
      return "NúmeroDecimal"
    case "fecha":
      return "Fecha"
    case "si/no":
      return "SiNo"
    default:
      return "Texto"
  }
}

/**
 * Mapea un campo extra del backend al formato del frontend
 */
export function mapCampoExtraToFrontend(campo: CampoExtraBackend) {
  return {
    id: campo.id,
    name: campo.nombre,
    type: mapTipoDatoBackendToFrontend(campo.tipoDato),
    description: campo.descripcion || "",
    defaultValue: campo.valorPorDefecto || "",
    isRequired: campo.esRequerido,
    isActive: campo.activo,
  }
}

/**
 * Hook para obtener campos extra requeridos y activos (para formularios)
 */
export function useCamposExtraRequeridos() {
  return useQuery({
    queryKey: camposExtraKeys.list({ activo: true, esRequerido: true }),
    queryFn: async () => {
      const response = await camposExtraService.getCamposExtra({
        activo: true,
        esRequerido: true,
        pageSize: 100,
      })
      return (response.data?.items || []).map(mapCampoExtraToFrontend)
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnMount: true,
  })
}

/**
 * Hook para obtener campos extra con filtros y paginación
 */
export function useCamposExtra(params?: {
  page?: number
  pageSize?: number
  nombre?: string
  tipoDato?: string
  esRequerido?: boolean
  activo?: boolean
  orderBy?: string
  orderDesc?: boolean
}) {
  return useQuery({
    queryKey: camposExtraKeys.list(params),
    queryFn: async () => {
      const response = await camposExtraService.getCamposExtra(params)
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
 * Hook para obtener campos extra activos (para formularios)
 */
export function useCamposExtraActive(onlyActive: boolean = true) {
  return useQuery({
    queryKey: camposExtraKeys.list({ activo: onlyActive ? true : undefined, pageSize: 100 }),
    queryFn: async () => {
      const response = await camposExtraService.getCamposExtra({
        activo: onlyActive ? true : undefined,
        pageSize: 100,
      })
      return (response.data?.items || []).map(mapCampoExtraToFrontend)
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnMount: true,
  })
}

/**
 * Hook para obtener un campo extra por ID
 */
export function useCampoExtra(id: string | undefined) {
  return useQuery({
    queryKey: camposExtraKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID is required")
      const response = await camposExtraService.getCampoExtraById(id)
      return response.data
    },
    enabled: !!id,
  })
}

/**
 * Hook para crear campo extra
 */
export function useCreateCampoExtra() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateCampoExtraDto) => {
      return await camposExtraService.createCampoExtra(data)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: camposExtraKeys.lists() })
      queryClient.invalidateQueries({ queryKey: camposExtraKeys.all })
      
      toast({
        title: "Campo creado",
        description: response.message || "Campo extra creado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al crear el campo extra."
      let errorTitle = "Error al crear campo"

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
 * Hook para actualizar campo extra
 */
export function useUpdateCampoExtra() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCampoExtraDto }) => {
      return await camposExtraService.updateCampoExtra(id, data)
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: camposExtraKeys.lists() })
      queryClient.invalidateQueries({ queryKey: camposExtraKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: camposExtraKeys.all })
      
      toast({
        title: "Campo actualizado",
        description: response.message || "Campo extra actualizado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al actualizar el campo extra."
      let errorTitle = "Error al actualizar campo"

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
 * Hook para activar campo extra
 */
export function useActivateCampoExtra() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await camposExtraService.activateCampoExtra(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: camposExtraKeys.lists() })
      queryClient.invalidateQueries({ queryKey: camposExtraKeys.all })
      
      toast({
        title: "Campo activado",
        description: response.message || "Campo extra activado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al activar el campo extra."
      let errorTitle = "Error al activar campo"

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
 * Hook para desactivar campo extra
 */
export function useDeactivateCampoExtra() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await camposExtraService.deactivateCampoExtra(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: camposExtraKeys.lists() })
      queryClient.invalidateQueries({ queryKey: camposExtraKeys.all })
      
      toast({
        title: "Campo desactivado",
        description: response.message || "Campo extra desactivado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al desactivar el campo extra."
      let errorTitle = "Error al desactivar campo"

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
 * Hook para eliminar campo extra permanentemente
 */
export function useDeleteCampoExtra() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await camposExtraService.deleteCampoExtra(id)
    },
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: camposExtraKeys.lists() })
      queryClient.invalidateQueries({ queryKey: camposExtraKeys.all })
      queryClient.removeQueries({ queryKey: camposExtraKeys.detail(id) })
      
      toast({
        title: "Campo eliminado",
        description: response.message || "Campo extra eliminado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al eliminar el campo extra."
      let errorTitle = "Error al eliminar campo"

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
 * Hook para obtener productos asociados a un campo extra
 */
export function useCampoExtraProductos(campoExtraId: string | undefined, params?: ProductosQueryParams) {
  return useQuery({
    queryKey: camposExtraKeys.productos(campoExtraId || "", params),
    queryFn: async () => {
      if (!campoExtraId) throw new Error("Campo Extra ID is required")
      const response = await camposExtraService.getCampoExtraProductos(campoExtraId, params)
      return {
        items: (response.data?.items || []).map((producto: ProductoBackend) => {
          const mapped = mapProductoToProduct(producto)
          // Si viene cantidadEnCampo, usarla (aunque siempre es igual a stockActual para campos extra)
          if ((producto as any).cantidadEnCampo !== undefined) {
            mapped.stock = (producto as any).cantidadEnCampo
          }
          // Agregar valorCampoExtra si está disponible
          if ((producto as any).valorCampoExtra !== undefined) {
            (mapped as any).valorCampoExtra = (producto as any).valorCampoExtra
          }
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
    enabled: !!campoExtraId,
  })
}

