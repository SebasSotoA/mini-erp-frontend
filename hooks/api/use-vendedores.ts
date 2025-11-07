/**
 * Hooks personalizados de React Query para Vendedores
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { vendedoresService } from "@/lib/api/services/vendedores.service"
import type { VendedorBackend, CreateVendedorDto, UpdateVendedorDto } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { NetworkError, ApiError } from "@/lib/api/errors"

/**
 * Query key factory para vendedores
 */
export const vendedoresKeys = {
  all: ["vendedores"] as const,
  lists: () => [...vendedoresKeys.all, "list"] as const,
  list: (soloActivos?: boolean) => [...vendedoresKeys.lists(), soloActivos] as const,
  details: () => [...vendedoresKeys.all, "detail"] as const,
  detail: (id: string) => [...vendedoresKeys.details(), id] as const,
}

/**
 * Hook para obtener vendedores
 */
export function useVendedores(soloActivos?: boolean) {
  return useQuery({
    queryKey: vendedoresKeys.list(soloActivos),
    queryFn: async () => {
      const response = await vendedoresService.getVendedores(soloActivos)
      return response.data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnMount: true,
  })
}

/**
 * Hook para obtener vendedores activos (para formularios)
 */
export function useVendedoresActive() {
  return useQuery({
    queryKey: vendedoresKeys.list(true),
    queryFn: async () => {
      const response = await vendedoresService.getVendedores(true)
      return response.data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnMount: true,
  })
}

/**
 * Hook para obtener un vendedor por ID
 */
export function useVendedor(id: string | undefined) {
  return useQuery({
    queryKey: vendedoresKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID is required")
      const response = await vendedoresService.getVendedorById(id)
      return response.data
    },
    enabled: !!id,
  })
}

/**
 * Hook para crear vendedor
 */
export function useCreateVendedor() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateVendedorDto) => {
      return await vendedoresService.createVendedor(data)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: vendedoresKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vendedoresKeys.all })
      
      toast({
        title: "Vendedor creado",
        description: "Vendedor creado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al crear el vendedor."
      let errorTitle = "Error al crear vendedor"

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
 * Hook para actualizar vendedor
 */
export function useUpdateVendedor() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVendedorDto }) => {
      return await vendedoresService.updateVendedor(id, data)
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: vendedoresKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vendedoresKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: vendedoresKeys.all })
      
      toast({
        title: "Vendedor actualizado",
        description: "Vendedor actualizado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al actualizar el vendedor."
      let errorTitle = "Error al actualizar vendedor"

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
 * Hook para activar vendedor
 */
export function useActivateVendedor() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await vendedoresService.activateVendedor(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: vendedoresKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vendedoresKeys.all })
      
      toast({
        title: "Vendedor activado",
        description: "Vendedor activado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al activar el vendedor."
      let errorTitle = "Error al activar vendedor"

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
 * Hook para desactivar vendedor
 */
export function useDeactivateVendedor() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await vendedoresService.deactivateVendedor(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: vendedoresKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vendedoresKeys.all })
      
      toast({
        title: "Vendedor desactivado",
        description: "Vendedor desactivado exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al desactivar el vendedor."
      let errorTitle = "Error al desactivar vendedor"

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

