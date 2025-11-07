/**
 * Servicio de Dashboard - Integración con API Backend
 */

import { apiGet } from "../client"
import type {
  ApiResponse,
  DashboardMetricsDto,
  TopProductoVendidoDto,
  TendenciaVentaDto,
  DistribucionCategoriaDto,
  MovimientoStockDto,
  StockPorBodegaDto,
  SaludStockDto,
  ProductoStockBajoDto,
} from "../types"
import { buildQueryString } from "../utils"

/**
 * Servicio de Dashboard
 */
export const dashboardService = {
  /**
   * Obtener métricas principales del dashboard
   */
  async getMetrics(): Promise<ApiResponse<DashboardMetricsDto>> {
    return await apiGet<DashboardMetricsDto>("/dashboard/metrics")
  },

  /**
   * Obtener top productos más vendidos
   * @param top Número de productos a retornar (default: 10, max: 50)
   */
  async getTopProductosVendidos(top?: number): Promise<ApiResponse<TopProductoVendidoDto[]>> {
    const params: Record<string, any> = {}
    if (top !== undefined && top !== null) {
      params.top = top
    }
    const queryString = buildQueryString(params)
    return await apiGet<TopProductoVendidoDto[]>(`/dashboard/top-productos-vendidos${queryString}`)
  },

  /**
   * Obtener tendencia de ventas
   * @param dias Número de días a analizar (default: 30, max: 365)
   */
  async getTendenciaVentas(dias?: number): Promise<ApiResponse<TendenciaVentaDto[]>> {
    const params: Record<string, any> = {}
    if (dias !== undefined && dias !== null) {
      params.dias = dias
    }
    const queryString = buildQueryString(params)
    return await apiGet<TendenciaVentaDto[]>(`/dashboard/tendencia-ventas${queryString}`)
  },

  /**
   * Obtener distribución de inventario por categoría
   */
  async getDistribucionCategorias(): Promise<ApiResponse<DistribucionCategoriaDto[]>> {
    return await apiGet<DistribucionCategoriaDto[]>("/dashboard/distribucion-categorias")
  },

  /**
   * Obtener movimientos de stock (entradas vs salidas)
   * @param dias Número de días a analizar (default: 30, max: 365)
   */
  async getMovimientosStock(dias?: number): Promise<ApiResponse<MovimientoStockDto[]>> {
    const params: Record<string, any> = {}
    if (dias !== undefined && dias !== null) {
      params.dias = dias
    }
    const queryString = buildQueryString(params)
    return await apiGet<MovimientoStockDto[]>(`/dashboard/movimientos-stock${queryString}`)
  },

  /**
   * Obtener comparación de stock por bodega
   */
  async getStockPorBodega(): Promise<ApiResponse<StockPorBodegaDto[]>> {
    return await apiGet<StockPorBodegaDto[]>("/dashboard/stock-por-bodega")
  },

  /**
   * Obtener salud del stock
   */
  async getSaludStock(): Promise<ApiResponse<SaludStockDto>> {
    return await apiGet<SaludStockDto>("/dashboard/salud-stock")
  },

  /**
   * Obtener productos con stock bajo
   * @param top Número de productos a retornar (default: 20, max: 100)
   */
  async getProductosStockBajo(top?: number): Promise<ApiResponse<ProductoStockBajoDto[]>> {
    const params: Record<string, any> = {}
    if (top !== undefined && top !== null) {
      params.top = top
    }
    const queryString = buildQueryString(params)
    return await apiGet<ProductoStockBajoDto[]>(`/dashboard/productos-stock-bajo${queryString}`)
  },
}

