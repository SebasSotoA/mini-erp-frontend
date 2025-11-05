/**
 * Servicio de Bodegas - Integración con API Backend
 */

import { apiGet, apiPost } from "../client"
import type { ApiResponse, BodegaBackend, PaginatedResponse, CreateBodegaDto } from "../types"
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
  }): Promise<PaginatedResponse<BodegaBackend>> {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 100, // Obtener todas las bodegas activas
    }
    if (params?.nombre) queryParams.nombre = params.nombre
    if (params?.activo !== undefined) queryParams.activo = params.activo

    const queryString = buildQueryString(queryParams)
    const response = await apiGet<PaginatedResponse<BodegaBackend>>(
      `/bodegas${queryString ? `?${queryString}` : ""}`,
    )
    return response
  },
  /**
   * Crear nueva bodega
   */
  async createBodega(data: CreateBodegaDto): Promise<ApiResponse<BodegaBackend>> {
    const response = await apiPost<BodegaBackend>("/bodegas", data)
    return response
  },
}

