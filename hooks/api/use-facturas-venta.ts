/**
 * Hooks personalizados de React Query para Facturas de Venta
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { facturasVentaService } from "@/lib/api/services/facturas-venta.service"
import type { FacturaVentaBackend, CreateFacturaVentaDto } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { NetworkError, ApiError } from "@/lib/api/errors"
import { productoKeys } from "./use-productos"

/**
 * Query key factory para facturas de venta
 */
export const facturasVentaKeys = {
  all: ["facturas-venta"] as const,
  lists: () => [...facturasVentaKeys.all, "list"] as const,
  list: (params?: {
    page?: number
    pageSize?: number
    numeroFactura?: string
    vendedorId?: string
    vendedorNombre?: string
    bodegaId?: string
    bodegaNombre?: string
    estado?: "Completada" | "Anulada"
    formaPago?: "Contado" | "Credito"
    medioPago?: "Efectivo" | "Tarjeta" | "Transferencia" | "Cheque"
    fechaDesde?: string
    fechaHasta?: string
    orderBy?: "numero" | "vendedor" | "bodega" | "fecha" | "estado" | "total" | "formaPago"
    orderDesc?: boolean
  }) => [...facturasVentaKeys.lists(), params] as const,
  details: () => [...facturasVentaKeys.all, "detail"] as const,
  detail: (id: string) => [...facturasVentaKeys.details(), id] as const,
}

/**
 * Hook para obtener facturas de venta con filtros y paginación
 */
export function useFacturasVenta(params?: {
  page?: number
  pageSize?: number
  numeroFactura?: string
  vendedorId?: string
  vendedorNombre?: string
  bodegaId?: string
  bodegaNombre?: string
  estado?: "Completada" | "Anulada"
  formaPago?: "Contado" | "Credito"
  medioPago?: "Efectivo" | "Tarjeta" | "Transferencia" | "Cheque"
  fechaDesde?: string
  fechaHasta?: string
  orderBy?: "numero" | "vendedor" | "bodega" | "fecha" | "estado" | "total" | "formaPago"
  orderDesc?: boolean
}) {
  return useQuery({
    queryKey: facturasVentaKeys.list(params),
    queryFn: async () => {
      const response = await facturasVentaService.getFacturasVenta(params)
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
 * Hook para obtener una factura de venta por ID
 */
export function useFacturaVenta(id: string | undefined) {
  return useQuery({
    queryKey: facturasVentaKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID is required")
      const response = await facturasVentaService.getFacturaVentaById(id)
      return response.data
    },
    enabled: !!id,
  })
}

/**
 * Hook para crear factura de venta
 */
export function useCreateFacturaVenta() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateFacturaVentaDto) => {
      return await facturasVentaService.createFacturaVenta(data)
    },
    onSuccess: (response) => {
      // Invalidar cache de facturas de venta
      queryClient.invalidateQueries({ queryKey: facturasVentaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: facturasVentaKeys.all })
      
      // Invalidar cache de productos (el stock cambió)
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productoKeys.all })
      
      // Invalidar cache de movimientos de inventario (se creó un nuevo movimiento)
      queryClient.invalidateQueries({ queryKey: ["movimientos-inventario"] })
      
      toast({
        title: "Factura de venta creada",
        description: "Factura de venta creada exitosamente. El stock ha sido actualizado.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al crear la factura de venta."
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
 * Hook para anular factura de venta (soft delete)
 */
export function useDeleteFacturaVenta() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await facturasVentaService.deleteFacturaVenta(id)
    },
    onSuccess: (response, variables) => {
      // Invalidar cache de facturas de venta
      queryClient.invalidateQueries({ queryKey: facturasVentaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: facturasVentaKeys.detail(variables) })
      queryClient.invalidateQueries({ queryKey: facturasVentaKeys.all })
      
      // Invalidar cache de productos (el stock cambió al anular)
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productoKeys.all })
      
      // Invalidar cache de movimientos de inventario (se creó un movimiento de reversión)
      queryClient.invalidateQueries({ queryKey: ["movimientos-inventario"] })
      
      toast({
        title: "Factura anulada",
        description: "Factura de venta anulada exitosamente. El stock ha sido actualizado.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al anular la factura de venta."
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

