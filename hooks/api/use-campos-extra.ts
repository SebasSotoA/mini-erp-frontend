/**
 * Hooks personalizados de React Query para Campos Extra
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { camposExtraService } from "@/lib/api/services/campos-extra.service"
import type { CampoExtraBackend, CreateCampoExtraDto } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { NetworkError, ApiError } from "@/lib/api/errors"

/**
 * Query key factory para campos extra
 */
export const camposExtraKeys = {
  all: ["campos-extra"] as const,
  lists: () => [...camposExtraKeys.all, "list"] as const,
  list: (params?: { activos?: boolean; requeridos?: boolean }) => [...camposExtraKeys.lists(), params] as const,
}

/**
 * Mapea el tipo de dato del backend al tipo del frontend
 */
function mapTipoDatoBackendToFrontend(tipoDato: string): "texto" | "número" | "número decimal" | "fecha" | "si/no" {
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
    queryKey: camposExtraKeys.list({ activos: true, requeridos: true }),
    queryFn: async () => {
      const response = await camposExtraService.getCamposExtra({
        activo: true,
        esRequerido: true,
        pageSize: 100,
      })
      return response.data.items.map(mapCampoExtraToFrontend)
    },
  })
}

/**
 * Hook para obtener todos los campos extra activos (para formularios avanzados)
 */
export function useCamposExtra(onlyActive: boolean = true) {
  return useQuery({
    queryKey: camposExtraKeys.list({ activos: onlyActive }),
    queryFn: async () => {
      const response = await camposExtraService.getCamposExtra({
        activo: onlyActive ? true : undefined,
        pageSize: 100,
      })
      return response.data.items.map(mapCampoExtraToFrontend)
    },
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

