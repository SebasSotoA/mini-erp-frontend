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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useInventory } from "@/contexts/inventory-context"
import { useToast } from "@/hooks/use-toast"
import { SalesInvoiceItem } from "@/lib/types/invoices"

// Esquema de validación con Zod
const invoiceSchema = z
  .object({
    warehouseId: z.string().min(1, "La bodega es requerida"),
    salespersonId: z.string().min(1, "El vendedor es requerido"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
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
    path: ["paymentTerm"], // Esto hace que el error aparezca en el campo paymentTerm
  })

type InvoiceFormSchema = z.infer<typeof invoiceSchema>

// Esquema para vendedores
const salespersonSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  identification: z.string().min(1, "La identificación es requerida"),
  observation: z.string().optional(),
})

type SalespersonFormSchema = z.infer<typeof salespersonSchema>

interface InvoiceFormData {
  warehouseId: string
  salespersonId: string
  email: string
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
}

export default function NewSalesInvoice() {
  const { warehouses, salespersons, paymentMethods, products, salesInvoices, purchaseInvoices, addSalesInvoice, addSalesperson, updateSalesperson, deleteSalesperson } = useInventory()
  const router = useRouter()
  const { toast } = useToast()

  // Estado del formulario principal
  const [formData, setFormData] = useState<InvoiceFormData>({
    warehouseId: "",
    salespersonId: "",
    email: "",
    date: new Date().toISOString().split('T')[0],
    paymentType: "cash",
    paymentMethod: "",
    paymentTerm: "",
    observations: "",
    items: [],
  })

  // Estado para nuevo vendedor
  const [showNewSalesperson, setShowNewSalesperson] = useState(false)
  const [newSalesperson, setNewSalesperson] = useState<NewSalespersonForm>({
    name: "",
    identification: "",
    observation: "",
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
      email: formData.email,
      date: formData.date,
      paymentType: formData.paymentType,
      paymentMethod: formData.paymentMethod,
      paymentTerm: formData.paymentTerm,
      observations: formData.observations,
      items: formData.items,
    },
  })

  // Estado para nuevo item (solo para agregar filas)
  const [newItem, setNewItem] = useState({
    productId: "",
    quantity: 1,
    price: 0,
    discount: 0,
    taxRate: 19,
  })

  const handleInputChange = (field: keyof InvoiceFormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Si se cambia el tipo de pago a "cash", limpiar el plazo de pago
      if (field === "paymentType" && value === "cash") {
        newData.paymentTerm = ""
        setValue("paymentTerm", "", { shouldValidate: true })
      }
      
      return newData
    })
    setValue(field as any, value, { shouldValidate: true })
  }

  const handleNewSalespersonSubmit = () => {
    const result = salespersonSchema.safeParse(newSalesperson)
    
    if (!result.success) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      })
      return
    }

    // Crear el vendedor
    addSalesperson({
      name: newSalesperson.name,
      identification: newSalesperson.identification,
      observation: newSalesperson.observation,
      isActive: true,
    })

    toast({
      title: "Vendedor creado",
      description: "El vendedor se ha creado correctamente.",
    })

    // Limpiar el formulario y cerrar modal
    setNewSalesperson({ name: "", identification: "", observation: "" })
    setShowNewSalesperson(false)
    
    // Resetear el Select para que no quede en "new-salesperson"
    handleInputChange("salespersonId", "")
  }

  const handleEditSalesperson = (salespersonId: string) => {
    const salesperson = salespersons.find(s => s.id === salespersonId)
    if (salesperson) {
      setEditingSalesperson({
        id: salespersonId,
        data: {
          name: salesperson.name,
          identification: salesperson.identification,
          observation: salesperson.observation || "",
        }
      })
      setShowEditSalesperson(true)
    }
  }

  const handleEditSalespersonSubmit = () => {
    if (!editingSalesperson) return
    
    const result = salespersonSchema.safeParse(editingSalesperson.data)
    
    if (!result.success) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      })
      return
    }

    updateSalesperson(editingSalesperson.id, {
      name: editingSalesperson.data.name,
      identification: editingSalesperson.data.identification,
      observation: editingSalesperson.data.observation,
      isActive: true,
    })

    toast({
      title: "Vendedor actualizado",
      description: "El vendedor se ha actualizado correctamente.",
    })

    setEditingSalesperson(null)
    setShowEditSalesperson(false)
  }

  const handleDeleteSalesperson = (salespersonId: string) => {
    const salesperson = salespersons.find(s => s.id === salespersonId)
    if (salesperson) {
      setDeletingSalesperson({
        id: salespersonId,
        name: salesperson.name
      })
      setShowDeleteSalesperson(true)
    }
  }

  const handleDeleteSalespersonConfirm = () => {
    if (deletingSalesperson) {
      deleteSalesperson(deletingSalesperson.id)
      
      // Limpiar el vendedor seleccionado si es el que se está eliminando
      if (formData.salespersonId === deletingSalesperson.id) {
        handleInputChange("salespersonId", "")
      }
      
      toast({
        title: "Vendedor eliminado",
        description: `El vendedor ${deletingSalesperson.name} ha sido eliminado.`,
      })
      
      setDeletingSalesperson(null)
      setShowDeleteSalesperson(false)
    }
  }

  const calculateItemTotal = (item: typeof newItem) => {
    const subtotal = item.price * item.quantity
    const discountAmount = (subtotal * item.discount) / 100
    const taxAmount = ((subtotal - discountAmount) * item.taxRate) / 100
    return subtotal - discountAmount + taxAmount
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

  const updateItem = (itemId: string, field: keyof SalesInvoiceItem, value: any) => {
    setFormData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          let updatedItem = { ...item, [field]: value }
          
          // Si se actualiza el producto, también actualizar el nombre
          if (field === 'productId') {
            const product = products.find(p => p.id === value)
            updatedItem.productName = product ? product.name : ""
          }
          
          // Recalcular totales si se actualizan campos numéricos
          if (['price', 'discount', 'taxRate', 'quantity'].includes(field)) {
            const subtotal = updatedItem.price * updatedItem.quantity
            const discountAmount = (subtotal * updatedItem.discount) / 100
            const taxAmount = ((subtotal - discountAmount) * updatedItem.taxRate) / 100
            const total = subtotal - discountAmount + taxAmount
            
            updatedItem = {
              ...updatedItem,
              subtotal,
              discountAmount,
              taxAmount,
              total
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
    const totalDiscount = formData.items.reduce((sum, item) => sum + item.discountAmount, 0)
    const totalTax = formData.items.reduce((sum, item) => sum + item.taxAmount, 0)
    const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0)

    return { subtotal, totalDiscount, totalTax, totalAmount }
  }, [formData.items])

  const handleFormSubmit = async (data: InvoiceFormSchema) => {
    // Aquí se ejecuta cuando la validación es exitosa
    const warehouse = warehouses.find(w => w.id === data.warehouseId)
    const salesperson = salespersons.find(s => s.id === data.salespersonId)
    
    if (!warehouse || !salesperson) return

    const { subtotal, totalDiscount, totalTax, totalAmount } = totals

    const invoiceNumber = `SV-${new Date().getFullYear()}-${String(salesInvoices.length + purchaseInvoices.length + 1).padStart(3, '0')}`

    addSalesInvoice({
      invoiceNumber,
      warehouseId: data.warehouseId,
      warehouseName: warehouse.name,
      salespersonId: data.salespersonId,
      salespersonName: salesperson.name,
      email: data.email,
      date: data.date,
      paymentType: data.paymentType,
      paymentMethod: data.paymentMethod,
      observations: data.observations,
      items: formData.items, // Usar formData.items que tiene productName
      subtotal,
      totalDiscount,
      totalTax,
      totalAmount,
      status: "completed",
    })

    toast({
      title: "Factura creada",
      description: "La factura se ha creado correctamente.",
    })

    router.push("/invoices/sales")
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
    setNewSalesperson({ name: "", identification: "", observation: "" })
  }

  const closeEditSalespersonModal = () => {
    setShowEditSalesperson(false)
    setEditingSalesperson(null)
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
              disabled={isSubmitting}
              onClick={handleSubmit(handleFormSubmit, handleFormError)}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Guardando..." : "Guardar Factura"}
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
                        {warehouse.name}
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
                      {salespersons.map((salesperson) => (
                        <SelectItem key={salesperson.id} value={salesperson.id}>
                          {salesperson.name} - {salesperson.identification}
                        </SelectItem>
                      ))}
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

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-camouflage-green-700">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="cliente@email.com"
                  className={`border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500 ${
                    errors?.email ? "border-red-500 focus:border-red-500" : "focus:border-camouflage-green-500"
                  }`}
                />
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-camouflage-green-700">
                  Fecha *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={`border-camouflage-green-300 bg-white ${
                    errors?.date ? "border-red-500 focus:border-red-500" : "focus:border-camouflage-green-500"
                  }`}
                />
              </div>

              {/* Forma de Pago y Medio de Pago */}
              <div className="space-y-2 md:col-span-2">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.name}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Plazo de Pago y Observaciones - Solo visible cuando se selecciona Crédito */}
              {formData.paymentType === "credit" && (
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {/* Plazo de Pago - Ocupa 1 columna (alineado con Fecha) */}
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

                    {/* Observaciones - Ocupa 2 columnas (alineado con Forma de Pago + Medio de Pago) */}
                    <div className="space-y-2 md:col-span-1 lg:col-span-2">
                      <Label htmlFor="observations" className="text-camouflage-green-700">
                        Observaciones
                      </Label>
                      <Textarea
                        id="observations"
                        value={formData.observations}
                        onChange={(e) => handleInputChange("observations", e.target.value)}
                        placeholder="Observaciones adicionales sobre la factura..."
                        className={`border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 ${
                          errors?.observations ? "border-red-500 focus:border-red-500" : "focus:border-camouflage-green-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Observaciones - Solo visible cuando NO es crédito */}
              {formData.paymentType !== "credit" && (
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="observations" className="text-camouflage-green-700">
                    Observaciones
                  </Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => handleInputChange("observations", e.target.value)}
                    placeholder="Observaciones adicionales sobre la factura..."
                    className={`border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 ${
                      errors?.observations ? "border-red-500 focus:border-red-500" : "focus:border-camouflage-green-500"
                    }`}
                  />
                </div>
              )}
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
                          >
                            <SelectTrigger className="border-camouflage-green-300 h-8 rounded-lg bg-white text-left w-full">
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl">
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
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
        {showNewSalesperson && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeNewSalespersonModal}
          >
            <Card className="w-full max-w-md border-camouflage-green-200">
              <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Nuevo Vendedor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salespersonName" className="text-camouflage-green-700">
                    Nombre *
                  </Label>
                  <Input
                    id="salespersonName"
                    value={newSalesperson.name}
                    onChange={(e) => setNewSalesperson(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre del vendedor"
                    className="border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salespersonId" className="text-camouflage-green-700">
                    Identificación *
                  </Label>
                  <Input
                    id="salespersonId"
                    value={newSalesperson.identification}
                    onChange={(e) => setNewSalesperson(prev => ({ ...prev, identification: e.target.value }))}
                    placeholder="Cédula, DNI, etc."
                    className="border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salespersonObservation" className="text-camouflage-green-700">
                    Observación
                  </Label>
                  <Textarea
                    id="salespersonObservation"
                    value={newSalesperson.observation}
                    onChange={(e) => setNewSalesperson(prev => ({ ...prev, observation: e.target.value }))}
                    placeholder="Observaciones adicionales"
                    className="border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleNewSalespersonSubmit}
                    variant="primary"
                    className="flex-1"
                  >
                    Crear Vendedor
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closeNewSalespersonModal}
                    className="flex-1 border-camouflage-green-300"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
              </div>
            </Card>
          </div>
        )}

        {/* Modal para editar vendedor */}
        {showEditSalesperson && editingSalesperson && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeEditSalespersonModal}
          >
            <Card className="w-full max-w-md border-camouflage-green-200">
              <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Editar Vendedor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editSalespersonName" className="text-camouflage-green-700">
                    Nombre *
                  </Label>
                  <Input
                    id="editSalespersonName"
                    value={editingSalesperson.data.name}
                    onChange={(e) => setEditingSalesperson(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, name: e.target.value }
                    } : null)}
                    placeholder="Nombre del vendedor"
                    className="border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSalespersonId" className="text-camouflage-green-700">
                    Identificación *
                  </Label>
                  <Input
                    id="editSalespersonId"
                    value={editingSalesperson.data.identification}
                    onChange={(e) => setEditingSalesperson(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, identification: e.target.value }
                    } : null)}
                    placeholder="Cédula, DNI, etc."
                    className="border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSalespersonObservation" className="text-camouflage-green-700">
                    Observación
                  </Label>
                  <Textarea
                    id="editSalespersonObservation"
                    value={editingSalesperson.data.observation}
                    onChange={(e) => setEditingSalesperson(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, observation: e.target.value }
                    } : null)}
                    placeholder="Observaciones adicionales"
                    className="border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleEditSalespersonSubmit}
                    variant="primary"
                    className="flex-1"
                  >
                    Actualizar Vendedor
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closeEditSalespersonModal}
                    className="flex-1 border-camouflage-green-300"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
              </div>
            </Card>
          </div>
        )}

        {/* Modal de confirmación para eliminar vendedor */}
        {showDeleteSalesperson && deletingSalesperson && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeDeleteSalespersonModal}
          >
            <Card className="w-full max-w-md border-camouflage-green-200">
              <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Confirmar Eliminación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-camouflage-green-700">
                  ¿Estás seguro de que quieres eliminar al vendedor <strong>{deletingSalesperson.name}</strong>?
                </p>
                <p className="text-sm text-red-600">
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleDeleteSalespersonConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Eliminar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closeDeleteSalespersonModal}
                    className="flex-1 border-camouflage-green-300"
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
      </div>
    </MainLayout>
  )
}
