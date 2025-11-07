/**
 * Servicio de Facturas de Venta - Integración con API Backend
 */

import { apiGet, apiPost, apiDelete } from "../client"
import type { ApiResponse, FacturaVentaBackend, CreateFacturaVentaDto, PaginatedData } from "../types"
import { buildQueryString } from "../utils"

/**
 * Servicio de Facturas de Venta
 */
export const facturasVentaService = {
  /**
   * Obtener facturas de venta con filtros y paginación
   */
  async getFacturasVenta(params?: {
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
  }): Promise<ApiResponse<PaginatedData<FacturaVentaBackend>>> {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
    }
    if (params?.numeroFactura) queryParams.numeroFactura = params.numeroFactura
    if (params?.vendedorId) queryParams.vendedorId = params.vendedorId
    if (params?.vendedorNombre) queryParams.vendedorNombre = params.vendedorNombre
    if (params?.bodegaId) queryParams.bodegaId = params.bodegaId
    if (params?.bodegaNombre) queryParams.bodegaNombre = params.bodegaNombre
    if (params?.estado) queryParams.estado = params.estado
    if (params?.formaPago) queryParams.formaPago = params.formaPago
    if (params?.medioPago) queryParams.medioPago = params.medioPago
    if (params?.fechaDesde) queryParams.fechaDesde = params.fechaDesde
    if (params?.fechaHasta) queryParams.fechaHasta = params.fechaHasta
    if (params?.orderBy) queryParams.orderBy = params.orderBy
    if (params?.orderDesc !== undefined) queryParams.orderDesc = params.orderDesc

    const queryString = buildQueryString(queryParams)
    const response = await apiGet<PaginatedData<FacturaVentaBackend>>(
      `/facturas-venta${queryString ? `?${queryString}` : ""}`,
    )
    return response
  },

  /**
   * Obtener factura de venta por ID
   */
  async getFacturaVentaById(id: string): Promise<ApiResponse<FacturaVentaBackend>> {
    return await apiGet<FacturaVentaBackend>(`/facturas-venta/${id}`)
  },

  /**
   * Crear nueva factura de venta
   */
  async createFacturaVenta(data: CreateFacturaVentaDto): Promise<ApiResponse<FacturaVentaBackend>> {
    return await apiPost<FacturaVentaBackend>("/facturas-venta", data)
  },

  /**
   * Anular factura de venta (soft delete)
   */
  async deleteFacturaVenta(id: string): Promise<ApiResponse<null>> {
    return await apiDelete<null>(`/facturas-venta/${id}`)
  },
}

