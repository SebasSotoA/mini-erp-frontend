/**
 * Servicio de Campos Extra - Integración con API Backend
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "../client"
import type { ApiResponse, CampoExtraBackend, PaginatedResponse, CreateCampoExtraDto, UpdateCampoExtraDto, ProductosQueryParams, ProductoBackend } from "../types"
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
      pageSize: params?.pageSize || 20,
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

  /**
   * Obtener un campo extra por ID
   */
  async getCampoExtraById(id: string): Promise<ApiResponse<CampoExtraBackend>> {
    return await apiGet<CampoExtraBackend>(`/campos-extra/${id}`)
  },

  /**
   * Actualizar campo extra
   */
  async updateCampoExtra(id: string, data: UpdateCampoExtraDto): Promise<ApiResponse<CampoExtraBackend>> {
    return await apiPut<CampoExtraBackend>(`/campos-extra/${id}`, data)
  },

  /**
   * Activar campo extra
   */
  async activateCampoExtra(id: string): Promise<ApiResponse<null>> {
    return await apiPatch<null>(`/campos-extra/${id}/activate`)
  },

  /**
   * Desactivar campo extra
   */
  async deactivateCampoExtra(id: string): Promise<ApiResponse<null>> {
    return await apiPatch<null>(`/campos-extra/${id}/deactivate`)
  },

  /**
   * Eliminar campo extra permanentemente
   */
  async deleteCampoExtra(id: string): Promise<ApiResponse<null>> {
    return await apiDelete<null>(`/campos-extra/${id}`)
  },

  /**
   * Obtener productos asociados a un campo extra con filtros y paginación
   */
  async getCampoExtraProductos(
    campoExtraId: string,
    params?: ProductosQueryParams,
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
      `/campos-extra/${campoExtraId}/productos${queryString ? `?${queryString}` : ""}`,
    )
    return response
  },
}

