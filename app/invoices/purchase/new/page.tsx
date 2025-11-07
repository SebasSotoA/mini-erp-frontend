"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Receipt,
  Save,
  Plus,
  Trash2,
  Building2,
  ArrowLeft,
  Calculator,
  Edit,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { PurchaseInvoiceItem } from "@/lib/types/invoices"
import { useBodegasActive, useBodegaProductos } from "@/hooks/api/use-bodegas"
import { useProveedoresActive, useCreateProveedor, useUpdateProveedor, useDeactivateProveedor, proveedoresKeys } from "@/hooks/api/use-proveedores"
import { useQueryClient } from "@tanstack/react-query"
import { ApiError, NetworkError } from "@/lib/api/errors"
import { useProductos } from "@/hooks/api/use-productos"
import { useCreateFacturaCompra } from "@/hooks/api/use-facturas-compra"
import type { CreateFacturaCompraDto, CreateFacturaCompraItemDto } from "@/lib/api/types"

// Esquema de validación con Zod
const invoiceSchema = z
  .object({
    warehouseId: z.string().min(1, "La bodega es requerida"),
    supplierId: z.string().min(1, "El proveedor es requerido"),
    date: z.string().min(1, "La fecha es requerida"),
    observations: z.string().optional(),
    items: z.array(
      z.object({
        id: z.string(),
        productId: z.string().min(1, "El producto es requerido"),
        price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
        discount: z.number().min(0, "El descuento debe ser mayor o igual a 0"),
        taxRate: z.number().min(0, "El impuesto debe ser mayor o igual a 0"),
        quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
        subtotal: z.number(),
        discountAmount: z.number(),
        taxAmount: z.number(),
        total: z.number(),
      })
    ).min(1, "Debe agregar al menos un item a la factura"),
  })

type InvoiceFormSchema = z.infer<typeof invoiceSchema>

// Esquema para proveedores
const supplierSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  taxId: z.string()
    .min(1, "La identificación es requerida")
    .regex(/^[0-9-]+$/, "La identificación solo puede contener números y guiones."),
  observation: z.string().optional(),
})

type SupplierFormSchema = z.infer<typeof supplierSchema>

interface InvoiceFormData {
  warehouseId: string
  supplierId: string
  date: string
  observations: string
  items: PurchaseInvoiceItem[]
}

interface NewSupplierForm {
  name: string
  taxId: string
  observation: string
  email: string
}

export default function NewPurchaseInvoice() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Obtener datos del backend
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useBodegasActive(true)
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useProveedoresActive()

  // Mutaciones
  const createFacturaMutation = useCreateFacturaCompra()
  const createProveedorMutation = useCreateProveedor()
  const updateProveedorMutation = useUpdateProveedor()
  const deactivateProveedorMutation = useDeactivateProveedor()

  // Estado del formulario principal
  const [formData, setFormData] = useState<InvoiceFormData>({
    warehouseId: "",
    supplierId: "",
    date: new Date().toISOString().split('T')[0],
    observations: "",
    items: [
      {
        id: `item-${Date.now()}`,
        productId: "",
        productName: "",
        price: 0,
        discount: 0,
        taxRate: 19,
        quantity: 1,
        subtotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        total: 0,
      }
    ],
  })

  // Obtener productos según la bodega seleccionada
  const { data: productosData, isLoading: isLoadingProducts } = useProductos({ includeInactive: false, pageSize: 1000 })
  const { data: bodegaProductosData, isLoading: isLoadingBodegaProductos } = useBodegaProductos(
    formData.warehouseId || undefined,
    { includeInactive: false, pageSize: 1000 }
  )
  
  // Usar productos de la bodega si hay una seleccionada, sino usar todos los productos
  const products = formData.warehouseId && bodegaProductosData?.items
    ? bodegaProductosData.items
    : productosData?.items || []
  
  // Filtrar solo proveedores activos (medida de seguridad adicional)
  const suppliers = Array.isArray(suppliersData) 
    ? suppliersData.filter((supplier) => supplier.activo === true)
    : []

  // Estado para nuevo proveedor
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newSupplier, setNewSupplier] = useState<NewSupplierForm>({
    name: "",
    taxId: "",
    observation: "",
    email: "",
  })

  // Estado para editar proveedor
  const [showEditSupplier, setShowEditSupplier] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<{ id: string; data: NewSupplierForm } | null>(null)

  // Estado para eliminar proveedor
  const [showDeleteSupplier, setShowDeleteSupplier] = useState(false)
  const [deletingSupplier, setDeletingSupplier] = useState<{ id: string; name: string } | null>(null)

  // Estado para mostrar errores de validación
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [showItemsErrorToast, setShowItemsErrorToast] = useState(false)
  const [showDuplicateSupplierToast, setShowDuplicateSupplierToast] = useState(false)
  const [duplicateSupplierMessage, setDuplicateSupplierMessage] = useState("")
  const [showInvalidTaxIdToast, setShowInvalidTaxIdToast] = useState(false)
  const [hasInvalidTaxIdError, setHasInvalidTaxIdError] = useState(false)
  const [showDiscountErrorToast, setShowDiscountErrorToast] = useState(false)
  
  // Estado para toasts de éxito de proveedores
  const [showSupplierSuccessToast, setShowSupplierSuccessToast] = useState(false)
  const [supplierSuccessMessage, setSupplierSuccessMessage] = useState("")

  // React Hook Form
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormSchema>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      warehouseId: formData.warehouseId,
      supplierId: formData.supplierId,
      date: formData.date,
      observations: formData.observations,
      items: formData.items,
    },
  })

  // Sincronizar el estado inicial del formulario con React Hook Form
  useEffect(() => {
    setValue("items", formData.items, { shouldValidate: false })
  }, []) // Solo al montar el componente

  const handleInputChange = (field: keyof InvoiceFormData, value: string) => {
    // Si se cambia la bodega, limpiar los productos seleccionados en los items
    if (field === 'warehouseId') {
      setFormData(prev => {
        const clearedItems = prev.items.map(item => ({
          ...item,
          productId: "",
          productName: "",
          price: 0,
          subtotal: 0,
          discountAmount: 0,
          taxAmount: 0,
          total: 0,
        }))
        setValue("items", clearedItems, { shouldValidate: false })
        return { ...prev, [field]: value, items: clearedItems }
      })
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    setValue(field as any, value, { shouldValidate: true })
  }

  const handleNewSupplierSubmit = async () => {
    // Validar formato de identificación antes de enviar
    const taxIdRegex = /^[0-9-]+$/
    if (!taxIdRegex.test(newSupplier.taxId)) {
      setHasInvalidTaxIdError(true)
      setShowInvalidTaxIdToast(true)
      setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
      return
    }

    const result = supplierSchema.safeParse(newSupplier)
    
    if (!result.success) {
      // Verificar si el error es de identificación
      const taxIdError = result.error.errors.find(err => err.path.includes("taxId"))
      if (taxIdError && taxIdError.message.includes("solo puede contener números y guiones")) {
        setHasInvalidTaxIdError(true)
        setShowInvalidTaxIdToast(true)
        setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
      } else {
        setHasInvalidTaxIdError(false)
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos.",
          variant: "destructive",
        })
      }
      return
    }

    // Si llegamos aquí, la validación pasó
    setHasInvalidTaxIdError(false)

    try {
      const response = await createProveedorMutation.mutateAsync({
        nombre: newSupplier.name,
        identificacion: newSupplier.taxId,
        observaciones: newSupplier.observation || null,
        correo: newSupplier.email && newSupplier.email.trim() !== "" ? newSupplier.email.trim() : null,
      })

      // Invalidar y refetch la query de proveedores activos para actualizar el dropdown
      await queryClient.invalidateQueries({ queryKey: proveedoresKeys.list(true) })
      await queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() })
      await queryClient.refetchQueries({ queryKey: proveedoresKeys.list(true) })

      // Limpiar el formulario y cerrar modal
      setNewSupplier({ name: "", taxId: "", observation: "", email: "" })
      setShowNewSupplier(false)
      
      // Toast personalizado de éxito (visual)
      setSupplierSuccessMessage(`El proveedor "${newSupplier.name}" ha sido creado exitosamente.`)
      setShowSupplierSuccessToast(true)
      setTimeout(() => setShowSupplierSuccessToast(false), 5000)
      
      // Toast del hook (opcional, se puede mantener o quitar)
      toast({
        title: "Proveedor creado",
        description: `El proveedor "${newSupplier.name}" ha sido creado exitosamente.`,
      })
      
      // Seleccionar el proveedor recién creado
      if (response.data) {
        handleInputChange("supplierId", response.data.id)
      }
    } catch (error: any) {
      // Manejar errores específicos
      let errorMessage = "Ocurrió un error al crear el proveedor."
      let errorTitle = "Error al crear proveedor"

      // Obtener el mensaje del error
      const errorMsg = error?.message || error?.toString() || ""

      if (error instanceof NetworkError) {
        errorTitle = "Error de conexión"
        errorMessage = "No se pudo conectar con el servidor. Por favor, verifica que la API esté en ejecución e intenta nuevamente."
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        })
      } else if (error instanceof ApiError) {
        errorMessage = error.message || errorMsg
        // Verificar si es el error de proveedor duplicado (verificar múltiples variantes)
        const lowerMsg = errorMessage.toLowerCase()
        if (
          lowerMsg.includes("ya existe") || 
          lowerMsg.includes("duplicado") ||
          (lowerMsg.includes("identificación") && lowerMsg.includes("ya existe"))
        ) {
          // Mostrar toast visual personalizado para identificación duplicada
          const duplicateMsg = lowerMsg.includes("identificación") 
            ? (errorMessage || "Ya existe un proveedor con esta identificación.")
            : "Ya existe un proveedor con este nombre o identificación."
          setDuplicateSupplierMessage(duplicateMsg)
          setShowDuplicateSupplierToast(true)
          setTimeout(() => setShowDuplicateSupplierToast(false), 5000)
        } else if (lowerMsg.includes("solo puede contener números y guiones")) {
          // Mostrar toast visual personalizado para identificación inválida
          setHasInvalidTaxIdError(true)
          setShowInvalidTaxIdToast(true)
          setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
        } else {
          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
          })
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMsg
        // Verificar también en errores genéricos
        const lowerMsg = errorMessage.toLowerCase()
        if (
          lowerMsg.includes("ya existe") || 
          lowerMsg.includes("duplicado") ||
          (lowerMsg.includes("identificación") && lowerMsg.includes("ya existe"))
        ) {
          // Mostrar toast visual personalizado para identificación duplicada
          const duplicateMsg = lowerMsg.includes("identificación") 
            ? (errorMessage || "Ya existe un proveedor con esta identificación.")
            : "Ya existe un proveedor con este nombre o identificación."
          setDuplicateSupplierMessage(duplicateMsg)
          setShowDuplicateSupplierToast(true)
          setTimeout(() => setShowDuplicateSupplierToast(false), 5000)
        } else if (lowerMsg.includes("solo puede contener números y guiones")) {
          // Mostrar toast visual personalizado para identificación inválida
          setHasInvalidTaxIdError(true)
          setShowInvalidTaxIdToast(true)
          setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
        } else {
          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  const handleEditSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (supplier) {
      setEditingSupplier({
        id: supplierId,
        data: {
          name: supplier.nombre,
          taxId: supplier.identificacion || "",
          observation: supplier.observaciones || "",
          email: supplier.correo || "",
        }
      })
      setShowEditSupplier(true)
    }
  }

  const handleEditSupplierSubmit = async () => {
    if (!editingSupplier) return
    
    // Validar formato de identificación antes de enviar
    const taxIdRegex = /^[0-9-]+$/
    if (!taxIdRegex.test(editingSupplier.data.taxId)) {
      setHasInvalidTaxIdError(true)
      setShowInvalidTaxIdToast(true)
      setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
      return
    }
    
    const result = supplierSchema.safeParse(editingSupplier.data)
    
    if (!result.success) {
      // Verificar si el error es de identificación
      const taxIdError = result.error.errors.find(err => err.path.includes("taxId"))
      if (taxIdError && taxIdError.message.includes("solo puede contener números y guiones")) {
        setHasInvalidTaxIdError(true)
        setShowInvalidTaxIdToast(true)
        setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
      } else {
        setHasInvalidTaxIdError(false)
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos.",
          variant: "destructive",
        })
      }
      return
    }

    // Si llegamos aquí, la validación pasó
    setHasInvalidTaxIdError(false)

    try {
      await updateProveedorMutation.mutateAsync({
        id: editingSupplier.id,
        data: {
          nombre: editingSupplier.data.name,
          identificacion: editingSupplier.data.taxId,
          observaciones: editingSupplier.data.observation || null,
          correo: editingSupplier.data.email && editingSupplier.data.email.trim() !== "" ? editingSupplier.data.email.trim() : null,
        },
      })

      // Invalidar y refetch la query de proveedores activos para actualizar el dropdown
      await queryClient.invalidateQueries({ queryKey: proveedoresKeys.list(true) })
      await queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() })
      await queryClient.refetchQueries({ queryKey: proveedoresKeys.list(true) })

      setEditingSupplier(null)
      setShowEditSupplier(false)

      // Toast personalizado de éxito (visual)
      setSupplierSuccessMessage(`El proveedor "${editingSupplier.data.name}" ha sido actualizado correctamente.`)
      setShowSupplierSuccessToast(true)
      setTimeout(() => setShowSupplierSuccessToast(false), 5000)
      
      // Toast del hook (opcional, se puede mantener o quitar)
      toast({
        title: "Proveedor actualizado",
        description: `El proveedor "${editingSupplier.data.name}" ha sido actualizado correctamente.`,
      })
    } catch (error: any) {
      // Manejar errores específicos
      let errorMessage = "Ocurrió un error al actualizar el proveedor."
      let errorTitle = "Error al actualizar proveedor"

      // Obtener el mensaje del error
      const errorMsg = error?.message || error?.toString() || ""

      if (error instanceof NetworkError) {
        errorTitle = "Error de conexión"
        errorMessage = "No se pudo conectar con el servidor. Por favor, verifica que la API esté en ejecución e intenta nuevamente."
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        })
      } else if (error instanceof ApiError) {
        errorMessage = error.message || errorMsg
        // Verificar si es el error de proveedor duplicado (verificar múltiples variantes)
        const lowerMsg = errorMessage.toLowerCase()
        if (
          lowerMsg.includes("ya existe") || 
          lowerMsg.includes("duplicado") ||
          (lowerMsg.includes("identificación") && lowerMsg.includes("ya existe"))
        ) {
          // Mostrar toast visual personalizado para identificación duplicada
          const duplicateMsg = lowerMsg.includes("identificación") 
            ? (errorMessage || "Ya existe un proveedor con esta identificación.")
            : "Ya existe un proveedor con este nombre o identificación."
          setDuplicateSupplierMessage(duplicateMsg)
          setShowDuplicateSupplierToast(true)
          setTimeout(() => setShowDuplicateSupplierToast(false), 5000)
        } else if (lowerMsg.includes("solo puede contener números y guiones")) {
          // Mostrar toast visual personalizado para identificación inválida
          setHasInvalidTaxIdError(true)
          setShowInvalidTaxIdToast(true)
          setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
        } else {
          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
          })
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMsg
        // Verificar también en errores genéricos
        const lowerMsg = errorMessage.toLowerCase()
        if (
          lowerMsg.includes("ya existe") || 
          lowerMsg.includes("duplicado") ||
          (lowerMsg.includes("identificación") && lowerMsg.includes("ya existe"))
        ) {
          // Mostrar toast visual personalizado para identificación duplicada
          const duplicateMsg = lowerMsg.includes("identificación") 
            ? (errorMessage || "Ya existe un proveedor con esta identificación.")
            : "Ya existe un proveedor con este nombre o identificación."
          setDuplicateSupplierMessage(duplicateMsg)
          setShowDuplicateSupplierToast(true)
          setTimeout(() => setShowDuplicateSupplierToast(false), 5000)
        } else if (lowerMsg.includes("solo puede contener números y guiones")) {
          // Mostrar toast visual personalizado para identificación inválida
          setHasInvalidTaxIdError(true)
          setShowInvalidTaxIdToast(true)
          setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
        } else {
          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (supplier) {
      setDeletingSupplier({
        id: supplierId,
        name: supplier.nombre
      })
      setShowDeleteSupplier(true)
    }
  }

  const handleDeleteSupplierConfirm = async () => {
    if (deletingSupplier) {
      try {
        // Desactivar en lugar de eliminar (los proveedores no tienen DELETE según la documentación)
        await deactivateProveedorMutation.mutateAsync(deletingSupplier.id)
        
        // Limpiar el proveedor seleccionado si es el que se está desactivando
        if (formData.supplierId === deletingSupplier.id) {
          handleInputChange("supplierId", "")
        }
        
        setDeletingSupplier(null)
        setShowDeleteSupplier(false)
      } catch (error) {
        // Los errores ya se manejan en los hooks
      }
    }
  }

  const addItem = () => {
    const item: PurchaseInvoiceItem = {
      id: `item-${Date.now()}`,
      productId: "",
      productName: "",
      price: 0,
      discount: 0,
      taxRate: 19,
      quantity: 1,
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      total: 0,
    }

    setFormData(prev => {
      const updatedItems = [...prev.items, item]
      setValue("items", updatedItems, { shouldValidate: true })
      return { ...prev, items: updatedItems }
    })
  }

  const removeItem = (itemId: string) => {
    setFormData(prev => {
      const updatedItems = prev.items.filter(item => item.id !== itemId)
      setValue("items", updatedItems, { shouldValidate: true })
      return { ...prev, items: updatedItems }
    })
  }

  const updateItem = (itemId: string, field: keyof PurchaseInvoiceItem, value: any) => {
    setFormData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          let updatedItem = { ...item, [field]: value }
          
          // Si se actualiza el producto, también actualizar el nombre
          if (field === 'productId') {
            // Buscar el producto en la lista actual de productos (de la bodega seleccionada)
            const product = products.find((p: any) => p.id === value) as any
            updatedItem.productName = product ? (product.nombre || product.name) : ""
            // Si el producto tiene precio base, usarlo como precio por defecto
            const precioBase = product?.precioBase || product?.basePrice || 0
            if (product && precioBase > 0 && updatedItem.price === 0) {
              updatedItem.price = precioBase
            }
          }
          
          // Validar descuento cuando se actualiza
          if (field === 'discount' && value > 100) {
            setShowDiscountErrorToast(true)
            setTimeout(() => setShowDiscountErrorToast(false), 5000)
            // Limitar el descuento a 100%
            updatedItem.discount = 100
            value = 100
          }
          
          // Recalcular totales si se actualizan campos numéricos
          if (['price', 'discount', 'taxRate', 'quantity'].includes(field)) {
            const subtotal = updatedItem.price * updatedItem.quantity
            // Solo calcular si el descuento es válido (<= 100%)
            const discountPercent = updatedItem.discount <= 100 ? updatedItem.discount : 0
            const discountAmount = (subtotal * discountPercent) / 100
            const subtotalAfterDiscount = subtotal - discountAmount
            const taxAmount = (subtotalAfterDiscount * updatedItem.taxRate) / 100
            const total = subtotalAfterDiscount + taxAmount
            
            updatedItem = {
              ...updatedItem,
              subtotal,
              discountAmount: updatedItem.discount <= 100 ? discountAmount : 0,
              taxAmount: updatedItem.discount <= 100 ? taxAmount : 0,
              total: updatedItem.discount <= 100 ? total : subtotal
            }
          }
          
          return updatedItem
        }
        return item
      })
      
      // Sincronizar con React Hook Form
      setValue("items", updatedItems, { shouldValidate: true })
      
      return { ...prev, items: updatedItems }
    })
  }

  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0)
    // Solo calcular descuento, impuesto y total si todos los items tienen descuento válido (<= 100%)
    const hasInvalidDiscount = formData.items.some(item => item.discount > 100)
    const totalDiscount = hasInvalidDiscount ? 0 : formData.items.reduce((sum, item) => sum + item.discountAmount, 0)
    const totalTax = hasInvalidDiscount ? 0 : formData.items.reduce((sum, item) => sum + item.taxAmount, 0)
    const totalAmount = hasInvalidDiscount ? subtotal : formData.items.reduce((sum, item) => sum + item.total, 0)

    return { subtotal, totalDiscount, totalTax, totalAmount }
  }, [formData.items])

  const handleFormSubmit = async (data: InvoiceFormSchema) => {
    // Aquí se ejecuta cuando la validación es exitosa
    const warehouse = warehouses.find(w => w.id === data.warehouseId)
    const supplier = suppliers.find(s => s.id === data.supplierId)
    
    if (!warehouse || !supplier) {
      toast({
        title: "Error",
        description: "Por favor selecciona una bodega y un proveedor válidos.",
        variant: "destructive",
      })
      return
    }

    // Filtrar items vacíos (sin producto seleccionado) y mapear al formato del backend
    const validItems = formData.items.filter(item => item.productId && item.productId.trim() !== "")
    
    if (validItems.length === 0) {
      setShowItemsErrorToast(true)
      setTimeout(() => setShowItemsErrorToast(false), 4000)
      return
    }

    // Validar que todos los items tengan datos válidos
    const items: CreateFacturaCompraItemDto[] = validItems.map(item => {
      // Validar que el productoId sea un GUID válido
      if (!item.productId || item.productId.trim() === "") {
        throw new Error("Todos los items deben tener un producto seleccionado")
      }
      
      const cantidad = Number(item.quantity)
      const costoUnitario = Number(item.price)
      
      // Validar que cantidad y costoUnitario sean números válidos y positivos
      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error("La cantidad debe ser mayor a 0")
      }
      if (isNaN(costoUnitario) || costoUnitario < 0) {
        throw new Error("El costo unitario debe ser mayor o igual a 0")
      }
      
      return {
        productoId: item.productId.trim(),
        cantidad: cantidad,
        costoUnitario: costoUnitario,
        descuento: Number(item.discountAmount) || 0, // Asegurar que sea un número válido
        impuesto: Number(item.taxAmount) || 0, // Asegurar que sea un número válido
      }
    })

    // Crear el DTO para el backend
    // Formatear la fecha correctamente: convertir a UTC con hora a medianoche
    // PostgreSQL requiere DateTime con Kind=UTC para timestamp with time zone
    const fechaDate = new Date(data.date + 'T00:00:00') // Crear fecha local a medianoche
    // Convertir a UTC manteniendo la misma fecha (medianoche UTC)
    const fechaUTC = new Date(Date.UTC(
      fechaDate.getFullYear(),
      fechaDate.getMonth(),
      fechaDate.getDate(),
      0, 0, 0, 0
    ))
    const fechaISO = fechaUTC.toISOString() // Formato: YYYY-MM-DDTHH:mm:ss.sssZ

    const facturaData: CreateFacturaCompraDto = {
      bodegaId: data.warehouseId,
      proveedorId: data.supplierId,
      fecha: fechaISO,
      observaciones: data.observations || null,
      items,
    }

    try {
      await createFacturaMutation.mutateAsync(facturaData)
      router.push("/invoices/purchase?created=true")
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  }

  const handleFormError = (errors: any) => {
    // Verificar si el error es específicamente por falta de items
    if (errors.items && errors.items.message === "Debe agregar al menos un item a la factura") {
      setShowItemsErrorToast(true)
      setTimeout(() => setShowItemsErrorToast(false), 4000)
    } else {
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 4000)
    }
  }

  // Funciones para cerrar modales
  const closeNewSupplierModal = () => {
    setShowNewSupplier(false)
    setNewSupplier({ name: "", taxId: "", observation: "", email: "" })
    setHasInvalidTaxIdError(false)
  }

  const closeEditSupplierModal = () => {
    setShowEditSupplier(false)
    setEditingSupplier(null)
    setHasInvalidTaxIdError(false)
  }

  const closeDeleteSupplierModal = () => {
    setShowDeleteSupplier(false)
    setDeletingSupplier(null)
  }

  // Manejar tecla Escape para cerrar modales
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNewSupplier) {
          closeNewSupplierModal()
        } else if (showEditSupplier) {
          closeEditSupplierModal()
        } else if (showDeleteSupplier) {
          closeDeleteSupplierModal()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showNewSupplier, showEditSupplier, showDeleteSupplier])

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <Receipt className="mr-3 h-8 w-8 text-camouflage-green-700" />
              Nueva Factura de Compra
            </h1>
            <p className="mt-1 text-camouflage-green-600">Crea una nueva factura de compra.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="md2"
              onClick={() => router.back()}
              className="text-black bg-white hover:text-black border border-gray-700  hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4 text-black" />
              Volver
            </Button>
            <Button
              size="md2"
              variant="primary"
              className="pl-4 pr-4"
              disabled={isSubmitting || createFacturaMutation.isPending || isLoadingWarehouses || isLoadingSuppliers || isLoadingProducts || isLoadingBodegaProductos}
              onClick={handleSubmit(handleFormSubmit, handleFormError)}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting || createFacturaMutation.isPending ? "Guardando..." : "Guardar Factura"}
            </Button>
          </div>
        </div>

        {/* Información de la Factura */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <CardTitle className="text-camouflage-green-900">Información de la Factura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Bodega */}
              <div className="space-y-2">
                <Label htmlFor="warehouse" className="text-camouflage-green-700">
                  Bodega *
                </Label>
                <Select value={formData.warehouseId} onValueChange={(value) => handleInputChange("warehouseId", value)}>
                    <SelectTrigger className={`border-camouflage-green-300 bg-white ${
                      errors?.warehouseId ? "border-red-500 focus:border-red-500" : "focus:border-camouflage-green-500"
                    }`}>
                      <SelectValue placeholder="Seleccionar bodega" />
                    </SelectTrigger>
                  <SelectContent className="rounded-3xl">
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Proveedor */}
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-camouflage-green-700">
                  Proveedor *
                </Label>
                <div className="flex items-center gap-2">
                  <Select value={formData.supplierId} onValueChange={(value) => {
                    if (value === "new-supplier") {
                      setShowNewSupplier(true)
                    } else {
                      handleInputChange("supplierId", value)
                    }
                  }}>
                      <SelectTrigger className={`border-camouflage-green-300 bg-white flex-1 ${
                        errors?.supplierId ? "border-red-500 focus:border-red-500" : "focus:border-camouflage-green-500"
                      }`}>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                    <SelectContent className="rounded-3xl">
                      {isLoadingSuppliers ? (
                        <SelectItem value="loading" disabled>
                          Cargando proveedores...
                        </SelectItem>
                      ) : suppliers.length === 0 ? (
                        <SelectItem value="no-suppliers" disabled>
                          No hay proveedores disponibles
                        </SelectItem>
                      ) : (
                        suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.nombre} - {supplier.identificacion || 'Sin identificación'}
                          </SelectItem>
                        ))
                      )}
                      <SelectItem value="new-supplier" className="text-camouflage-green-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Nuevo Proveedor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Botones de gestión de proveedores */}
                  {formData.supplierId && formData.supplierId !== "" && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSupplier(formData.supplierId)}
                        className="h-10 w-10 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100"
                        title="Editar proveedor"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSupplier(formData.supplierId)}
                        className="h-10 w-10 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100"
                        title="Eliminar proveedor"
                      >
                        <Trash2 className="h-4 w-4 text-gray-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-camouflage-green-700">
                  Fecha *
                </Label>
                <input
                  type="date"
                  id="date"
                  value={formData.date || ""}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 ${
                    errors?.date ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-camouflage-green-300 focus:border-camouflage-green-500"
                  }`}
                />
              </div>

              {/* Observaciones */}
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="observations" className="text-camouflage-green-700">
                  Observaciones
                </Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => handleInputChange("observations", e.target.value)}
                  placeholder="Observaciones adicionales sobre la factura..."
                  className={`
                    border-camouflage-green-300 
                    bg-white 
                    placeholder:text-camouflage-green-500 
                    min-h-[80px] 
                    resize-none
                    focus:outline-none 
                    focus:ring-0
                    focus:border-camouflage-green-500
                    ${errors?.observations ? "border-red-500 focus:border-red-500" : ""}
                  `}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items de la Factura - Tabla completa */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-camouflage-green-900">Items de la Factura</CardTitle>
              <Button
                onClick={addItem}
                variant="primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tabla de items dinámica */}
            {formData.items.length > 0 ? (
              <div className="w-full">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-camouflage-green-200 hover:bg-transparent">
                      <TableHead className="font-semibold text-camouflage-green-700 w-[300px]">Producto</TableHead>
                      <TableHead className="font-semibold text-camouflage-green-700 w-[120px]">Precio</TableHead>
                      <TableHead className="font-semibold text-camouflage-green-700 w-[120px]">Descuento %</TableHead>
                      <TableHead className="font-semibold text-camouflage-green-700 w-[150px]">Impuesto</TableHead>
                      <TableHead className="font-semibold text-camouflage-green-700 w-[120px]">Cantidad</TableHead>
                      <TableHead className="font-semibold text-camouflage-green-700 w-[120px]">Total</TableHead>
                      <TableHead className="font-semibold text-camouflage-green-700 w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item) => (
                      <TableRow key={item.id} className="border-camouflage-green-100 hover:bg-transparent">
                        <TableCell className="w-[300px]">
                          <Select 
                            value={item.productId} 
                            onValueChange={(value) => updateItem(item.id, 'productId', value)}
                            disabled={!formData.warehouseId}
                          >
                            <SelectTrigger className={`border-camouflage-green-300 h-8 rounded-lg bg-white text-left w-full ${
                              !formData.warehouseId ? 'opacity-50 cursor-not-allowed' : ''
                            }`}>
                              <SelectValue placeholder={formData.warehouseId ? "Seleccionar producto" : "Selecciona una bodega primero"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl">
                              {!formData.warehouseId ? (
                                <SelectItem value="no-warehouse" disabled>
                                  Selecciona una bodega primero
                                </SelectItem>
                              ) : isLoadingBodegaProductos ? (
                                <SelectItem value="loading" disabled>
                                  Cargando productos...
                                </SelectItem>
                              ) : products.length === 0 ? (
                                <SelectItem value="no-products" disabled>
                                  No hay productos disponibles en esta bodega
                                </SelectItem>
                              ) : (
                                products.map((product: any) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.nombre || product.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="w-[120px]">
                          <Input
                            type="number"
                            value={item.price || ""}
                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            disabled={!item.productId}
                            className={`border-camouflage-green-300 h-8 rounded-lg bg-white placeholder:text-camouflage-green-500 text-left w-full ${
                              !item.productId ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </TableCell>
                        <TableCell className="w-[120px]">
                          <Input
                            type="number"
                            value={item.discount || ""}
                            onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            disabled={!item.productId}
                            className={`border-camouflage-green-300 h-8 rounded-lg bg-white placeholder:text-camouflage-green-500 text-left w-full ${
                              !item.productId ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </TableCell>
                        <TableCell className="w-[150px]">
                          <Select 
                            value={item.taxRate.toString()} 
                            onValueChange={(value) => updateItem(item.id, 'taxRate', parseFloat(value))}
                            disabled={!item.productId}
                          >
                            <SelectTrigger className={`border-camouflage-green-300 h-8 rounded-lg bg-white text-left w-full ${
                              !item.productId ? 'opacity-50 cursor-not-allowed' : ''
                            }`}>
                              <SelectValue placeholder="Seleccionar impuesto" />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl">
                              <SelectItem value="0">Ninguno (0%)</SelectItem>
                              <SelectItem value="5">IVA - (5%)</SelectItem>
                              <SelectItem value="19">IVA - (19%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="w-[120px]">
                          <Input
                            type="number"
                            value={item.quantity || ""}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            placeholder="1"
                            disabled={!item.productId}
                            className={`border-camouflage-green-300 h-8 rounded-lg bg-white placeholder:text-camouflage-green-500 text-left w-full ${
                              !item.productId ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-camouflage-green-900 w-[120px]">
                          ${item.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="w-[100px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-gray-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-camouflage-green-500">
                <p>No hay items agregados.</p>
                <p className="text-sm mt-1">Haz clic en "Agregar Item" para comenzar.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen de Factura */}
        <Card className="border-camouflage-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-camouflage-green-900">
              <Calculator className="mr-2 h-5 w-5" />
              Resumen de Factura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-camouflage-green-50 p-4 rounded-lg border border-camouflage-green-200">
                <div className="text-sm text-camouflage-green-600">Subtotal</div>
                <div className="text-2xl font-bold text-camouflage-green-900">${totals.subtotal.toLocaleString()}</div>
              </div>
              <div className="bg-camouflage-green-100 p-4 rounded-lg border border-camouflage-green-300">
                <div className="text-sm text-camouflage-green-600">Descuento</div>
                <div className="text-2xl font-bold text-camouflage-green-900">-${totals.totalDiscount.toLocaleString()}</div>
              </div>
              <div className="bg-camouflage-green-200 p-4 rounded-lg border border-camouflage-green-400">
                <div className="text-sm text-camouflage-green-700">Impuesto</div>
                <div className="text-2xl font-bold text-camouflage-green-900">${totals.totalTax.toLocaleString()}</div>
              </div>
              <div className="bg-camouflage-green-300 p-4 rounded-lg border-2 border-camouflage-green-500">
                <div className="text-sm text-camouflage-green-800">Total</div>
                <div className="text-2xl font-bold text-camouflage-green-900">${totals.totalAmount.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal para nuevo proveedor */}
        <Modal
          isOpen={showNewSupplier}
          onClose={closeNewSupplierModal}
          title="Nuevo Proveedor"
          size="lg"
        >
          <div className="space-y-4">
            <div className="space-y-1 pt-2.5">
              <Label htmlFor="supplierName" className="font-medium text-camouflage-green-700">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="supplierName"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del proveedor"
                className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierId" className="font-medium text-camouflage-green-700">
                Identificación <span className="text-red-500">*</span>
              </Label>
              <Input
                id="supplierId"
                value={newSupplier.taxId}
                onChange={(e) => {
                  setNewSupplier(prev => ({ ...prev, taxId: e.target.value }))
                  // Limpiar el error cuando el usuario empiece a escribir
                  if (hasInvalidTaxIdError) {
                    setHasInvalidTaxIdError(false)
                  }
                }}
                placeholder="NIT, RUC, etc."
                className={`bg-white placeholder:text-gray-400 ${
                  hasInvalidTaxIdError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-camouflage-green-300 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                }`}
                disabled={createProveedorMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierEmail" className="font-medium text-camouflage-green-700">
                Correo
              </Label>
              <Input
                id="supplierEmail"
                type="email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
                className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierObservation" className="font-medium text-camouflage-green-700">
                Observaciones
              </Label>
              <Textarea
                id="supplierObservation"
                value={newSupplier.observation}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, observation: e.target.value }))}
                placeholder="Observaciones adicionales"
                className="scrollbar-thin scrollbar-thumb-camouflage-green-300 scrollbar-track-gray-100 min-h-[80px] resize-none border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                style={{
                  outline: "none",
                  boxShadow: "none",
                }}
                onFocus={(e) => {
                  e.target.style.outline = "none"
                  e.target.style.boxShadow = "none"
                }}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={closeNewSupplierModal}
                className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleNewSupplierSubmit}
                className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
                disabled={!newSupplier.name.trim() || !newSupplier.taxId.trim() || createProveedorMutation.isPending}
              >
                {createProveedorMutation.isPending ? "Creando..." : "Crear Proveedor"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal para editar proveedor */}
        {editingSupplier && (
          <Modal
            isOpen={showEditSupplier}
            onClose={closeEditSupplierModal}
            title="Editar Proveedor"
            size="lg"
          >
            <div className="space-y-4">
              <div className="space-y-1 pt-2.5">
                <Label htmlFor="editSupplierName" className="font-medium text-camouflage-green-700">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editSupplierName"
                  value={editingSupplier.data.name}
                  onChange={(e) => setEditingSupplier(prev => prev ? {
                    ...prev,
                    data: { ...prev.data, name: e.target.value }
                  } : null)}
                  placeholder="Nombre del proveedor"
                  className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSupplierId" className="font-medium text-camouflage-green-700">
                  Identificación <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editSupplierId"
                  value={editingSupplier.data.taxId}
                  onChange={(e) => {
                    setEditingSupplier(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, taxId: e.target.value }
                    } : null)
                    // Limpiar el error cuando el usuario empiece a escribir
                    if (hasInvalidTaxIdError) {
                      setHasInvalidTaxIdError(false)
                    }
                  }}
                  placeholder="NIT, RUC, etc."
                  className={`bg-white placeholder:text-gray-400 ${
                    hasInvalidTaxIdError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-camouflage-green-300 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                  }`}
                  disabled={updateProveedorMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSupplierEmail" className="font-medium text-camouflage-green-700">
                  Correo
                </Label>
                <Input
                  id="editSupplierEmail"
                  type="email"
                  value={editingSupplier.data.email}
                  onChange={(e) => setEditingSupplier(prev => prev ? {
                    ...prev,
                    data: { ...prev.data, email: e.target.value }
                  } : null)}
                  placeholder="correo@ejemplo.com"
                  className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSupplierObservation" className="font-medium text-camouflage-green-700">
                  Observaciones
                </Label>
                <Textarea
                  id="editSupplierObservation"
                  value={editingSupplier.data.observation}
                  onChange={(e) => setEditingSupplier(prev => prev ? {
                    ...prev,
                    data: { ...prev.data, observation: e.target.value }
                  } : null)}
                  placeholder="Observaciones adicionales"
                  className="scrollbar-thin scrollbar-thumb-camouflage-green-300 scrollbar-track-gray-100 min-h-[80px] resize-none border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                  style={{
                    outline: "none",
                    boxShadow: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.outline = "none"
                    e.target.style.boxShadow = "none"
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeEditSupplierModal}
                  className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEditSupplierSubmit}
                  className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
                  disabled={!editingSupplier.data.name.trim() || !editingSupplier.data.taxId.trim() || updateProveedorMutation.isPending}
                >
                  {updateProveedorMutation.isPending ? "Actualizando..." : "Actualizar Proveedor"}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal de confirmación para eliminar proveedor */}
        {showDeleteSupplier && deletingSupplier && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={closeDeleteSupplierModal}
          >
            <Card className="w-full max-w-md border-camouflage-green-200 shadow-xl">
              <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <CardHeader>
                  <CardTitle className="text-camouflage-green-900">Confirmar Desactivación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-camouflage-green-700">
                    ¿Estás seguro de que quieres desactivar al proveedor <strong>{deletingSupplier.name}</strong>?
                  </p>
                  <p className="text-sm text-camouflage-green-600">
                    El proveedor será desactivado y no podrá ser usado en nuevas facturas.
                  </p>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleDeleteSupplierConfirm}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                      disabled={deactivateProveedorMutation.isPending}
                    >
                      {deactivateProveedorMutation.isPending ? "Desactivando..." : "Desactivar"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={closeDeleteSupplierModal}
                      className="flex-1 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                      disabled={deactivateProveedorMutation.isPending}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        )}

        {/* Toast de error de validación */}
        {showErrorToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">
                Error, verifica los campos marcados en rojo para continuar
              </p>
            </div>
          </div>
        )}

        {/* Toast específico para falta de items */}
        {showItemsErrorToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <p className="text-sm font-medium text-orange-800">
                Debe agregar al menos un item a la factura para continuar
              </p>
            </div>
          </div>
        )}

        {/* Toast específico para identificación duplicada de proveedor */}
        {showDuplicateSupplierToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">
                {duplicateSupplierMessage}
              </p>
            </div>
          </div>
        )}

        {/* Toast específico para identificación inválida (solo números y guiones) */}
        {showInvalidTaxIdToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">
                La identificación solo puede contener números y guiones.
              </p>
            </div>
          </div>
        )}

        {/* Toast de éxito para proveedores */}
        {showSupplierSuccessToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                {supplierSuccessMessage}
              </p>
            </div>
          </div>
        )}

        {/* Toast de error de descuento */}
        {showDiscountErrorToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">
                El porcentaje de descuento no puede ser mayor que el permitido: 100%
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
