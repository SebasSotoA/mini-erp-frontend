/**
 * Servicio de Productos - Integración con API Backend
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "../client"
import type {
  ProductoBackend,
  ProductoBodegaBackend,
  ProductoCampoExtraBackend,
  CreateProductoDto,
  UpdateProductoDto,
  AddProductoBodegaDto,
  UpdateProductoBodegaDto,
  SetProductoCampoExtraDto,
  ProductosQueryParams,
  PaginatedResponse,
  ApiResponse,
} from "../types"
import { buildQueryString } from "../utils"
import type { Product } from "@/contexts/inventory-context"

/**
 * Mapea un producto del backend al formato del frontend
 */
export function mapProductoToProduct(producto: ProductoBackend): Product {
  // Calcular precio total con impuestos (el impuesto ya viene como decimal, ej: 0.19)
  const precioTotal = producto.precioBase * (1 + producto.impuestoPorcentaje)

  return {
    id: producto.id,
    name: producto.nombre,
    sku: producto.codigoSku,
    price: precioTotal,
    basePrice: producto.precioBase,
    taxPercent: producto.impuestoPorcentaje * 100, // Convertir a porcentaje para el frontend (0.19 -> 19)
    cost: producto.costoInicial,
    category: producto.categoriaNombre || "",
    stock: producto.stockActual || 0, // Stock calculado del backend (suma de todas las bodegas)
    minStock: 0, // Se obtiene de ProductoBodega si es necesario
    maxStock: 0, // Se obtiene de ProductoBodega si es necesario
    description: producto.descripcion || "",
    supplier: "", // No está en el backend por ahora
    unit: producto.unidadMedida,
    isActive: producto.activo,
    expiryDate: undefined, // No está en el backend
    createdAt: producto.fechaCreacion,
    lastSold: undefined, // No está en el backend
    totalSold: 0, // No está en el backend
    reorderPoint: 0, // Se obtiene de ProductoBodega si es necesario
    leadTime: 0, // No está en el backend
    warehouseId: undefined, // Se obtiene de ProductoBodega si es necesario
    imageUrl: producto.imagenProductoUrl || undefined,
  }
}

/**
 * Mapea un producto del frontend al DTO de creación del backend
 */
export function mapProductToCreateDto(
  product: Partial<Product>,
  additionalData?: {
    bodegaPrincipalId?: string
    cantidadInicial?: number
    cantidadMinima?: number | null
    cantidadMaxima?: number | null
    categoriaId?: string | null
    bodegasAdicionales?: Array<{
      bodegaId: string
      cantidadInicial: number
      cantidadMinima?: number | null
      cantidadMaxima?: number | null
    }>
  },
): CreateProductoDto {
  // Convertir impuesto de porcentaje (19) a decimal (0.19)
  const taxPercent = product.taxPercent || 0
  const impuestoDecimal = taxPercent / 100

  return {
    nombre: product.name || "",
    unidadMedida: product.unit || "Unidad",
    precioBase: product.basePrice || 0,
    impuestoPorcentaje: impuestoDecimal, // Backend espera decimal (0.19)
    costoInicial: product.cost || 0,
    categoriaId: additionalData?.categoriaId !== undefined ? additionalData.categoriaId : (product.category || null),
    codigoSku: product.sku || undefined, // Si no se proporciona, el backend lo genera
    descripcion: product.description || null,
    imagenProductoUrl: product.imageUrl || null,
    bodegaPrincipalId: additionalData?.bodegaPrincipalId,
    cantidadInicial: additionalData?.cantidadInicial,
    cantidadMinima: additionalData?.cantidadMinima ?? null,
    cantidadMaxima: additionalData?.cantidadMaxima ?? null,
    bodegasAdicionales: additionalData?.bodegasAdicionales,
  }
}

/**
 * Mapea un producto del frontend al DTO de actualización del backend
 */
export function mapProductToUpdateDto(
  product: Partial<Product> & { bodegaPrincipalId?: string },
): UpdateProductoDto {
  // Convertir impuesto de porcentaje (19) a decimal (0.19)
  const taxPercent = product.taxPercent
  const impuestoDecimal = taxPercent !== undefined ? taxPercent / 100 : undefined

  return {
    nombre: product.name,
    unidadMedida: product.unit,
    precioBase: product.basePrice,
    impuestoPorcentaje: impuestoDecimal, // Backend espera decimal (0.19)
    costoInicial: product.cost,
    categoriaId: product.category || null,
    codigoSku: product.sku,
    descripcion: product.description || null,
    imagenProductoUrl: product.imageUrl || null,
    bodegaPrincipalId: product.bodegaPrincipalId, // Incluir bodegaPrincipalId si está presente
  }
}

/**
 * Servicio de Productos
 */
export const productosService = {
  /**
   * Listar productos con filtros y paginación
   */
  async getProductos(
    params?: ProductosQueryParams,
  ): Promise<PaginatedResponse<ProductoBackend>> {
    const queryString = params ? buildQueryString(params) : ""
    const response = await apiGet<PaginatedData<ProductoBackend>>(
      `/productos${queryString}`,
    )
    return response as PaginatedResponse<ProductoBackend>
  },

  /**
   * Obtener producto por ID
   */
  async getProductoById(id: string): Promise<ProductoBackend> {
    const response = await apiGet<ProductoBackend>(`/productos/${id}`)
    return response.data
  },

  /**
   * Crear producto
   */
  async createProducto(
    data: CreateProductoDto,
  ): Promise<ApiResponse<{ id: string; nombre: string; codigoSku: string; activo: boolean; fechaCreacion: string }>> {
    return await apiPost("/productos", data)
  },

  /**
   * Actualizar producto
   */
  async updateProducto(
    id: string,
    data: UpdateProductoDto,
  ): Promise<ApiResponse<null>> {
    return await apiPut(`/productos/${id}`, data)
  },

  /**
   * Activar producto
   */
  async activateProducto(id: string): Promise<ApiResponse<null>> {
    return await apiPatch(`/productos/${id}/activate`)
  },

  /**
   * Desactivar producto
   */
  async deactivateProducto(id: string): Promise<ApiResponse<null>> {
    return await apiPatch(`/productos/${id}/deactivate`)
  },

  /**
   * Eliminar producto permanentemente
   */
  async deleteProducto(id: string): Promise<ApiResponse<null>> {
    return await apiDelete(`/productos/${id}/permanent`)
  },

  /**
   * Obtener bodegas del producto
   */
  async getProductoBodegas(productId: string): Promise<ProductoBodegaBackend[]> {
    const response = await apiGet<ProductoBodegaBackend[]>(`/productos/${productId}/bodegas`)
    return response.data
  },

  /**
   * Obtener campos extra del producto
   */
  async getProductoCamposExtra(productId: string): Promise<ProductoCampoExtraBackend[]> {
    const response = await apiGet<ProductoCampoExtraBackend[]>(`/productos/${productId}/campos-extra`)
    return response.data
  },

  /**
   * Agregar producto a bodega
   */
  async addProductoBodega(
    productId: string,
    data: AddProductoBodegaDto,
  ): Promise<ApiResponse<null>> {
    return await apiPost(`/productos/${productId}/bodegas`, data)
  },

  /**
   * Actualizar cantidades de producto en bodega
   */
  async updateProductoBodega(
    productId: string,
    bodegaId: string,
    data: UpdateProductoBodegaDto,
  ): Promise<ApiResponse<null>> {
    return await apiPut(`/productos/${productId}/bodegas/${bodegaId}`, data)
  },

  /**
   * Remover producto de bodega
   */
  async deleteProductoBodega(
    productId: string,
    bodegaId: string,
  ): Promise<ApiResponse<null>> {
    return await apiDelete(`/productos/${productId}/bodegas/${bodegaId}`)
  },

  /**
   * Asignar/actualizar campo extra del producto
   */
  async setProductoCampoExtra(
    productId: string,
    campoExtraId: string,
    data: SetProductoCampoExtraDto,
  ): Promise<ApiResponse<null>> {
    return await apiPut(`/productos/${productId}/campos-extra/${campoExtraId}`, data)
  },

  /**
   * Remover campo extra del producto
   */
  async deleteProductoCampoExtra(
    productId: string,
    campoExtraId: string,
  ): Promise<ApiResponse<null>> {
    return await apiDelete(`/productos/${productId}/campos-extra/${campoExtraId}`)
  },
}

// Tipo helper para PaginatedData
type PaginatedData<T> = {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

