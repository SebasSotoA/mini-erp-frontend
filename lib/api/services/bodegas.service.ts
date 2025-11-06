/**
 * Servicio de Bodegas - Integración con API Backend
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "../client"
import type { ApiResponse, BodegaBackend, PaginatedResponse, CreateBodegaDto, UpdateBodegaDto, ProductoBackend } from "../types"
import { buildQueryString } from "../utils"

/**
 * Servicio de Bodegas
 */
export const bodegasService = {
  /**
   * Obtener bodegas con filtros y paginación
   */
  async getBodegas(params?: {
    page?: number
    pageSize?: number
    nombre?: string
    activo?: boolean
    orderBy?: string
    orderDesc?: boolean
  }): Promise<PaginatedResponse<BodegaBackend>> {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
    }
    if (params?.nombre) queryParams.nombre = params.nombre
    if (params?.activo !== undefined) queryParams.activo = params.activo
    if (params?.orderBy) queryParams.orderBy = params.orderBy
    if (params?.orderDesc !== undefined) queryParams.orderDesc = params.orderDesc

    const queryString = buildQueryString(queryParams)
    const response = await apiGet<PaginatedResponse<BodegaBackend>>(
      `/bodegas${queryString ? `?${queryString}` : ""}`,
    )
    return response
  },

  /**
   * Obtener bodega por ID
   */
  async getBodegaById(id: string): Promise<ApiResponse<BodegaBackend>> {
    return await apiGet<BodegaBackend>(`/bodegas/${id}`)
  },

  /**
   * Crear nueva bodega
   */
  async createBodega(data: CreateBodegaDto): Promise<ApiResponse<BodegaBackend>> {
    return await apiPost<BodegaBackend>("/bodegas", data)
  },

  /**
   * Actualizar bodega
   */
  async updateBodega(id: string, data: UpdateBodegaDto): Promise<ApiResponse<BodegaBackend>> {
    return await apiPut<BodegaBackend>(`/bodegas/${id}`, data)
  },

  /**
   * Activar bodega
   */
  async activateBodega(id: string): Promise<ApiResponse<null>> {
    return await apiPatch<null>(`/bodegas/${id}/activate`)
  },

  /**
   * Desactivar bodega
   */
  async deactivateBodega(id: string): Promise<ApiResponse<null>> {
    return await apiPatch<null>(`/bodegas/${id}/deactivate`)
  },

  /**
   * Eliminar bodega permanentemente
   */
  async deleteBodega(id: string): Promise<ApiResponse<null>> {
    return await apiDelete<null>(`/bodegas/${id}`)
  },

  /**
   * Obtener productos de una bodega específica con filtros y paginación
   */
  async getBodegaProductos(
    bodegaId: string,
    params?: {
      page?: number
      pageSize?: number
      q?: string
      nombre?: string
      codigoSku?: string
      descripcion?: string
      precio?: string
      cantidadExacta?: number
      cantidadMin?: number
      cantidadMax?: number
      cantidadOperador?: string
      includeInactive?: boolean
      onlyInactive?: boolean
      orderBy?: string
      orderDesc?: boolean
    },
  ): Promise<PaginatedResponse<ProductoBackend>> {
    const queryParams: Record<string, any> = {}
    if (params?.page) queryParams.page = params.page
    if (params?.pageSize) queryParams.pageSize = params.pageSize
    if (params?.q) queryParams.q = params.q
    if (params?.nombre) queryParams.nombre = params.nombre
    if (params?.codigoSku) queryParams.codigoSku = params.codigoSku
    if (params?.descripcion) queryParams.descripcion = params.descripcion
    if (params?.precio) queryParams.precio = params.precio
    if (params?.cantidadExacta !== undefined) queryParams.cantidadExacta = params.cantidadExacta
    if (params?.cantidadMin !== undefined) queryParams.cantidadMin = params.cantidadMin
    if (params?.cantidadMax !== undefined) queryParams.cantidadMax = params.cantidadMax
    if (params?.cantidadOperador) queryParams.cantidadOperador = params.cantidadOperador
    if (params?.includeInactive !== undefined) queryParams.includeInactive = params.includeInactive
    if (params?.onlyInactive !== undefined) queryParams.onlyInactive = params.onlyInactive
    if (params?.orderBy) queryParams.orderBy = params.orderBy
    if (params?.orderDesc !== undefined) queryParams.orderDesc = params.orderDesc

    const queryString = buildQueryString(queryParams)
    const response = await apiGet<PaginatedResponse<ProductoBackend>>(
      `/bodegas/${bodegaId}/productos${queryString ? `?${queryString}` : ""}`,
    )
    return response
  },
}

