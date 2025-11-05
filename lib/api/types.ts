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
  categoriaNombre: string | null
  codigoSku: string
  descripcion: string | null
  activo: boolean
  fechaCreacion: string
  imagenProductoUrl: string | null
  stockActual: number // Stock calculado (suma de todas las bodegas)
  bodegaPrincipalId: string // ID de la bodega principal del producto
}

export interface ProductoBodegaBackend {
  bodegaId: string
  bodegaNombre: string
  bodegaDireccion: string | null
  cantidadInicial: number // Stock actual en esta bodega
  cantidadMinima: number | null
  cantidadMaxima: number | null
  esPrincipal: boolean // Indica si esta bodega es la principal del producto
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
 * Tipo para categorías del backend
 */
export interface CategoriaBackend {
  id: string
  nombre: string
  descripcion?: string | null
  activo: boolean
  fechaCreacion: string
}

/**
 * Tipo para bodegas del backend
 */
export interface BodegaBackend {
  id: string
  nombre: string
  direccion?: string | null
  activo: boolean
  fechaCreacion: string
}

/**
 * Tipo para campos extra del backend
 */
export interface CampoExtraBackend {
  id: string
  nombre: string
  tipoDato: string // "Texto", "Número", "NúmeroDecimal", "Fecha", "SiNo"
  descripcion?: string | null
  valorPorDefecto?: string | null
  esRequerido: boolean
  activo: boolean
  fechaCreacion: string
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
  cantidadMinima?: number | null
  cantidadMaxima?: number | null
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
  impuestoPorcentaje?: number // Debe ser decimal (0.19) cuando se envía al backend
  costoInicial?: number
  categoriaId?: string | null
  codigoSku?: string
  descripcion?: string | null
  imagenProductoUrl?: string | null
  bodegaPrincipalId?: string // ID de la bodega principal (opcional en actualización)
}

/**
 * DTOs para gestionar bodegas del producto
 */
export interface AddProductoBodegaDto {
  bodegaId: string
  cantidadInicial: number
  cantidadMinima?: number | null
  cantidadMaxima?: number | null
}

export interface UpdateProductoBodegaDto {
  cantidadInicial?: number
  cantidadMinima?: number | null
  cantidadMaxima?: number | null
}

/**
 * DTO para asignar/actualizar campo extra del producto
 */
export interface SetProductoCampoExtraDto {
  valor: string
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

/**
 * DTOs para crear/actualizar bodegas
 */
export interface CreateBodegaDto {
  nombre: string
  direccion?: string | null
  observaciones?: string | null
}

/**
 * DTOs para crear/actualizar campos extra
 */
export interface CreateCampoExtraDto {
  nombre: string
  tipoDato: string // "Texto", "Número", "NúmeroDecimal", "Fecha", "SiNo"
  descripcion?: string | null
  valorPorDefecto?: string | null
  esRequerido: boolean
}

/**
 * DTOs para el módulo de Inventario (Valor de Inventario)
 */
export interface InventarioFilterDto {
  bodegaIds?: string[]
  categoriaIds?: string[]
  estado?: "activo" | "inactivo" | "todos"
  q?: string
  page?: number
  pageSize?: number
}

export interface InventarioProductoDto {
  nombre: string
  codigoSku: string
  bodega: string
  cantidad: number
  costoUnitario: number
  valorTotal: number
  categoria: string
}

export interface InventarioFiltrosAplicadosDto {
  Bodegas?: string
  Categorias?: string
  Estado?: string
}

export interface InventarioResumenDto {
  valorTotal: number
  stockTotal: number
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  productos: InventarioProductoDto[]
  filtrosAplicados: InventarioFiltrosAplicadosDto
  fechaGeneracion: string
}

