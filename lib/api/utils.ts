/**
 * Utilidades para la construcción de queries y mapeo de datos
 */

import type { ProductosQueryParams } from "./types"
import type { ItemFilters } from "@/lib/types/items"

/**
 * Construye un query string desde un objeto de parámetros
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ""
}

/**
 * Mapea los filtros del frontend a los parámetros de query del backend
 */
export function mapFiltersToQueryParams(
  filters: ItemFilters,
  pagination?: { page?: number; pageSize?: number },
  sort?: { field?: string; direction?: "asc" | "desc" },
): ProductosQueryParams {
  const params: ProductosQueryParams = {}

  // Paginación
  if (pagination) {
    if (pagination.page) params.page = pagination.page
    if (pagination.pageSize) params.pageSize = pagination.pageSize
  }

  // Filtros de texto
  if (filters.name) params.nombre = filters.name
  if (filters.sku) params.codigoSku = filters.sku
  if (filters.description) params.descripcion = filters.description
  if (filters.price) params.precio = filters.price

  // Filtros de stock
  if (filters.stockOperator && filters.stockOperator !== "none") {
    if (filters.stockOperator === "equal" && filters.stockValue) {
      params.cantidadExacta = parseInt(filters.stockValue, 10)
      params.cantidadOperador = "="
    } else if (filters.stockOperator === "greater" && filters.stockValue) {
      params.cantidadMin = parseInt(filters.stockValue, 10)
      params.cantidadOperador = ">"
    } else if (filters.stockOperator === "greaterEqual" && filters.stockValue) {
      params.cantidadMin = parseInt(filters.stockValue, 10)
      params.cantidadOperador = ">="
    } else if (filters.stockOperator === "less" && filters.stockValue) {
      params.cantidadMax = parseInt(filters.stockValue, 10)
      params.cantidadOperador = "<"
    } else if (filters.stockOperator === "lessEqual" && filters.stockValue) {
      params.cantidadMax = parseInt(filters.stockValue, 10)
      params.cantidadOperador = "<="
    } else if (
      filters.stockOperator === "between" &&
      filters.stockMinValue &&
      filters.stockMaxValue
    ) {
      params.cantidadMin = parseInt(filters.stockMinValue, 10)
      params.cantidadMax = parseInt(filters.stockMaxValue, 10)
      params.cantidadOperador = "range"
    }
  }

  // Filtro de estado
  if (filters.status === "active") {
    params.includeInactive = false
    params.onlyInactive = false
  } else if (filters.status === "inactive") {
    params.includeInactive = false
    params.onlyInactive = true
  } else {
    // "all" o vacío - incluir todos
    params.includeInactive = true
  }

  // Ordenamiento
  if (sort?.field) {
    const orderByMap: Record<string, "nombre" | "precio" | "sku" | "fecha"> = {
      name: "nombre",
      price: "precio",
      sku: "sku",
      createdAt: "fecha",
    }

    const backendOrderBy = orderByMap[sort.field]
    if (backendOrderBy) {
      params.orderBy = backendOrderBy
      params.orderDesc = sort.direction === "desc"
    }
  }

  return params
}

/**
 * Formatea una fecha a string ISO
 */
export function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    return date
  }
  return date.toISOString()
}

/**
 * Formatea un número a string con formato de moneda
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

