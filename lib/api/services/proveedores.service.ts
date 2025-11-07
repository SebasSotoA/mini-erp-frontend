/**
 * Servicio de Proveedores - Integración con API Backend
 */

import { apiGet, apiPost, apiPut, apiPatch } from "../client"
import type { ApiResponse, PaginatedData, ProveedorBackend, CreateProveedorDto, UpdateProveedorDto } from "../types"

/**
 * Servicio de Proveedores
 */
export const proveedoresService = {
  /**
   * Obtener proveedores (devuelve respuesta paginada, pero extraemos el array de items)
   */
  async getProveedores(soloActivos?: boolean): Promise<ApiResponse<ProveedorBackend[]>> {
    const queryParams: Record<string, any> = {}
    if (soloActivos !== undefined) queryParams.soloActivos = soloActivos

    const queryString = Object.keys(queryParams).length > 0
      ? `?${new URLSearchParams(queryParams as any).toString()}`
      : ""

    const response = await apiGet<PaginatedData<ProveedorBackend>>(`/proveedores${queryString}`)
    // El backend devuelve un objeto paginado, extraemos el array de items
    return {
      ...response,
      data: response.data?.items || [],
    }
  },

  /**
   * Obtener proveedor por ID
   */
  async getProveedorById(id: string): Promise<ApiResponse<ProveedorBackend>> {
    return await apiGet<ProveedorBackend>(`/proveedores/${id}`)
  },

  /**
   * Crear nuevo proveedor
   */
  async createProveedor(data: CreateProveedorDto): Promise<ApiResponse<ProveedorBackend>> {
    // Pasar los datos directamente sin transformaciones
    return await apiPost<ProveedorBackend>("/proveedores", data)
  },

  /**
   * Actualizar proveedor
   */
  async updateProveedor(id: string, data: UpdateProveedorDto): Promise<ApiResponse<ProveedorBackend>> {
    return await apiPut<ProveedorBackend>(`/proveedores/${id}`, data)
  },

  /**
   * Activar proveedor
   */
  async activateProveedor(id: string): Promise<ApiResponse<null>> {
    return await apiPatch<null>(`/proveedores/${id}/activate`)
  },

  /**
   * Desactivar proveedor
   */
  async deactivateProveedor(id: string): Promise<ApiResponse<null>> {
    return await apiPatch<null>(`/proveedores/${id}/deactivate`)
  },
}



