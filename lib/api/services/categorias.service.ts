/**
 * Servicio de Categorías - Integración con API Backend
 */

import { apiGet } from "../client"
import type { ApiResponse, CategoriaBackend, PaginatedResponse } from "../types"
import { buildQueryString } from "../utils"

/**
 * Servicio de Categorías
 */
export const categoriasService = {
  /**
   * Obtener categorías con filtros y paginación
   */
  async getCategorias(params?: {
    page?: number
    pageSize?: number
    nombre?: string
    activo?: boolean
  }): Promise<PaginatedResponse<CategoriaBackend>> {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 100, // Obtener todas las categorías activas
    }
    if (params?.nombre) queryParams.nombre = params.nombre
    if (params?.activo !== undefined) queryParams.activo = params.activo

    const queryString = buildQueryString(queryParams)
    const response = await apiGet<PaginatedResponse<CategoriaBackend>>(
      `/categorias${queryString ? `?${queryString}` : ""}`,
    )
    return response
  },
}

