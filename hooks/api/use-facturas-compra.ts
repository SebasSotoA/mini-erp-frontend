/**
 * Hooks personalizados de React Query para Facturas de Compra
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { facturasCompraService } from "@/lib/api/services/facturas-compra.service"
import type { FacturaCompraBackend, CreateFacturaCompraDto } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { NetworkError, ApiError } from "@/lib/api/errors"
import { productoKeys } from "./use-productos"

/**
 * Query key factory para facturas de compra
 */
export const facturasCompraKeys = {
  all: ["facturas-compra"] as const,
  lists: () => [...facturasCompraKeys.all, "list"] as const,
  list: (params?: {
    page?: number
    pageSize?: number
    numeroFactura?: string
    proveedorId?: string
    proveedorNombre?: string
    bodegaId?: string
    bodegaNombre?: string
    estado?: "Completada" | "Anulada"
    fechaDesde?: string
    fechaHasta?: string
    orderBy?: "numero" | "proveedor" | "bodega" | "fecha" | "estado" | "total"
    orderDesc?: boolean
  }) => [...facturasCompraKeys.lists(), params] as const,
  details: () => [...facturasCompraKeys.all, "detail"] as const,
  detail: (id: string) => [...facturasCompraKeys.details(), id] as const,
}

/**
 * Hook para obtener facturas de compra con filtros y paginación
 */
export function useFacturasCompra(params?: {
  page?: number
  pageSize?: number
  numeroFactura?: string
  proveedorId?: string
  proveedorNombre?: string
  bodegaId?: string
  bodegaNombre?: string
  estado?: "Completada" | "Anulada"
  fechaDesde?: string
  fechaHasta?: string
  orderBy?: "numero" | "proveedor" | "bodega" | "fecha" | "estado" | "total"
  orderDesc?: boolean
}) {
  return useQuery({
    queryKey: facturasCompraKeys.list(params),
    queryFn: async () => {
      const response = await facturasCompraService.getFacturasCompra(params)
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
 * Hook para obtener una factura de compra por ID
 */
export function useFacturaCompra(id: string | undefined) {
  return useQuery({
    queryKey: facturasCompraKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID is required")
      const response = await facturasCompraService.getFacturaCompraById(id)
      return response.data
    },
    enabled: !!id,
  })
}

/**
 * Hook para crear factura de compra
 */
export function useCreateFacturaCompra() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateFacturaCompraDto) => {
      return await facturasCompraService.createFacturaCompra(data)
    },
    onSuccess: (response) => {
      // Invalidar cache de facturas de compra
      queryClient.invalidateQueries({ queryKey: facturasCompraKeys.lists() })
      queryClient.invalidateQueries({ queryKey: facturasCompraKeys.all })
      
      // Invalidar cache de productos (el stock cambió)
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productoKeys.all })
      
      // Invalidar cache de movimientos de inventario (se creó un nuevo movimiento)
      queryClient.invalidateQueries({ queryKey: ["movimientos-inventario"] })
      
      toast({
        title: "Factura de compra creada",
        description: "Factura de compra creada exitosamente. El stock ha sido actualizado.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al crear la factura de compra."
      let errorTitle = "Error al crear factura"

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
 * Hook para anular factura de compra (soft delete)
 */
export function useDeleteFacturaCompra() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await facturasCompraService.deleteFacturaCompra(id)
    },
    onSuccess: (response, variables) => {
      // Invalidar cache de facturas de compra
      queryClient.invalidateQueries({ queryKey: facturasCompraKeys.lists() })
      queryClient.invalidateQueries({ queryKey: facturasCompraKeys.detail(variables) })
      queryClient.invalidateQueries({ queryKey: facturasCompraKeys.all })
      
      // Invalidar cache de productos (el stock cambió al anular)
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productoKeys.all })
      
      // Invalidar cache de movimientos de inventario (se creó un movimiento de reversión)
      queryClient.invalidateQueries({ queryKey: ["movimientos-inventario"] })
      
      toast({
        title: "Factura anulada",
        description: "Factura de compra anulada exitosamente. El stock ha sido actualizado.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al anular la factura de compra."
      let errorTitle = "Error al anular factura"

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



