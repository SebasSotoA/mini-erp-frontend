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
  cantidadEnBodega?: number // Cantidad específica en la bodega (cuando viene de /api/bodegas/{bodegaId}/productos)
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
  cantidad: number // Positiva para entradas, negativa para salidas (reversiones)
  tipoMovimiento: "VENTA" | "COMPRA"
  fecha: string
  costoUnitario?: number | null
  precioUnitario?: number | null
  observacion?: string | null
  facturaId?: string | null // Deprecated: usar facturaVentaId o facturaCompraId
  facturaNumero?: string | null // Deprecated: usar facturaVentaNumero o facturaCompraNumero
  facturaVentaId?: string | null
  facturaVentaNumero?: string | null
  facturaCompraId?: string | null
  facturaCompraNumero?: string | null
}

/**
 * Tipo para categorías del backend
 */
export interface CategoriaBackend {
  id: string
  nombre: string
  descripcion?: string | null
  imagenCategoriaUrl?: string | null
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
  descripcion?: string | null
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
  descripcion?: string | null
}

export interface UpdateBodegaDto {
  nombre?: string
  direccion?: string | null
  descripcion?: string | null
}

/**
 * DTOs para crear/actualizar categorías
 */
export interface CreateCategoriaDto {
  nombre: string
  descripcion?: string | null
  imagenCategoriaUrl?: string | null
}

export interface UpdateCategoriaDto {
  nombre?: string
  descripcion?: string | null
  imagenCategoriaUrl?: string | null
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

export interface UpdateCampoExtraDto {
  nombre?: string
  tipoDato?: string // "Texto", "Número", "NúmeroDecimal", "Fecha", "SiNo"
  descripcion?: string | null
  valorPorDefecto?: string | null
  esRequerido?: boolean
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

/**
 * Tipos para Proveedores del backend
 */
export interface ProveedorBackend {
  id: string
  nombre: string
  identificacion: string
  correo?: string | null
  observaciones?: string | null
  activo: boolean
  fechaCreacion: string
}

/**
 * DTOs para crear/actualizar proveedores
 */
export interface CreateProveedorDto {
  nombre: string
  identificacion: string
  correo?: string | null
  observaciones?: string | null
}

export interface UpdateProveedorDto {
  nombre: string
  identificacion: string
  correo?: string | null
  observaciones?: string | null
}

/**
 * Tipos para Facturas de Compra del backend
 */
export interface FacturaCompraItemBackend {
  id: string
  productoId: string
  productoNombre: string
  productoSku: string
  cantidad: number
  costoUnitario: number
  descuento: number
  impuesto: number
  totalLinea: number
}

export interface FacturaCompraBackend {
  id: string
  numeroFactura: string
  bodegaId: string
  bodegaNombre: string
  proveedorId: string
  proveedorNombre: string
  fecha: string
  observaciones?: string | null
  estado: "Completada" | "Anulada"
  total: number
  items: FacturaCompraItemBackend[]
}

/**
 * DTOs para crear facturas de compra
 */
export interface CreateFacturaCompraItemDto {
  productoId: string
  cantidad: number
  costoUnitario: number
  descuento: number
  impuesto: number
}

export interface CreateFacturaCompraDto {
  bodegaId: string
  proveedorId: string
  fecha: string
  observaciones?: string | null
  items: CreateFacturaCompraItemDto[]
}

/**
 * Tipos para Vendedores del backend
 */
export interface VendedorBackend {
  id: string
  nombre: string
  identificacion: string
  correo?: string | null
  observaciones?: string | null
  activo: boolean
  fechaCreacion: string
}

/**
 * DTOs para crear/actualizar vendedores
 */
export interface CreateVendedorDto {
  nombre: string
  identificacion: string
  correo?: string | null
  observaciones?: string | null
}

export interface UpdateVendedorDto {
  nombre: string
  identificacion: string
  correo?: string | null
  observaciones?: string | null
}

/**
 * Tipos para Facturas de Venta del backend
 */
export interface FacturaVentaItemBackend {
  id: string
  productoId: string
  productoNombre: string
  productoSku: string
  cantidad: number
  precioUnitario: number
  descuento: number
  impuesto: number
  totalLinea: number
}

export interface FacturaVentaBackend {
  id: string
  numeroFactura: string
  bodegaId: string
  bodegaNombre: string
  vendedorId: string
  vendedorNombre: string
  fecha: string
  formaPago: "Contado" | "Credito"
  plazoPago?: number | null
  medioPago: "Efectivo" | "Tarjeta" | "Transferencia" | "Cheque"
  observaciones?: string | null
  estado: "Completada" | "Anulada"
  total: number
  items: FacturaVentaItemBackend[]
}

/**
 * DTOs para crear facturas de venta
 */
export interface CreateFacturaVentaItemDto {
  productoId: string
  cantidad: number
  precioUnitario: number
  descuento: number
  impuesto: number
}

export interface CreateFacturaVentaDto {
  bodegaId: string
  vendedorId: string
  fecha: string
  formaPago: "Contado" | "Credito"
  plazoPago?: number | null
  medioPago: "Efectivo" | "Tarjeta" | "Transferencia" | "Cheque"
  observaciones?: string | null
  items: CreateFacturaVentaItemDto[]
}

/**
 * Tipos para Dashboard y Analytics
 */

/**
 * Métricas principales del dashboard
 */
export interface DashboardMetricsDto {
  totalProductos: number
  totalBodegas: number
  ventasDelMes: number
  comprasDelMes: number
  productosStockBajo: number
  valorTotalInventario: number
  margenBruto: number
  porcentajeMargen: number
}

/**
 * Top producto más vendido
 */
export interface TopProductoVendidoDto {
  productoId: string
  productoNombre: string
  productoSku: string
  cantidadVendida: number
  valorTotal: number
}

/**
 * Tendencia de ventas por día
 */
export interface TendenciaVentaDto {
  fecha: string
  totalVentas: number
  cantidadFacturas: number
}

/**
 * Distribución de inventario por categoría
 */
export interface DistribucionCategoriaDto {
  categoriaId: string | null
  categoriaNombre: string
  cantidadProductos: number
  stockTotal: number
  valorTotal: number
}

/**
 * Movimiento de stock (entradas vs salidas)
 */
export interface MovimientoStockDto {
  fecha: string
  entradas: number
  salidas: number
  neto: number
}

/**
 * Stock por bodega
 */
export interface StockPorBodegaDto {
  bodegaId: string
  bodegaNombre: string
  cantidadProductos: number
  stockTotal: number
  valorTotal: number
}

/**
 * Salud del stock
 */
export interface SaludStockDto {
  productosStockOptimo: number
  productosStockBajo: number
  productosStockAlto: number
  productosAgotados: number
  totalProductos: number
  porcentajeStockOptimo: number
  porcentajeStockBajo: number
  porcentajeStockAlto: number
  porcentajeAgotados: number
}

/**
 * Producto con stock bajo
 */
export interface ProductoStockBajoDto {
  productoId: string
  productoNombre: string
  productoSku: string
  stockActual: number
  stockMinimo: number
  diferencia: number
  bodegaPrincipal: string
}

