/**
 * Servicio de Campos Extra - Integración con API Backend
 */

import { apiGet, apiPost } from "../client"
import type { ApiResponse, CampoExtraBackend, PaginatedResponse, CreateCampoExtraDto } from "../types"
import { buildQueryString } from "../utils"

/**
 * Servicio de Campos Extra
 */
export const camposExtraService = {
  /**
   * Obtener campos extra con filtros y paginación
   */
  async getCamposExtra(params?: {
    page?: number
    pageSize?: number
    nombre?: string
    tipoDato?: string
    esRequerido?: boolean
    activo?: boolean
    orderBy?: string
    orderDesc?: boolean
  }): Promise<PaginatedResponse<CampoExtraBackend>> {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 100, // Obtener todos los campos activos
    }
    if (params?.nombre) queryParams.nombre = params.nombre
    if (params?.tipoDato) queryParams.tipoDato = params.tipoDato
    if (params?.esRequerido !== undefined) queryParams.esRequerido = params.esRequerido
    if (params?.activo !== undefined) queryParams.activo = params.activo
    if (params?.orderBy) queryParams.orderBy = params.orderBy
    if (params?.orderDesc !== undefined) queryParams.orderDesc = params.orderDesc

    const queryString = buildQueryString(queryParams)
    const response = await apiGet<PaginatedResponse<CampoExtraBackend>>(
      `/campos-extra${queryString ? `?${queryString}` : ""}`,
    )
    return response
  },
  /**
   * Crear nuevo campo extra
   */
  async createCampoExtra(data: CreateCampoExtraDto): Promise<ApiResponse<CampoExtraBackend>> {
    const response = await apiPost<CampoExtraBackend>("/campos-extra", data)
    return response
  },
}

