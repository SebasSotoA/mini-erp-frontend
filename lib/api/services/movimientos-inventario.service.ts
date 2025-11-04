/**
 * Servicio de Movimientos de Inventario - Integración con API Backend
 */

import { apiGet } from "../client"
import type { ApiResponse, MovimientoInventarioBackend } from "../types"
import type { StockMovement } from "@/contexts/inventory-context"

/**
 * Mapea un movimiento del backend al formato del frontend
 */
export function mapMovimientoToStockMovement(
  movimiento: MovimientoInventarioBackend,
): StockMovement {
  // Mapear tipo VENTA/COMPRA a in/out
  let type: "in" | "out" | "adjustment" | "return"
  let quantity: number

  if (movimiento.tipoMovimiento === "COMPRA") {
    type = "in"
    quantity = Math.abs(movimiento.cantidad)
  } else if (movimiento.tipoMovimiento === "VENTA") {
    type = "out"
    quantity = Math.abs(movimiento.cantidad)
  } else {
    // Por defecto, usar el signo de la cantidad
    type = movimiento.cantidad >= 0 ? "in" : "out"
    quantity = Math.abs(movimiento.cantidad)
  }

  return {
    id: movimiento.id,
    productId: movimiento.productoId,
    productName: movimiento.productoNombre,
    quantity,
    type,
    reason:
      movimiento.tipoMovimiento === "COMPRA"
        ? "Compra"
        : movimiento.tipoMovimiento === "VENTA"
          ? "Venta"
          : "Movimiento",
    date: movimiento.fecha,
    cost: movimiento.costoUnitario || undefined,
    reference: movimiento.facturaNumero || undefined,
    warehouseId: movimiento.bodegaId,
  }
}

/**
 * Servicio de Movimientos de Inventario
 */
export const movimientosInventarioService = {
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

