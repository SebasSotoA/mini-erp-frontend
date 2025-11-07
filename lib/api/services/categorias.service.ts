/**
 * Servicio de Categorías - Integración con API Backend
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "../client"
import type { ApiResponse, CategoriaBackend, PaginatedData, CreateCategoriaDto, UpdateCategoriaDto, ProductoBackend, ProductosQueryParams } from "../types"
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
    orderBy?: string
    orderDesc?: boolean
  }): Promise<ApiResponse<PaginatedData<CategoriaBackend>>> {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
    }
    if (params?.nombre) queryParams.nombre = params.nombre
    if (params?.activo !== undefined) queryParams.activo = params.activo
    if (params?.orderBy) queryParams.orderBy = params.orderBy
    if (params?.orderDesc !== undefined) queryParams.orderDesc = params.orderDesc

    const queryString = buildQueryString(queryParams)
    const response = await apiGet<PaginatedData<CategoriaBackend>>(
      `/categorias${queryString ? `?${queryString}` : ""}`,
    )
    return response
  },

  /**
   * Obtener categoría por ID
   */
  async getCategoriaById(id: string): Promise<ApiResponse<CategoriaBackend>> {
    return await apiGet<CategoriaBackend>(`/categorias/${id}`)
  },

  /**
   * Crear nueva categoría
   */
  async createCategoria(data: CreateCategoriaDto): Promise<ApiResponse<CategoriaBackend>> {
    return await apiPost<CategoriaBackend>("/categorias", data)
  },

  /**
   * Actualizar categoría
   */
  async updateCategoria(id: string, data: UpdateCategoriaDto): Promise<ApiResponse<CategoriaBackend>> {
    return await apiPut<CategoriaBackend>(`/categorias/${id}`, data)
  },

  /**
   * Activar categoría
   */
  async activateCategoria(id: string): Promise<ApiResponse<null>> {
    return await apiPatch<null>(`/categorias/${id}/activate`)
  },

  /**
   * Desactivar categoría
   */
  async deactivateCategoria(id: string): Promise<ApiResponse<null>> {
    return await apiPatch<null>(`/categorias/${id}/deactivate`)
  },

  /**
   * Eliminar categoría permanentemente
   */
  async deleteCategoria(id: string): Promise<ApiResponse<null>> {
    return await apiDelete<null>(`/categorias/${id}`)
  },

  /**
   * Obtener productos de una categoría específica con filtros y paginación
   */
  async getCategoriaProductos(
    categoriaId: string,
    params?: ProductosQueryParams,
  ): Promise<ApiResponse<PaginatedData<ProductoBackend>>> {
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
    const response = await apiGet<PaginatedData<ProductoBackend>>(
      `/categorias/${categoriaId}/productos${queryString ? `?${queryString}` : ""}`,
    )
    return response
  },
}

