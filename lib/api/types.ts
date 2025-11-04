/**
 * Tipos TypeScript para las respuestas de la API
 */

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T = any> {
  success: boolean
  statusCode: number
  message: string
  data: T
  timestamp: string
}

/**
 * Respuesta paginada de la API
 */
export interface PaginatedData<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

/**
 * Tipos para productos del backend
 */
export interface ProductoBackend {
  id: string
  nombre: string
  unidadMedida: string
  precioBase: number
  impuestoPorcentaje: number
  costoInicial: number
  categoriaId: string | null
  codigoSku: string
  descripcion: string | null
  activo: boolean
  fechaCreacion: string
  imagenProductoUrl: string | null
  stockActual: number // Stock calculado (suma de todas las bodegas)
}

export interface ProductoBodegaBackend {
  bodegaId: string
  bodegaNombre: string
  bodegaDireccion: string | null
  cantidadInicial: number // Stock actual en esta bodega
  cantidadMinima: number | null
  cantidadMaxima: number | null
}

/**
 * Tipo para campos extra asignados a un producto
 */
export interface ProductoCampoExtraBackend {
  campoExtraId: string
  campoExtraNombre: string
  campoExtraTipo: string
  valor: string
}

/**
 * Tipo para movimientos de inventario
 */
export interface MovimientoInventarioBackend {
  id: string
  productoId: string
  productoNombre: string
  productoCodigoSku: string
  bodegaId: string
  bodegaNombre: string
  cantidad: number // Positiva para entradas, negativa para salidas
  tipoMovimiento: "VENTA" | "COMPRA"
  fecha: string
  facturaId?: string | null
  facturaNumero?: string | null
  costoUnitario?: number | null
}

/**
 * DTOs para crear/actualizar productos
 */
export interface CreateProductoDto {
  nombre: string
  unidadMedida: string
  precioBase: number
  impuestoPorcentaje: number
  costoInicial: number
  categoriaId?: string | null
  codigoSku?: string
  descripcion?: string | null
  imagenProductoUrl?: string | null
  bodegaPrincipalId?: string
  cantidadInicial?: number
  bodegasAdicionales?: Array<{
    bodegaId: string
    cantidadInicial: number
    cantidadMinima?: number | null
    cantidadMaxima?: number | null
  }>
  camposExtra?: Array<{
    campoExtraId: string
    valor: string
  }>
}

export interface UpdateProductoDto {
  nombre?: string
  unidadMedida?: string
  precioBase?: number
  impuestoPorcentaje?: number
  costoInicial?: number
  categoriaId?: string | null
  codigoSku?: string
  descripcion?: string | null
  imagenProductoUrl?: string | null
}

/**
 * Parámetros para listar productos
 */
export interface ProductosQueryParams {
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
  orderBy?: "nombre" | "precio" | "sku" | "fecha"
  orderDesc?: boolean
}

