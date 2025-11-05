/**
 * Servicio de Inventario - Integración con API Backend
 */

import { apiGet } from "../client"
import type { InventarioFilterDto, InventarioResumenDto, ApiResponse } from "../types"
import { buildQueryString } from "../utils"

/**
 * Servicio de Inventario
 */
export const inventarioService = {
  /**
   * Obtener resumen de inventario con filtros y paginación
   */
  async getInventarioResumen(params?: InventarioFilterDto): Promise<ApiResponse<InventarioResumenDto>> {
    const queryString = buildQueryString({
      ...params,
      // Si no se especifica estado, el backend usa "activo" por defecto
      estado: params?.estado || "activo",
    })
    return await apiGet<InventarioResumenDto>(`/inventario/resumen${queryString}`)
  },

  /**
   * Genera la URL para descargar el PDF del resumen de inventario
   */
  getInventarioResumenPdfUrl(params?: InventarioFilterDto): string {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!API_BASE_URL) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL no está configurada")
    }

    const queryString = buildQueryString({
      ...params,
      // Si no se especifica estado, el backend usa "activo" por defecto
      estado: params?.estado || "activo",
    })

    return `${API_BASE_URL}/inventario/resumen/pdf${queryString}`
  },
}

