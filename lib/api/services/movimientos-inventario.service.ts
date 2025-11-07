/**
 * Servicio de Movimientos de Inventario - Integración con API Backend
 */

import { apiGet } from "../client"
import { buildQueryString } from "../utils"
import type { ApiResponse, MovimientoInventarioBackend, PaginatedResponse, PaginatedData } from "../types"
import type { StockMovement } from "@/contexts/inventory-context"

/**
 * Parámetros para filtrar movimientos de inventario
 */
export interface MovimientosQueryParams {
  page?: number
  pageSize?: number
  productoId?: string
  productoNombre?: string
  productoSku?: string
  bodegaId?: string
  bodegaNombre?: string
  tipoMovimiento?: "VENTA" | "COMPRA"
  fechaDesde?: string
  fechaHasta?: string
  cantidadMinima?: number
  cantidadMaxima?: number
  facturaVentaId?: string
  facturaCompraId?: string
  orderBy?: "fecha" | "cantidad" | "tipoMovimiento" | "productoNombre" | "bodegaNombre"
  orderDesc?: boolean
}

/**
 * Mapea un movimiento del backend al formato del frontend
 */
export function mapMovimientoToStockMovement(
  movimiento: MovimientoInventarioBackend,
): StockMovement {
  // Detectar si es una reversión (cantidad negativa)
  const isReversal = movimiento.cantidad < 0
  const absoluteQuantity = Math.abs(movimiento.cantidad)
  
  // Mapear tipo VENTA/COMPRA a in/out
  let type: "in" | "out" | "adjustment" | "return"
  let quantity: number
  let reason: string

  if (movimiento.tipoMovimiento === "COMPRA") {
    type = isReversal ? "out" : "in" // Si es reversión de compra, es salida
    quantity = absoluteQuantity
    reason = isReversal ? "Anulación de Compra" : "Compra"
  } else if (movimiento.tipoMovimiento === "VENTA") {
    type = isReversal ? "in" : "out" // Si es reversión de venta, es entrada
    quantity = absoluteQuantity
    reason = isReversal ? "Anulación de Venta" : "Venta"
  } else {
    // Por defecto, usar el signo de la cantidad
    type = movimiento.cantidad >= 0 ? "in" : "out"
    quantity = absoluteQuantity
    reason = "Movimiento"
  }

  // Obtener número de factura (priorizar los nuevos campos)
  const facturaNumero = movimiento.facturaVentaNumero || 
                        movimiento.facturaCompraNumero || 
                        movimiento.facturaNumero || 
                        undefined

  return {
    id: movimiento.id,
    productId: movimiento.productoId,
    productName: movimiento.productoNombre,
    quantity,
    type,
    reason,
    date: movimiento.fecha,
    cost: movimiento.costoUnitario || undefined,
    price: movimiento.precioUnitario || undefined,
    reference: facturaNumero,
    warehouseId: movimiento.bodegaId,
    warehouseName: movimiento.bodegaNombre,
    observation: movimiento.observacion || undefined,
    isReversal,
    facturaVentaId: movimiento.facturaVentaId || undefined,
    facturaCompraId: movimiento.facturaCompraId || undefined,
  }
}

/**
 * Servicio de Movimientos de Inventario
 */
export const movimientosInventarioService = {
  /**
   * Obtener movimientos con filtros, paginación y ordenamiento
   */
  async getMovimientos(
    params?: MovimientosQueryParams,
  ): Promise<PaginatedResponse<StockMovement>> {
    const queryString = params ? buildQueryString(params) : ""
    const response = await apiGet<PaginatedData<MovimientoInventarioBackend>>(
      `/movimientos-inventario${queryString}`,
    )
    
    // Mapear los items del backend al formato del frontend
    const mappedItems = response.data.items.map(mapMovimientoToStockMovement)
    
    return {
      ...response,
      data: {
        ...response.data,
        items: mappedItems,
      },
    }
  },

  /**
   * Obtener movimientos (kardex) de un producto
   */
  async getMovimientosByProducto(productoId: string): Promise<StockMovement[]> {
    const response = await apiGet<MovimientoInventarioBackend[]>(
      `/movimientos-inventario/producto/${productoId}`,
    )
    return response.data.map(mapMovimientoToStockMovement)
  },
}

