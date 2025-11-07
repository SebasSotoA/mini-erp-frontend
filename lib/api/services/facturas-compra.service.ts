/**
 * Servicio de Facturas de Compra - Integración con API Backend
 */

import { apiGet, apiPost, apiDelete } from "../client"
import type { ApiResponse, FacturaCompraBackend, CreateFacturaCompraDto, PaginatedResponse } from "../types"
import { buildQueryString } from "../utils"

/**
 * Servicio de Facturas de Compra
 */
export const facturasCompraService = {
  /**
   * Obtener facturas de compra con filtros y paginación
   */
  async getFacturasCompra(params?: {
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
  }): Promise<PaginatedResponse<FacturaCompraBackend>> {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
    }
    if (params?.numeroFactura) queryParams.numeroFactura = params.numeroFactura
    if (params?.proveedorId) queryParams.proveedorId = params.proveedorId
    if (params?.proveedorNombre) queryParams.proveedorNombre = params.proveedorNombre
    if (params?.bodegaId) queryParams.bodegaId = params.bodegaId
    if (params?.bodegaNombre) queryParams.bodegaNombre = params.bodegaNombre
    if (params?.estado) queryParams.estado = params.estado
    if (params?.fechaDesde) queryParams.fechaDesde = params.fechaDesde
    if (params?.fechaHasta) queryParams.fechaHasta = params.fechaHasta
    if (params?.orderBy) queryParams.orderBy = params.orderBy
    if (params?.orderDesc !== undefined) queryParams.orderDesc = params.orderDesc

    const queryString = buildQueryString(queryParams)
    const response = await apiGet<PaginatedResponse<FacturaCompraBackend>>(
      `/facturas-compra${queryString ? `?${queryString}` : ""}`,
    )
    return response
  },

  /**
   * Obtener factura de compra por ID
   */
  async getFacturaCompraById(id: string): Promise<ApiResponse<FacturaCompraBackend>> {
    return await apiGet<FacturaCompraBackend>(`/facturas-compra/${id}`)
  },

  /**
   * Crear nueva factura de compra
   */
  async createFacturaCompra(data: CreateFacturaCompraDto): Promise<ApiResponse<FacturaCompraBackend>> {
    return await apiPost<FacturaCompraBackend>("/facturas-compra", data)
  },

  /**
   * Anular factura de compra (soft delete)
   */
  async deleteFacturaCompra(id: string): Promise<ApiResponse<null>> {
    return await apiDelete<null>(`/facturas-compra/${id}`)
  },
}



