"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Receipt,
  Save,
  Plus,
  Trash2,
  UserPlus,
  ArrowLeft,
  Calculator,
  Edit,
  AlertCircle,
  CheckCircle,
  X,
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
import { SalesInvoiceItem } from "@/lib/types/invoices"
import { useBodegasActive, useBodegaProductos } from "@/hooks/api/use-bodegas"
import { useVendedoresActive, useCreateVendedor, useUpdateVendedor, useDeactivateVendedor, vendedoresKeys } from "@/hooks/api/use-vendedores"
import { useQueryClient } from "@tanstack/react-query"
import { ApiError, NetworkError } from "@/lib/api/errors"
import { useProductos } from "@/hooks/api/use-productos"
import { useCreateFacturaVenta } from "@/hooks/api/use-facturas-venta"
import type { CreateFacturaVentaDto, CreateFacturaVentaItemDto } from "@/lib/api/types"

// Esquema de validación con Zod
const invoiceSchema = z
  .object({
    warehouseId: z.string().min(1, "La bodega es requerida"),
    salespersonId: z.string().min(1, "El vendedor es requerido"),
    date: z.string().min(1, "La fecha es requerida"),
    paymentType: z.enum(["cash", "credit"], {
      required_error: "La forma de pago es requerida",
    }),
    paymentMethod: z.string().min(1, "El medio de pago es requerido"),
    paymentTerm: z.string().optional(),
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
  .refine((data) => {
    // Si el tipo de pago es crédito, el plazo de pago es requerido
    if (data.paymentType === "credit") {
      return data.paymentTerm && data.paymentTerm.length > 0
    }
    return true
  }, {
    message: "El plazo de pago es requerido cuando se selecciona Crédito",
    path: ["paymentTerm"],
  })

type InvoiceFormSchema = z.infer<typeof invoiceSchema>

// Esquema para vendedores
const salespersonSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  identification: z.string()
    .min(1, "La identificación es requerida")
    .regex(/^[0-9-]+$/, "La identificación solo puede contener números y guiones."),
  observation: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
})

type SalespersonFormSchema = z.infer<typeof salespersonSchema>

interface InvoiceFormData {
  warehouseId: string
  salespersonId: string
  date: string
  paymentType: "cash" | "credit"
  paymentMethod: string
  paymentTerm: string
  observations: string
  items: SalesInvoiceItem[]
}

interface NewSalespersonForm {
  name: string
  identification: string
  observation: string
  email: string
}

export default function NewSalesInvoice() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Obtener datos del backend
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useBodegasActive(true)
  const { data: salespersonsData, isLoading: isLoadingSalespersons } = useVendedoresActive()

  // Mutaciones
  const createFacturaMutation = useCreateFacturaVenta()
  const createVendedorMutation = useCreateVendedor()
  const updateVendedorMutation = useUpdateVendedor()
  const deactivateVendedorMutation = useDeactivateVendedor()

  // Estado del formulario principal
  const [formData, setFormData] = useState<InvoiceFormData>({
    warehouseId: "",
    salespersonId: "",
    date: new Date().toISOString().split('T')[0],
    paymentType: "cash",
    paymentMethod: "",
    paymentTerm: "",
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
  
  // Filtrar solo vendedores activos (medida de seguridad adicional)
  const salespersons = Array.isArray(salespersonsData) 
    ? salespersonsData.filter((salesperson) => salesperson.activo === true)
    : []

  // Estado para nuevo vendedor
  const [showNewSalesperson, setShowNewSalesperson] = useState(false)
  const [newSalesperson, setNewSalesperson] = useState<NewSalespersonForm>({
    name: "",
    identification: "",
    observation: "",
    email: "",
  })

  // Estado para editar vendedor
  const [showEditSalesperson, setShowEditSalesperson] = useState(false)
  const [editingSalesperson, setEditingSalesperson] = useState<{ id: string; data: NewSalespersonForm } | null>(null)

  // Estado para eliminar vendedor
  const [showDeleteSalesperson, setShowDeleteSalesperson] = useState(false)
  const [deletingSalesperson, setDeletingSalesperson] = useState<{ id: string; name: string } | null>(null)

  // Estado para mostrar errores de validación
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [showItemsErrorToast, setShowItemsErrorToast] = useState(false)
  const [showDuplicateSalespersonToast, setShowDuplicateSalespersonToast] = useState(false)
  const [duplicateSalespersonMessage, setDuplicateSalespersonMessage] = useState("")
  const [showInvalidIdentificationToast, setShowInvalidIdentificationToast] = useState(false)
  const [hasInvalidIdentificationError, setHasInvalidIdentificationError] = useState(false)
  const [showNameRequiredToast, setShowNameRequiredToast] = useState(false)
  const [showDiscountErrorToast, setShowDiscountErrorToast] = useState(false)
  const [showStockWarningToast, setShowStockWarningToast] = useState(false)
  const [stockWarningMessage, setStockWarningMessage] = useState("")
  const [showStockErrorToast, setShowStockErrorToast] = useState(false)
  const [stockErrorMessage, setStockErrorMessage] = useState("")
  
  // Estado para toasts de éxito de vendedores
  const [showSalespersonSuccessToast, setShowSalespersonSuccessToast] = useState(false)
  const [salespersonSuccessMessage, setSalespersonSuccessMessage] = useState("")

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
      salespersonId: formData.salespersonId,
      date: formData.date,
      paymentType: formData.paymentType,
      paymentMethod: formData.paymentMethod,
      paymentTerm: formData.paymentTerm,
      observations: formData.observations,
      items: formData.items,
    },
  })

  // Sincronizar el estado inicial del formulario con React Hook Form
  useEffect(() => {
    setValue("items", formData.items, { shouldValidate: false })
  }, [formData.items, setValue]) // Solo al montar el componente

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
    } else if (field === 'paymentType' && value === 'cash') {
      // Si se cambia a contado, limpiar el plazo de pago
      setFormData(prev => {
        const newData = { ...prev, [field]: value as "cash" | "credit", paymentTerm: "" }
        setValue("paymentTerm", "", { shouldValidate: true })
        return newData
      })
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    setValue(field as any, value, { shouldValidate: true })
  }

  const handleNewSalespersonSubmit = async () => {
    // Validar que el nombre no esté vacío
    if (!newSalesperson.name || newSalesperson.name.trim() === "") {
      setShowNameRequiredToast(true)
      setTimeout(() => setShowNameRequiredToast(false), 5000)
      return
    }

    // Validar formato de identificación antes de enviar
    const identificationRegex = /^[0-9-]+$/
    if (!identificationRegex.test(newSalesperson.identification)) {
      setHasInvalidIdentificationError(true)
      setShowInvalidIdentificationToast(true)
      setTimeout(() => setShowInvalidIdentificationToast(false), 5000)
      return
    }

    const result = salespersonSchema.safeParse(newSalesperson)
    
    if (!result.success) {
      // Verificar si el error es de nombre
      const nameError = result.error.errors.find(err => err.path.includes("name"))
      if (nameError) {
        setShowNameRequiredToast(true)
        setTimeout(() => setShowNameRequiredToast(false), 5000)
        return
      }
      // Verificar si el error es de identificación
      const identificationError = result.error.errors.find(err => err.path.includes("identification"))
      if (identificationError && identificationError.message.includes("solo puede contener números y guiones")) {
        setHasInvalidIdentificationError(true)
        setShowInvalidIdentificationToast(true)
        setTimeout(() => setShowInvalidIdentificationToast(false), 5000)
      } else {
        setHasInvalidIdentificationError(false)
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos.",
          variant: "destructive",
        })
      }
      return
    }

    // Si llegamos aquí, la validación pasó
    setHasInvalidIdentificationError(false)

    try {
      const response = await createVendedorMutation.mutateAsync({
        nombre: newSalesperson.name,
        identificacion: newSalesperson.identification,
        observaciones: newSalesperson.observation || null,
        correo: newSalesperson.email && newSalesperson.email.trim() !== "" ? newSalesperson.email.trim() : null,
      })

      // Invalidar y refetch la query de vendedores activos para actualizar el dropdown
      await queryClient.invalidateQueries({ queryKey: vendedoresKeys.list(true) })
      await queryClient.invalidateQueries({ queryKey: vendedoresKeys.lists() })
      await queryClient.refetchQueries({ queryKey: vendedoresKeys.list(true) })

      // Limpiar el formulario y cerrar modal
      setNewSalesperson({ name: "", identification: "", observation: "", email: "" })
      setShowNewSalesperson(false)
      
      // Toast personalizado de éxito (visual)
      setSalespersonSuccessMessage(`El vendedor "${newSalesperson.name}" ha sido creado exitosamente.`)
      setShowSalespersonSuccessToast(true)
      setTimeout(() => setShowSalespersonSuccessToast(false), 5000)
      
      // Seleccionar el vendedor recién creado
      if (response.data) {
        handleInputChange("salespersonId", response.data.id)
      }
    } catch (error: any) {
      // Manejar errores específicos
      let errorMessage = "Ocurrió un error al crear el vendedor."
      let errorTitle = "Error al crear vendedor"

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
        // Verificar si es el error de vendedor duplicado
        const lowerMsg = errorMessage.toLowerCase()
        if (
          lowerMsg.includes("ya existe") || 
          lowerMsg.includes("duplicado") ||
          (lowerMsg.includes("identificación") && lowerMsg.includes("ya existe"))
        ) {
          const duplicateMsg = lowerMsg.includes("identificación") 
            ? (errorMessage || "Ya existe un vendedor con esta identificación.")
            : "Ya existe un vendedor con este nombre o identificación."
          setDuplicateSalespersonMessage(duplicateMsg)
          setShowDuplicateSalespersonToast(true)
          setTimeout(() => setShowDuplicateSalespersonToast(false), 5000)
        } else if (lowerMsg.includes("solo puede contener números y guiones")) {
          setHasInvalidIdentificationError(true)
          setShowInvalidIdentificationToast(true)
          setTimeout(() => setShowInvalidIdentificationToast(false), 5000)
        } else {
          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
          })
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMsg
        const lowerMsg = errorMessage.toLowerCase()
        if (
          lowerMsg.includes("ya existe") || 
          lowerMsg.includes("duplicado") ||
          (lowerMsg.includes("identificación") && lowerMsg.includes("ya existe"))
        ) {
          const duplicateMsg = lowerMsg.includes("identificación") 
            ? (errorMessage || "Ya existe un vendedor con esta identificación.")
            : "Ya existe un vendedor con este nombre o identificación."
          setDuplicateSalespersonMessage(duplicateMsg)
          setShowDuplicateSalespersonToast(true)
          setTimeout(() => setShowDuplicateSalespersonToast(false), 5000)
        } else if (lowerMsg.includes("solo puede contener números y guiones")) {
          setHasInvalidIdentificationError(true)
          setShowInvalidIdentificationToast(true)
          setTimeout(() => setShowInvalidIdentificationToast(false), 5000)
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

  const handleEditSalesperson = (salespersonId: string) => {
    const salesperson = salespersons.find(s => s.id === salespersonId)
    if (salesperson) {
      setEditingSalesperson({
        id: salespersonId,
        data: {
          name: salesperson.nombre,
          identification: salesperson.identificacion || "",
          observation: salesperson.observaciones || "",
          email: salesperson.correo || "",
        }
      })
      setShowEditSalesperson(true)
    }
  }

  const handleEditSalespersonSubmit = async () => {
    if (!editingSalesperson) return
    
    // Validar que el nombre no esté vacío
    if (!editingSalesperson.data.name || editingSalesperson.data.name.trim() === "") {
      setShowNameRequiredToast(true)
      setTimeout(() => setShowNameRequiredToast(false), 5000)
      return
    }
    
    // Validar formato de identificación antes de enviar
    const identificationRegex = /^[0-9-]+$/
    if (!identificationRegex.test(editingSalesperson.data.identification)) {
      setHasInvalidIdentificationError(true)
      setShowInvalidIdentificationToast(true)
      setTimeout(() => setShowInvalidIdentificationToast(false), 5000)
      return
    }
    
    const result = salespersonSchema.safeParse(editingSalesperson.data)
    
    if (!result.success) {
      // Verificar si el error es de nombre
      const nameError = result.error.errors.find(err => err.path.includes("name"))
      if (nameError) {
        setShowNameRequiredToast(true)
        setTimeout(() => setShowNameRequiredToast(false), 5000)
        return
      }
      // Verificar si el error es de identificación
      const identificationError = result.error.errors.find(err => err.path.includes("identification"))
      if (identificationError && identificationError.message.includes("solo puede contener números y guiones")) {
        setHasInvalidIdentificationError(true)
        setShowInvalidIdentificationToast(true)
        setTimeout(() => setShowInvalidIdentificationToast(false), 5000)
      } else {
        setHasInvalidIdentificationError(false)
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos.",
          variant: "destructive",
        })
      }
      return
    }

    // Si llegamos aquí, la validación pasó
    setHasInvalidIdentificationError(false)

    try {
      await updateVendedorMutation.mutateAsync({
        id: editingSalesperson.id,
        data: {
          nombre: editingSalesperson.data.name,
          identificacion: editingSalesperson.data.identification,
          observaciones: editingSalesperson.data.observation || null,
          correo: editingSalesperson.data.email && editingSalesperson.data.email.trim() !== "" ? editingSalesperson.data.email.trim() : null,
        },
      })

      // Invalidar y refetch la query de vendedores activos para actualizar el dropdown
      await queryClient.invalidateQueries({ queryKey: vendedoresKeys.list(true) })
      await queryClient.invalidateQueries({ queryKey: vendedoresKeys.lists() })
      await queryClient.refetchQueries({ queryKey: vendedoresKeys.list(true) })

      setEditingSalesperson(null)
      setShowEditSalesperson(false)

      // Toast personalizado de éxito (visual)
      setSalespersonSuccessMessage(`El vendedor "${editingSalesperson.data.name}" ha sido actualizado correctamente.`)
      setShowSalespersonSuccessToast(true)
      setTimeout(() => setShowSalespersonSuccessToast(false), 5000)
    } catch (error: any) {
      // Manejar errores específicos
      let errorMessage = "Ocurrió un error al actualizar el vendedor."
      let errorTitle = "Error al actualizar vendedor"

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
        const lowerMsg = errorMessage.toLowerCase()
        
        // Verificar si hay errores de validación en el array de errores
        const hasNombreError = error.errors?.some(err => {
          const fieldLower = err.field?.toLowerCase() || ""
          const msgLower = err.message?.toLowerCase() || ""
          return (fieldLower.includes("nombre") || fieldLower.includes("name")) && 
                 (msgLower.includes("requerido") || msgLower.includes("required") || 
                  msgLower.includes("presente") || msgLower.includes("present") || 
                  msgLower.includes("obligatorio") || msgLower.includes("cannot be empty"))
        })
        
        // Detectar errores relacionados con nombre requerido (más flexible)
        if (
          hasNombreError ||
          (lowerMsg.includes("nombre") && (lowerMsg.includes("requerido") || lowerMsg.includes("required") || lowerMsg.includes("presente") || lowerMsg.includes("present") || lowerMsg.includes("obligatorio"))) ||
          (lowerMsg.includes("name") && (lowerMsg.includes("required") || lowerMsg.includes("cannot be empty") || lowerMsg.includes("must not be empty"))) ||
          (lowerMsg.includes("el campo") && lowerMsg.includes("nombre") && (lowerMsg.includes("es requerido") || lowerMsg.includes("es obligatorio"))) ||
          (error.statusCode === 400 && (lowerMsg.includes("nombre") || lowerMsg.includes("name")))
        ) {
          setShowNameRequiredToast(true)
          setTimeout(() => setShowNameRequiredToast(false), 5000)
        } else if (
          lowerMsg.includes("ya existe") || 
          lowerMsg.includes("duplicado") ||
          (lowerMsg.includes("identificación") && lowerMsg.includes("ya existe"))
        ) {
          const duplicateMsg = lowerMsg.includes("identificación") 
            ? (errorMessage || "Ya existe un vendedor con esta identificación.")
            : "Ya existe un vendedor con este nombre o identificación."
          setDuplicateSalespersonMessage(duplicateMsg)
          setShowDuplicateSalespersonToast(true)
          setTimeout(() => setShowDuplicateSalespersonToast(false), 5000)
        } else if (lowerMsg.includes("solo puede contener números y guiones")) {
          setHasInvalidIdentificationError(true)
          setShowInvalidIdentificationToast(true)
          setTimeout(() => setShowInvalidIdentificationToast(false), 5000)
        } else {
          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
          })
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMsg
        const lowerMsg = errorMessage.toLowerCase()
        // Detectar errores relacionados con nombre requerido (más flexible)
        if (
          (lowerMsg.includes("nombre") && (lowerMsg.includes("requerido") || lowerMsg.includes("required") || lowerMsg.includes("presente") || lowerMsg.includes("present") || lowerMsg.includes("obligatorio"))) ||
          (lowerMsg.includes("name") && (lowerMsg.includes("required") || lowerMsg.includes("cannot be empty") || lowerMsg.includes("must not be empty"))) ||
          (lowerMsg.includes("el campo") && lowerMsg.includes("nombre") && (lowerMsg.includes("es requerido") || lowerMsg.includes("es obligatorio")))
        ) {
          setShowNameRequiredToast(true)
          setTimeout(() => setShowNameRequiredToast(false), 5000)
        } else if (
          lowerMsg.includes("ya existe") || 
          lowerMsg.includes("duplicado") ||
          (lowerMsg.includes("identificación") && lowerMsg.includes("ya existe"))
        ) {
          const duplicateMsg = lowerMsg.includes("identificación") 
            ? (errorMessage || "Ya existe un vendedor con esta identificación.")
            : "Ya existe un vendedor con este nombre o identificación."
          setDuplicateSalespersonMessage(duplicateMsg)
          setShowDuplicateSalespersonToast(true)
          setTimeout(() => setShowDuplicateSalespersonToast(false), 5000)
        } else if (lowerMsg.includes("solo puede contener números y guiones")) {
          setHasInvalidIdentificationError(true)
          setShowInvalidIdentificationToast(true)
          setTimeout(() => setShowInvalidIdentificationToast(false), 5000)
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

  const handleDeleteSalesperson = (salespersonId: string) => {
    const salesperson = salespersons.find(s => s.id === salespersonId)
    if (salesperson) {
      setDeletingSalesperson({
        id: salespersonId,
        name: salesperson.nombre
      })
      setShowDeleteSalesperson(true)
    }
  }

  const handleDeleteSalespersonConfirm = async () => {
    if (deletingSalesperson) {
      try {
        // Desactivar en lugar de eliminar
        await deactivateVendedorMutation.mutateAsync(deletingSalesperson.id)
        
        // Limpiar el vendedor seleccionado si es el que se está desactivando
        if (formData.salespersonId === deletingSalesperson.id) {
          handleInputChange("salespersonId", "")
        }
        
        setDeletingSalesperson(null)
        setShowDeleteSalesperson(false)
      } catch (error) {
        // Los errores ya se manejan en los hooks
      }
    }
  }

  const addItem = () => {
    const item: SalesInvoiceItem = {
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

  // Función helper para obtener el stock disponible de un producto
  const getStockDisponible = (productId: string): number => {
    const product = products.find((p: any) => p.id === productId) as any
    if (!product) return 0
    
    // Obtener stock disponible en la bodega seleccionada
    // Prioridad: cantidadEnBodega (stock específico de la bodega) > stock (ya mapeado) > stockActual
    if ((product as any).cantidadEnBodega !== undefined) {
      return (product as any).cantidadEnBodega
    } else if (formData.warehouseId && bodegaProductosData?.items) {
      return product.stock || 0
    } else {
      return (product as any).stockActual || product.stock || 0
    }
  }

  // Función helper para calcular la cantidad total de un producto en todas las filas (excluyendo la fila actual)
  const getCantidadTotalEnOtrasFilas = (productId: string, excludeItemId: string, items: SalesInvoiceItem[]): number => {
    return items
      .filter(item => item.id !== excludeItemId && item.productId === productId && item.productId !== "")
      .reduce((sum, item) => sum + (item.quantity || 0), 0)
  }

  const updateItem = (itemId: string, field: keyof SalesInvoiceItem, value: any) => {
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
          
          // Validar stock cuando se actualiza cantidad o producto
          if (field === 'quantity' || field === 'productId') {
            if (updatedItem.productId && updatedItem.productId !== "") {
              const product = products.find((p: any) => p.id === updatedItem.productId) as any
              if (product) {
                const stockDisponible = getStockDisponible(updatedItem.productId)
                // Calcular la cantidad total de este producto en otras filas (excluyendo la fila actual)
                const cantidadEnOtrasFilas = getCantidadTotalEnOtrasFilas(updatedItem.productId, itemId, prev.items)
                // Calcular la cantidad disponible para esta fila
                const cantidadDisponibleEnFila = Math.max(0, stockDisponible - cantidadEnOtrasFilas)
                
                // Si se está seleccionando un producto nuevo, establecer cantidad inicial
                if (field === 'productId') {
                  // Si hay stock disponible, establecer cantidad en 1, sino en 0
                  if (cantidadDisponibleEnFila > 0 && updatedItem.quantity === 0) {
                    updatedItem.quantity = 1
                  } else if (cantidadDisponibleEnFila === 0) {
                    updatedItem.quantity = 0
                  }
                }
                
                // Calcular la cantidad total si se aplica este cambio
                const cantidadTotal = cantidadEnOtrasFilas + updatedItem.quantity
                
                // Validar que la cantidad total no exceda el stock disponible
                if (cantidadTotal > stockDisponible) {
                  
                  setStockErrorMessage(
                    `Error: No hay stock suficiente para "${product.nombre || product.name}". ` +
                    `Stock disponible: ${stockDisponible} unidades. ` +
                    (cantidadEnOtrasFilas > 0 
                      ? `Ya hay ${cantidadEnOtrasFilas} unidades en otras filas. ` 
                      : '') +
                    `Cantidad máxima permitida en esta fila: ${cantidadDisponibleEnFila} unidades.`
                  )
                  setShowStockErrorToast(true)
                  setTimeout(() => setShowStockErrorToast(false), 7000)
                  
                  // Limitar la cantidad al máximo disponible solo cuando se cambia la cantidad manualmente
                  if (field === 'quantity') {
                    updatedItem.quantity = cantidadDisponibleEnFila > 0 ? cantidadDisponibleEnFila : 0
                  }
                  // Si se está seleccionando el producto y ya no hay stock disponible, mantener cantidad en 0
                  else if (field === 'productId' && cantidadDisponibleEnFila === 0) {
                    updatedItem.quantity = 0
                  }
                } else if (updatedItem.quantity > stockDisponible && cantidadEnOtrasFilas === 0) {
                  // Si no hay otras filas pero la cantidad excede el stock
                  setStockWarningMessage(
                    `Advertencia: La cantidad vendida de "${product.nombre || product.name}" es mayor a la disponible en el inventario. Cantidad actual: ${stockDisponible}`
                  )
                  setShowStockWarningToast(true)
                  setTimeout(() => setShowStockWarningToast(false), 5000)
                }
              }
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
          
          // Recalcular totales si se actualizan campos numéricos O si se selecciona un producto
          if (['price', 'discount', 'taxRate', 'quantity', 'productId'].includes(field)) {
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
    const salesperson = salespersons.find(s => s.id === data.salespersonId)
    
    if (!warehouse || !salesperson) {
      toast({
        title: "Error",
        description: "Por favor selecciona una bodega y un vendedor válidos.",
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

    // Validar que todos los items tengan datos válidos y stock suficiente
    // Primero, agrupar items por producto para validar stock total
    const itemsPorProducto = new Map<string, number>()
    validItems.forEach(item => {
      if (item.productId && item.productId.trim() !== "") {
        const cantidadActual = itemsPorProducto.get(item.productId) || 0
        itemsPorProducto.set(item.productId, cantidadActual + (item.quantity || 0))
      }
    })
    
    // Validar stock para cada producto considerando todas las filas
    itemsPorProducto.forEach((cantidadTotal, productId) => {
      const product = products.find((p: any) => p.id === productId) as any
      if (product) {
        const stockDisponible = getStockDisponible(productId)
        if (cantidadTotal > stockDisponible) {
          const errorMsg = `No hay stock suficiente para "${product.nombre || product.name}". ` +
            `Stock disponible: ${stockDisponible} unidades. ` +
            `Cantidad solicitada en todas las filas: ${cantidadTotal} unidades. ` +
            `Por favor, reduce la cantidad en alguna fila.`
          setStockErrorMessage(errorMsg)
          setShowStockErrorToast(true)
          setTimeout(() => setShowStockErrorToast(false), 7000)
          throw new Error(errorMsg)
        }
      }
    })
    
    let stockError: Error | null = null
    const items: CreateFacturaVentaItemDto[] = validItems.map(item => {
      // Validar que el productoId sea un GUID válido
      if (!item.productId || item.productId.trim() === "") {
        throw new Error("Todos los items deben tener un producto seleccionado")
      }
      
      const cantidad = Number(item.quantity)
      const precioUnitario = Number(item.price)
      
      // Validar que cantidad y precioUnitario sean números válidos y positivos
      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error("La cantidad debe ser mayor a 0")
      }
      if (isNaN(precioUnitario) || precioUnitario < 0) {
        throw new Error("El precio unitario debe ser mayor o igual a 0")
      }
      
      // La validación de stock ya se hizo arriba agrupando todos los items
      // Aquí solo validamos que cada item individual tenga un producto válido
      
      return {
        productoId: item.productId.trim(),
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        descuento: Number(item.discountAmount) || 0,
        impuesto: Number(item.taxAmount) || 0,
      }
    })

    // Crear el DTO para el backend
    // Formatear la fecha correctamente: parsear directamente desde el string YYYY-MM-DD
    // para evitar problemas de zona horaria que cambien el día
    // El formato de data.date es YYYY-MM-DD (del input type="date")
    const [year, month, day] = data.date.split('-').map(Number)
    // Crear fecha UTC directamente con los valores del string, sin pasar por hora local
    const fechaUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    const fechaISO = fechaUTC.toISOString() // Formato: YYYY-MM-DDTHH:mm:ss.sssZ

    const facturaData: CreateFacturaVentaDto = {
      bodegaId: data.warehouseId,
      vendedorId: data.salespersonId,
      fecha: fechaISO,
      formaPago: data.paymentType === "cash" ? "Contado" : "Credito",
      plazoPago: data.paymentType === "credit" && data.paymentTerm ? Number(data.paymentTerm) : null,
      medioPago: data.paymentMethod as "Efectivo" | "Tarjeta" | "Transferencia" | "Cheque",
      observaciones: data.observations || null,
      items,
    }

    try {
      await createFacturaMutation.mutateAsync(facturaData)
      router.push("/invoices/sales?created=true")
    } catch (error: any) {
      // Manejar diferentes tipos de errores
      let errorMessage = error?.message || error?.toString() || ""
      const errorStatus = error?.status || error?.statusCode || error?.response?.status
      
      // Si es un error 500, puede ser un error de stock u otro error del servidor
      if (errorStatus === 500 || error?.response?.status === 500) {
        // Intentar extraer un mensaje más descriptivo
        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error?.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (!errorMessage || errorMessage === "[object Object]") {
          errorMessage = "Error interno del servidor. Por favor, verifica que no haya stock insuficiente o contacta al administrador."
        }
        
        // Verificar si el error está relacionado con stock
        const lowerMsg = errorMessage.toLowerCase()
        if (
          lowerMsg.includes("stock") || 
          lowerMsg.includes("cantidad") || 
          lowerMsg.includes("disponible") ||
          lowerMsg.includes("insuficiente") ||
          lowerMsg.includes("no hay suficiente")
        ) {
          setStockErrorMessage(
            `Error de stock: ${errorMessage}. Por favor, verifica las cantidades en todas las filas de la factura.`
          )
          setShowStockErrorToast(true)
          setTimeout(() => setShowStockErrorToast(false), 7000)
        } else {
          // Error 500 genérico
          toast({
            title: "Error del servidor",
            description: errorMessage || "Ocurrió un error al crear la factura. Por favor, intenta nuevamente.",
            variant: "destructive",
          })
        }
      } else if (errorMessage.includes("No hay stock suficiente") || errorMessage.includes("stock suficiente")) {
        // Error de stock con mensaje claro
        setStockErrorMessage(
          `Error de stock: ${errorMessage}. Por favor, verifica las cantidades en todas las filas de la factura.`
        )
        setShowStockErrorToast(true)
        setTimeout(() => setShowStockErrorToast(false), 7000)
      } else {
        // Otros errores (ya se manejan en los hooks, pero mostramos un mensaje aquí también)
        toast({
          title: "Error al crear factura",
          description: errorMessage || "Ocurrió un error al crear la factura. Por favor, intenta nuevamente.",
          variant: "destructive",
        })
      }
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
  const closeNewSalespersonModal = () => {
    setShowNewSalesperson(false)
    setNewSalesperson({ name: "", identification: "", observation: "", email: "" })
    setHasInvalidIdentificationError(false)
  }

  const closeEditSalespersonModal = () => {
    setShowEditSalesperson(false)
    setEditingSalesperson(null)
    setHasInvalidIdentificationError(false)
  }

  const closeDeleteSalespersonModal = () => {
    setShowDeleteSalesperson(false)
    setDeletingSalesperson(null)
  }

  // Manejar tecla Escape para cerrar modales
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNewSalesperson) {
          closeNewSalespersonModal()
        } else if (showEditSalesperson) {
          closeEditSalespersonModal()
        } else if (showDeleteSalesperson) {
          closeDeleteSalespersonModal()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showNewSalesperson, showEditSalesperson, showDeleteSalesperson])

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <Receipt className="mr-3 h-8 w-8 text-camouflage-green-700" />
              Nueva Factura de Venta
            </h1>
            <p className="mt-1 text-camouflage-green-600">Crea una nueva factura de venta.</p>
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
              disabled={isSubmitting || createFacturaMutation.isPending || isLoadingWarehouses || isLoadingSalespersons || isLoadingProducts || isLoadingBodegaProductos}
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

              {/* Vendedor */}
              <div className="space-y-2">
                <Label htmlFor="salesperson" className="text-camouflage-green-700">
                  Vendedor *
                </Label>
                <div className="flex items-center gap-2">
                  <Select value={formData.salespersonId} onValueChange={(value) => {
                    if (value === "new-salesperson") {
                      setShowNewSalesperson(true)
                    } else {
                      handleInputChange("salespersonId", value)
                    }
                  }}>
                      <SelectTrigger className={`border-camouflage-green-300 bg-white flex-1 ${
                        errors?.salespersonId ? "border-red-500 focus:border-red-500" : "focus:border-camouflage-green-500"
                      }`}>
                        <SelectValue placeholder="Seleccionar vendedor" />
                      </SelectTrigger>
                    <SelectContent className="rounded-3xl">
                      {isLoadingSalespersons ? (
                        <SelectItem value="loading" disabled>
                          Cargando vendedores...
                        </SelectItem>
                      ) : salespersons.length === 0 ? (
                        <SelectItem value="no-salespersons" disabled>
                          No hay vendedores disponibles
                        </SelectItem>
                      ) : (
                        salespersons.map((salesperson) => (
                          <SelectItem key={salesperson.id} value={salesperson.id}>
                            {salesperson.nombre} - {salesperson.identificacion || 'Sin identificación'}
                          </SelectItem>
                        ))
                      )}
                      <SelectItem value="new-salesperson" className="text-camouflage-green-600 font-medium">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          Nuevo Vendedor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Botones de gestión de vendedores */}
                  {formData.salespersonId && formData.salespersonId !== "" && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSalesperson(formData.salespersonId)}
                        className="h-10 w-10 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100"
                        title="Editar vendedor"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSalesperson(formData.salespersonId)}
                        className="h-10 w-10 p-0 text-camouflage-green-600 hover:text-camouflage-green-800 hover:bg-camouflage-green-100"
                        title="Eliminar vendedor"
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

              {/* Forma de Pago, Plazo (si crédito) y Medio de Pago */}
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  {/* Forma de Pago */}
                  <div className="space-y-2">
                    <Label htmlFor="paymentType" className="text-camouflage-green-700">
                      Forma de Pago *
                    </Label>
                    <Select value={formData.paymentType} onValueChange={(value: "cash" | "credit") => handleInputChange("paymentType", value)}>
                        <SelectTrigger className={`border-camouflage-green-300 bg-white ${
                          errors?.paymentType ? "border-red-500 focus:border-red-500" : "focus:border-camouflage-green-500"
                        }`}>
                          <SelectValue placeholder="Seleccionar forma de pago" />
                        </SelectTrigger>
                      <SelectContent className="rounded-3xl">
                        <SelectItem value="cash">Contado</SelectItem>
                        <SelectItem value="credit">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Plazo de Pago (solo si Crédito) */}
                  {formData.paymentType === "credit" && (
                    <div className="space-y-2">
                      <Label htmlFor="paymentTerm" className="text-camouflage-green-700">
                        Plazo de Pago *
                      </Label>
                      <Select value={formData.paymentTerm} onValueChange={(value) => handleInputChange("paymentTerm", value)}>
                        <SelectTrigger className={`border-camouflage-green-300 bg-white ${
                          errors?.paymentTerm ? "border-red-500 focus:border-red-500" : "focus:border-camouflage-green-500"
                        }`}>
                          <SelectValue placeholder="Seleccionar plazo de pago" />
                        </SelectTrigger>
                        <SelectContent className="rounded-3xl">
                          <SelectItem value="8">8 días</SelectItem>
                          <SelectItem value="15">15 días</SelectItem>
                          <SelectItem value="30">30 días</SelectItem>
                          <SelectItem value="60">60 días</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Medio de Pago */}
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod" className="text-camouflage-green-700">
                      Medio de Pago *
                    </Label>
                    <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange("paymentMethod", value)}>
                        <SelectTrigger className={`border-camouflage-green-300 bg-white ${
                          errors?.paymentMethod ? "border-red-500 focus:border-red-500" : "focus:border-camouflage-green-500"
                        }`}>
                          <SelectValue placeholder="Seleccionar medio de pago" />
                        </SelectTrigger>
                      <SelectContent className="rounded-3xl">
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                        <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="Transferencia">Transferencia</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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

        {/* Modal para nuevo vendedor */}
        <Modal
          isOpen={showNewSalesperson}
          onClose={closeNewSalespersonModal}
          title="Nuevo Vendedor"
          size="lg"
        >
          <div className="space-y-4">
            <div className="space-y-1 pt-2.5">
              <Label htmlFor="salespersonName" className="font-medium text-camouflage-green-700">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="salespersonName"
                value={newSalesperson.name}
                onChange={(e) => setNewSalesperson(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del vendedor"
                className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salespersonId" className="font-medium text-camouflage-green-700">
                Identificación <span className="text-red-500">*</span>
              </Label>
              <Input
                id="salespersonId"
                value={newSalesperson.identification}
                onChange={(e) => {
                  setNewSalesperson(prev => ({ ...prev, identification: e.target.value }))
                  // Limpiar el error cuando el usuario empiece a escribir
                  if (hasInvalidIdentificationError) {
                    setHasInvalidIdentificationError(false)
                  }
                }}
                placeholder="Cédula, DNI, etc."
                className={`bg-white placeholder:text-gray-400 ${
                  hasInvalidIdentificationError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-camouflage-green-300 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                }`}
                disabled={createVendedorMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salespersonEmail" className="font-medium text-camouflage-green-700">
                Correo
              </Label>
              <Input
                id="salespersonEmail"
                type="email"
                value={newSalesperson.email}
                onChange={(e) => setNewSalesperson(prev => ({ ...prev, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
                className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salespersonObservation" className="font-medium text-camouflage-green-700">
                Observaciones
              </Label>
              <Textarea
                id="salespersonObservation"
                value={newSalesperson.observation}
                onChange={(e) => setNewSalesperson(prev => ({ ...prev, observation: e.target.value }))}
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
                onClick={closeNewSalespersonModal}
                className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleNewSalespersonSubmit}
                className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
                disabled={!newSalesperson.name.trim() || !newSalesperson.identification.trim() || createVendedorMutation.isPending}
              >
                {createVendedorMutation.isPending ? "Creando..." : "Crear Vendedor"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal para editar vendedor */}
        {editingSalesperson && (
          <Modal
            isOpen={showEditSalesperson}
            onClose={closeEditSalespersonModal}
            title="Editar Vendedor"
            size="lg"
          >
            <div className="space-y-4">
              <div className="space-y-1 pt-2.5">
                <Label htmlFor="editSalespersonName" className="font-medium text-camouflage-green-700">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editSalespersonName"
                  value={editingSalesperson.data.name}
                  onChange={(e) => setEditingSalesperson(prev => prev ? {
                    ...prev,
                    data: { ...prev.data, name: e.target.value }
                  } : null)}
                  placeholder="Nombre del vendedor"
                  className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSalespersonId" className="font-medium text-camouflage-green-700">
                  Identificación <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editSalespersonId"
                  value={editingSalesperson.data.identification}
                  onChange={(e) => {
                    setEditingSalesperson(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, identification: e.target.value }
                    } : null)
                    // Limpiar el error cuando el usuario empiece a escribir
                    if (hasInvalidIdentificationError) {
                      setHasInvalidIdentificationError(false)
                    }
                  }}
                  placeholder="Cédula, DNI, etc."
                  className={`bg-white placeholder:text-gray-400 ${
                    hasInvalidIdentificationError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-camouflage-green-300 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                  }`}
                  disabled={updateVendedorMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSalespersonEmail" className="font-medium text-camouflage-green-700">
                  Correo
                </Label>
                <Input
                  id="editSalespersonEmail"
                  type="email"
                  value={editingSalesperson.data.email}
                  onChange={(e) => setEditingSalesperson(prev => prev ? {
                    ...prev,
                    data: { ...prev.data, email: e.target.value }
                  } : null)}
                  placeholder="correo@ejemplo.com"
                  className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSalespersonObservation" className="font-medium text-camouflage-green-700">
                  Observaciones
                </Label>
                <Textarea
                  id="editSalespersonObservation"
                  value={editingSalesperson.data.observation}
                  onChange={(e) => setEditingSalesperson(prev => prev ? {
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
                  onClick={closeEditSalespersonModal}
                  className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEditSalespersonSubmit}
                  className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
                  disabled={
                    (editingSalesperson?.data?.name?.trim() || "").length === 0 || 
                    (editingSalesperson?.data?.identification?.trim() || "").length === 0 || 
                    updateVendedorMutation.isPending
                  }
                >
                  {updateVendedorMutation.isPending ? "Actualizando..." : "Actualizar Vendedor"}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal de confirmación para eliminar vendedor */}
        {showDeleteSalesperson && deletingSalesperson && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={closeDeleteSalespersonModal}
          >
            <Card className="w-full max-w-md border-camouflage-green-200 shadow-xl">
              <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <CardHeader>
                  <CardTitle className="text-camouflage-green-900">Confirmar Desactivación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-camouflage-green-700">
                    ¿Estás seguro de que quieres desactivar al vendedor <strong>{deletingSalesperson.name}</strong>?
                  </p>
                  <p className="text-sm text-camouflage-green-600">
                    El vendedor será desactivado y no podrá ser usado en nuevas facturas.
                  </p>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleDeleteSalespersonConfirm}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                      disabled={deactivateVendedorMutation.isPending}
                    >
                      {deactivateVendedorMutation.isPending ? "Desactivando..." : "Desactivar"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={closeDeleteSalespersonModal}
                      className="flex-1 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                      disabled={deactivateVendedorMutation.isPending}
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

        {/* Toast específico para identificación duplicada de vendedor */}
        {showDuplicateSalespersonToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">
                {duplicateSalespersonMessage}
              </p>
            </div>
          </div>
        )}

        {/* Toast específico para identificación inválida (solo números y guiones) */}
        {showInvalidIdentificationToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">
                La identificación solo puede contener números y guiones.
              </p>
            </div>
          </div>
        )}

        {/* Toast específico para nombre requerido */}
        {showNameRequiredToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">
                El nombre tiene que estar presente.
              </p>
            </div>
          </div>
        )}

        {/* Toast de éxito para vendedores */}
        {showSalespersonSuccessToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                {salespersonSuccessMessage}
              </p>
            </div>
          </div>
        )}

        {/* Toast de advertencia de stock */}
        {showStockWarningToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <p className="text-sm font-medium text-orange-800">
                {stockWarningMessage}
              </p>
            </div>
          </div>
        )}

        {/* Toast de error de stock insuficiente al guardar */}
        {showStockErrorToast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">
                {stockErrorMessage}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStockErrorToast(false)}
                className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </Button>
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
