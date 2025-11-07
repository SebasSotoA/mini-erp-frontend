/**
 * Servicio de Vendedores - Integración con API Backend
 */

import { apiGet, apiPost, apiPut, apiPatch } from "../client"
import type { ApiResponse, PaginatedData, VendedorBackend, CreateVendedorDto, UpdateVendedorDto } from "../types"

/**
 * Servicio de Vendedores
 */
export const vendedoresService = {
  /**
   * Obtener vendedores (devuelve respuesta paginada, pero extraemos el array de items)
   */
  async getVendedores(soloActivos?: boolean): Promise<ApiResponse<VendedorBackend[]>> {
    const queryParams: Record<string, any> = {}
    if (soloActivos !== undefined) queryParams.soloActivos = soloActivos

    const queryString = Object.keys(queryParams).length > 0
      ? `?${new URLSearchParams(queryParams as any).toString()}`
      : ""

    const response = await apiGet<PaginatedData<VendedorBackend>>(`/vendedores${queryString}`)
    // El backend devuelve un objeto paginado, extraemos el array de items
    return {
      ...response,
      data: response.data?.items || [],
    }
  },

  /**
   * Obtener vendedor por ID
   */
  async getVendedorById(id: string): Promise<ApiResponse<VendedorBackend>> {
    return await apiGet<VendedorBackend>(`/vendedores/${id}`)
  },

  /**
   * Crear nuevo vendedor
   */
  async createVendedor(data: CreateVendedorDto): Promise<ApiResponse<VendedorBackend>> {
    // Pasar los datos directamente sin transformaciones
    return await apiPost<VendedorBackend>("/vendedores", data)
  },

  /**
   * Actualizar vendedor
   */
  async updateVendedor(id: string, data: UpdateVendedorDto): Promise<ApiResponse<VendedorBackend>> {
    return await apiPut<VendedorBackend>(`/vendedores/${id}`, data)
  },

  /**
   * Activar vendedor
   */
  async activateVendedor(id: string): Promise<ApiResponse<null>> {
    return await apiPatch<null>(`/vendedores/${id}/activate`)
  },

  /**
   * Desactivar vendedor
   */
  async deactivateVendedor(id: string): Promise<ApiResponse<null>> {
    return await apiPatch<null>(`/vendedores/${id}/deactivate`)
  },
}

