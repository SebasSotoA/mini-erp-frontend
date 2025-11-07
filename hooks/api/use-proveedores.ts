/**
 * Hooks personalizados de React Query para Proveedores
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { proveedoresService } from "@/lib/api/services/proveedores.service"
import type { ProveedorBackend, CreateProveedorDto, UpdateProveedorDto } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { NetworkError, ApiError } from "@/lib/api/errors"

/**
 * Query key factory para proveedores
 */
export const proveedoresKeys = {
  all: ["proveedores"] as const,
  lists: () => [...proveedoresKeys.all, "list"] as const,
  list: (soloActivos?: boolean) => [...proveedoresKeys.lists(), soloActivos] as const,
  details: () => [...proveedoresKeys.all, "detail"] as const,
  detail: (id: string) => [...proveedoresKeys.details(), id] as const,
}

/**
 * Hook para obtener proveedores
 */
export function useProveedores(soloActivos?: boolean) {
  return useQuery({
    queryKey: proveedoresKeys.list(soloActivos),
    queryFn: async () => {
      const response = await proveedoresService.getProveedores(soloActivos)
      return response.data
    },
  })
}

/**
 * Hook para obtener proveedores activos (para formularios)
 */
export function useProveedoresActive() {
  return useQuery({
    queryKey: proveedoresKeys.list(true),
    queryFn: async () => {
      const response = await proveedoresService.getProveedores(true)
      return response.data
    },
  })
}

/**
 * Hook para obtener un proveedor por ID
 */
export function useProveedor(id: string | undefined) {
  return useQuery({
    queryKey: proveedoresKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID is required")
      const response = await proveedoresService.getProveedorById(id)
      return response.data
    },
    enabled: !!id,
  })
}

/**
 * Hook para crear proveedor
 */
export function useCreateProveedor() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateProveedorDto) => {
      return await proveedoresService.createProveedor(data)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() })
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.all })
      
      toast({
        title: "Proveedor creado",
        description: "Proveedor creado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al crear el proveedor."
      let errorTitle = "Error al crear proveedor"

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
 * Hook para actualizar proveedor
 */
export function useUpdateProveedor() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProveedorDto }) => {
      return await proveedoresService.updateProveedor(id, data)
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() })
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.all })
      
      toast({
        title: "Proveedor actualizado",
        description: "Proveedor actualizado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al actualizar el proveedor."
      let errorTitle = "Error al actualizar proveedor"

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
 * Hook para activar proveedor
 */
export function useActivateProveedor() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await proveedoresService.activateProveedor(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() })
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.all })
      
      toast({
        title: "Proveedor activado",
        description: "Proveedor activado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al activar el proveedor."
      let errorTitle = "Error al activar proveedor"

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
 * Hook para desactivar proveedor
 */
export function useDeactivateProveedor() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await proveedoresService.deactivateProveedor(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() })
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.all })
      
      toast({
        title: "Proveedor desactivado",
        description: "Proveedor desactivado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al desactivar el proveedor."
      let errorTitle = "Error al desactivar proveedor"

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



