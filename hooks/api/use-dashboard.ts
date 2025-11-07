/**
 * Hooks personalizados de React Query para Dashboard
 */

import { useQuery } from "@tanstack/react-query"
import { dashboardService } from "@/lib/api/services/dashboard.service"
import type {
  DashboardMetricsDto,
  TopProductoVendidoDto,
  TendenciaVentaDto,
  DistribucionCategoriaDto,
  MovimientoStockDto,
  StockPorBodegaDto,
  SaludStockDto,
  ProductoStockBajoDto,
} from "@/lib/api/types"

/**
 * Query key factory para dashboard
 */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  metrics: () => [...dashboardKeys.all, "metrics"] as const,
  topProductos: (top?: number) => [...dashboardKeys.all, "top-productos", top] as const,
  tendenciaVentas: (dias?: number) => [...dashboardKeys.all, "tendencia-ventas", dias] as const,
  distribucionCategorias: () => [...dashboardKeys.all, "distribucion-categorias"] as const,
  movimientosStock: (dias?: number) => [...dashboardKeys.all, "movimientos-stock", dias] as const,
  stockPorBodega: () => [...dashboardKeys.all, "stock-por-bodega"] as const,
  saludStock: () => [...dashboardKeys.all, "salud-stock"] as const,
  productosStockBajo: (top?: number) => [...dashboardKeys.all, "productos-stock-bajo", top] as const,
}

/**
 * Hook para obtener métricas principales del dashboard
 */
export function useDashboardMetrics() {
  return useQuery<DashboardMetricsDto>({
    queryKey: dashboardKeys.metrics(),
    queryFn: async () => {
      const response = await dashboardService.getMetrics()
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
  })
}

/**
 * Hook para obtener top productos más vendidos
 * @param top Número de productos a retornar (default: 10, max: 50)
 */
export function useTopProductosVendidos(top?: number) {
  return useQuery<TopProductoVendidoDto[]>({
    queryKey: dashboardKeys.topProductos(top),
    queryFn: async () => {
      const response = await dashboardService.getTopProductosVendidos(top)
      return response.data
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
    refetchInterval: 30 * 60 * 1000, // Refrescar cada 30 minutos
  })
}

/**
 * Hook para obtener tendencia de ventas
 * @param dias Número de días a analizar (default: 30, max: 365)
 */
export function useTendenciaVentas(dias?: number) {
  return useQuery<TendenciaVentaDto[]>({
    queryKey: dashboardKeys.tendenciaVentas(dias),
    queryFn: async () => {
      const response = await dashboardService.getTendenciaVentas(dias)
      return response.data
    },
    staleTime: 60 * 60 * 1000, // 1 hora
    refetchInterval: 60 * 60 * 1000, // Refrescar cada 1 hora
  })
}

/**
 * Hook para obtener distribución de inventario por categoría
 */
export function useDistribucionCategorias() {
  return useQuery<DistribucionCategoriaDto[]>({
    queryKey: dashboardKeys.distribucionCategorias(),
    queryFn: async () => {
      const response = await dashboardService.getDistribucionCategorias()
      return response.data
    },
    staleTime: 60 * 60 * 1000, // 1 hora
    refetchInterval: 60 * 60 * 1000, // Refrescar cada 1 hora
  })
}

/**
 * Hook para obtener movimientos de stock (entradas vs salidas)
 * @param dias Número de días a analizar (default: 30, max: 365)
 */
export function useMovimientosStock(dias?: number) {
  return useQuery<MovimientoStockDto[]>({
    queryKey: dashboardKeys.movimientosStock(dias),
    queryFn: async () => {
      const response = await dashboardService.getMovimientosStock(dias)
      return response.data
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
    refetchInterval: 15 * 60 * 1000, // Refrescar cada 15 minutos
  })
}

/**
 * Hook para obtener comparación de stock por bodega
 */
export function useStockPorBodega() {
  return useQuery<StockPorBodegaDto[]>({
    queryKey: dashboardKeys.stockPorBodega(),
    queryFn: async () => {
      const response = await dashboardService.getStockPorBodega()
      return response.data
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
    refetchInterval: 30 * 60 * 1000, // Refrescar cada 30 minutos
  })
}

/**
 * Hook para obtener salud del stock
 */
export function useSaludStock() {
  return useQuery<SaludStockDto>({
    queryKey: dashboardKeys.saludStock(),
    queryFn: async () => {
      const response = await dashboardService.getSaludStock()
      return response.data
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
    refetchInterval: 30 * 60 * 1000, // Refrescar cada 30 minutos
  })
}

/**
 * Hook para obtener productos con stock bajo
 * @param top Número de productos a retornar (default: 20, max: 100)
 */
export function useProductosStockBajo(top?: number) {
  return useQuery<ProductoStockBajoDto[]>({
    queryKey: dashboardKeys.productosStockBajo(top),
    queryFn: async () => {
      const response = await dashboardService.getProductosStockBajo(top)
      return response.data
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
    refetchInterval: 15 * 60 * 1000, // Refrescar cada 15 minutos
  })
}

