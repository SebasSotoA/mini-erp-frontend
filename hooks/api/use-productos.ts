/**
 * Hooks personalizados de React Query para Productos
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { productosService, mapProductoToProduct } from "@/lib/api/services/productos.service"
import type { ProductosQueryParams, ProductoBodegaBackend, ProductoCampoExtraBackend, AddProductoBodegaDto, UpdateProductoBodegaDto } from "@/lib/api/types"
import type { Product } from "@/contexts/inventory-context"
import { useToast } from "@/hooks/use-toast"
import type { CreateProductoDto, UpdateProductoDto } from "@/lib/api/types"
import { ApiError, NetworkError } from "@/lib/api/errors"

/**
 * Query key factory para productos
 */
export const productoKeys = {
  all: ["productos"] as const,
  lists: () => [...productoKeys.all, "list"] as const,
  list: (params?: ProductosQueryParams) => [...productoKeys.lists(), params] as const,
  details: () => [...productoKeys.all, "detail"] as const,
  detail: (id: string) => [...productoKeys.details(), id] as const,
  bodegas: (productId: string) => [...productoKeys.detail(productId), "bodegas"] as const,
  camposExtra: (productId: string) => [...productoKeys.detail(productId), "campos-extra"] as const,
}

/**
 * Hook para listar productos con filtros y paginación
 */
export function useProductos(params?: ProductosQueryParams) {
  return useQuery({
    queryKey: productoKeys.list(params),
    queryFn: async () => {
      const response = await productosService.getProductos(params)
      return {
        items: response.data.items.map(mapProductoToProduct),
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalCount: response.data.totalCount,
        totalPages: response.data.totalPages,
        hasPreviousPage: response.data.hasPreviousPage,
        hasNextPage: response.data.hasNextPage,
      }
    },
    enabled: true, // Siempre habilitado
  })
}

/**
 * Hook para obtener un producto por ID
 */
export function useProducto(id: string | undefined) {
  return useQuery({
    queryKey: productoKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID is required")
      const producto = await productosService.getProductoById(id)
      return mapProductoToProduct(producto)
    },
    enabled: !!id,
  })
}

/**
 * Hook para crear un producto
 */
export function useCreateProducto() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateProductoDto) => {
      return await productosService.createProducto(data)
    },
    onSuccess: (response) => {
      // Invalidar la lista de productos para refetch
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() })
      
      toast({
        title: "Producto creado",
        description: response.message || "Producto creado exitosamente.",
      })
    },
    onError: (error: ApiError) => {
      toast({
        title: "Error al crear producto",
        description: error.message || "Ocurrió un error al crear el producto.",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook para actualizar un producto
 */
export function useUpdateProducto() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductoDto }) => {
      return await productosService.updateProducto(id, data)
    },
    onSuccess: (response, variables) => {
      // Invalidar la lista y el detalle del producto
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productoKeys.detail(variables.id) })
      
      toast({
        title: "Producto actualizado",
        description: response.message || "Producto actualizado exitosamente.",
      })
    },
    onError: (error: ApiError) => {
      toast({
        title: "Error al actualizar producto",
        description: error.message || "Ocurrió un error al actualizar el producto.",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook para activar un producto
 */
export function useActivateProducto() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await productosService.activateProducto(id)
    },
    onSuccess: (response, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productoKeys.detail(id) })
      
      toast({
        title: "Producto activado",
        description: response.message || "Producto activado exitosamente.",
      })
    },
    onError: (error: ApiError) => {
      toast({
        title: "Error al activar producto",
        description: error.message || "Ocurrió un error al activar el producto.",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook para desactivar un producto
 */
export function useDeactivateProducto() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await productosService.deactivateProducto(id)
    },
    onSuccess: (response, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productoKeys.detail(id) })
      
      toast({
        title: "Producto desactivado",
        description: response.message || "Producto desactivado exitosamente.",
      })
    },
    onError: (error: ApiError) => {
      toast({
        title: "Error al desactivar producto",
        description: error.message || "Ocurrió un error al desactivar el producto.",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook para eliminar un producto permanentemente
 */
export function useDeleteProducto() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      return await productosService.deleteProducto(id)
    },
    onSuccess: (response, id) => {
      // Invalidar la lista de productos
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() })
      // Remover el producto específico de la caché
      queryClient.removeQueries({ queryKey: productoKeys.detail(id) })
      
      toast({
        title: "Producto eliminado",
        description: response.message || "Producto eliminado exitosamente.",
      })
    },
    onError: (error: ApiError) => {
      toast({
        title: "Error al eliminar producto",
        description: error.message || "Ocurrió un error al eliminar el producto.",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook para obtener bodegas de un producto
 */
export function useProductoBodegas(productId: string | undefined) {
  return useQuery({
    queryKey: productoKeys.bodegas(productId || ""),
    queryFn: async () => {
      if (!productId) throw new Error("Product ID is required")
      return await productosService.getProductoBodegas(productId)
    },
    enabled: !!productId,
  })
}

/**
 * Hook para obtener campos extra de un producto
 */
export function useProductoCamposExtra(productId: string | undefined) {
  return useQuery({
    queryKey: productoKeys.camposExtra(productId || ""),
    queryFn: async () => {
      if (!productId) throw new Error("Product ID is required")
      return await productosService.getProductoCamposExtra(productId)
    },
    enabled: !!productId,
  })
}

/**
 * Hook para agregar producto a una bodega
 */
export function useAddProductoBodega() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: AddProductoBodegaDto }) => {
      return await productosService.addProductoBodega(productId, data)
    },
    onSuccess: (response, variables) => {
      // Invalidar la lista de bodegas del producto
      queryClient.invalidateQueries({ queryKey: productoKeys.bodegas(variables.productId) })
      // Invalidar el detalle del producto para actualizar el stock total
      queryClient.invalidateQueries({ queryKey: productoKeys.detail(variables.productId) })
      
      toast({
        title: "Bodega agregada",
        description: response.message || "Producto agregado a la bodega exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al agregar el producto a la bodega."
      let errorTitle = "Error al agregar bodega"

      if (error instanceof NetworkError) {
        errorTitle = "Error de conexión"
        errorMessage = "No se pudo conectar con el servidor. Por favor, verifica que la API esté en ejecución e intenta nuevamente."
      } else if (error instanceof ApiError) {
        errorMessage = error.message || errorMessage
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook para actualizar cantidades de producto en una bodega
 */
export function useUpdateProductoBodega() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ productId, bodegaId, data }: { productId: string; bodegaId: string; data: UpdateProductoBodegaDto }) => {
      return await productosService.updateProductoBodega(productId, bodegaId, data)
    },
    onSuccess: (response, variables) => {
      // Invalidar la lista de bodegas del producto
      queryClient.invalidateQueries({ queryKey: productoKeys.bodegas(variables.productId) })
      // Invalidar el detalle del producto para actualizar el stock total
      queryClient.invalidateQueries({ queryKey: productoKeys.detail(variables.productId) })
      
      toast({
        title: "Bodega actualizada",
        description: response.message || "Cantidades actualizadas exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al actualizar las cantidades en la bodega."
      let errorTitle = "Error al actualizar bodega"

      if (error instanceof NetworkError) {
        errorTitle = "Error de conexión"
        errorMessage = "No se pudo conectar con el servidor. Por favor, verifica que la API esté en ejecución e intenta nuevamente."
      } else if (error instanceof ApiError) {
        errorMessage = error.message || errorMessage
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook para remover producto de una bodega
 */
export function useDeleteProductoBodega() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ productId, bodegaId }: { productId: string; bodegaId: string }) => {
      return await productosService.deleteProductoBodega(productId, bodegaId)
    },
    onSuccess: (response, variables) => {
      // Invalidar la lista de bodegas del producto
      queryClient.invalidateQueries({ queryKey: productoKeys.bodegas(variables.productId) })
      // Invalidar el detalle del producto para actualizar el stock total
      queryClient.invalidateQueries({ queryKey: productoKeys.detail(variables.productId) })
      
      toast({
        title: "Bodega removida",
        description: response.message || "Producto removido de la bodega exitosamente.",
      })
    },
    onError: (error: Error) => {
      let errorMessage = "Ocurrió un error al remover el producto de la bodega."
      let errorTitle = "Error al remover bodega"

      if (error instanceof NetworkError) {
        errorTitle = "Error de conexión"
        errorMessage = "No se pudo conectar con el servidor. Por favor, verifica que la API esté en ejecución e intenta nuevamente."
      } else if (error instanceof ApiError) {
        errorMessage = error.message || errorMessage
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      })
    },
  })
}

