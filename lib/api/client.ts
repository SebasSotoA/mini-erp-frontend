/**
 * Cliente API base con Axios
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios"
import { ApiError, ApiErrorResponse, NetworkError } from "./errors"
import type { ApiResponse } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL no está configurada. Por favor, crea un archivo .env.local con NEXT_PUBLIC_API_BASE_URL",
  )
}

/**
 * Crea una instancia de Axios configurada
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json; charset=utf-8",
    },
    timeout: 30000, // 30 segundos
  })

  // Interceptor de request
  client.interceptors.request.use(
    (config) => {
      // Aquí se puede agregar autenticación en el futuro
      // const token = getAuthToken()
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`
      // }
      // Debug: Log del request data para POST/PUT/PATCH
      // if (config.method && ['post', 'put', 'patch'].includes(config.method.toLowerCase()) && config.data) {
      //   console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.data)
      // }
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  // Interceptor de response
  client.interceptors.response.use(
    (response) => {
      // La API siempre devuelve datos en response.data
      return response
    },
    (error: AxiosError<ApiErrorResponse>) => {
      // Manejo de errores de red
      if (!error.response) {
        return Promise.reject(
          new NetworkError(
            error.message || "No se pudo conectar con el servidor",
          ),
        )
      }

      // Manejo de errores de la API
      const errorResponse = error.response.data

      if (errorResponse && typeof errorResponse === "object" && "success" in errorResponse && !errorResponse.success) {
        return Promise.reject(ApiError.fromResponse(errorResponse))
      }

      // Error genérico si no tiene el formato esperado
      return Promise.reject(
        new ApiError(
          error.response.status,
          errorResponse?.message || error.message || "Error desconocido",
        ),
      )
    },
  )

  return client
}

// Instancia única del cliente
export const apiClient = createApiClient()

/**
 * Función helper para hacer requests GET
 */
export const apiGet = async <T = any>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await apiClient.get<ApiResponse<T>>(url, config)
  return response.data
}

/**
 * Función helper para hacer requests POST
 */
export const apiPost = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await apiClient.post<ApiResponse<T>>(url, data, config)
  return response.data
}

/**
 * Función helper para hacer requests PUT
 */
export const apiPut = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await apiClient.put<ApiResponse<T>>(url, data, config)
  return response.data
}

/**
 * Función helper para hacer requests PATCH
 */
export const apiPatch = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await apiClient.patch<ApiResponse<T>>(url, data, config)
  return response.data
}

/**
 * Función helper para hacer requests DELETE
 */
export const apiDelete = async <T = any>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await apiClient.delete<ApiResponse<T>>(url, config)
  return response.data
}

export default apiClient

