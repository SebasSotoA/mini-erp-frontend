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
import { PurchaseInvoiceItem } from "@/lib/types/invoices"

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
        concept: z.string().min(1, "El concepto es requerido"),
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
  identification: z.string().min(1, "La identificación es requerida"),
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
  identification: string
  observation: string
}

export default function NewPurchaseInvoice() {
  const { warehouses, suppliers, purchaseInvoices, addPurchaseInvoice, addSupplier, updateSupplier, deleteSupplier } = useInventory()
  const router = useRouter()
  const { toast } = useToast()

  // Estado del formulario principal
  const [formData, setFormData] = useState<InvoiceFormData>({
    warehouseId: "",
    supplierId: "",
    date: new Date().toISOString().split('T')[0],
    observations: "",
    items: [],
  })

  // Estado para nuevo proveedor
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newSupplier, setNewSupplier] = useState<NewSupplierForm>({
    name: "",
    identification: "",
    observation: "",
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

  const handleInputChange = (field: keyof InvoiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValue(field as any, value, { shouldValidate: true })
  }

  const handleNewSupplierSubmit = () => {
    const result = supplierSchema.safeParse(newSupplier)
    
    if (!result.success) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      })
      return
    }

    // Crear el proveedor
    addSupplier({
      name: newSupplier.name,
      identification: newSupplier.identification,
      observation: newSupplier.observation,
      isActive: true,
    })

    toast({
      title: "Proveedor creado",
      description: "El proveedor se ha creado correctamente.",
    })

    // Limpiar el formulario y cerrar modal
    setNewSupplier({ name: "", identification: "", observation: "" })
    setShowNewSupplier(false)
    
    // Resetear el Select para que no quede en "new-supplier"
    handleInputChange("supplierId", "")
  }

  const handleEditSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (supplier) {
      setEditingSupplier({
        id: supplierId,
        data: {
          name: supplier.name,
          identification: supplier.identification,
          observation: supplier.observation || "",
        }
      })
      setShowEditSupplier(true)
    }
  }

  const handleEditSupplierSubmit = () => {
    if (!editingSupplier) return
    
    const result = supplierSchema.safeParse(editingSupplier.data)
    
    if (!result.success) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      })
      return
    }

    updateSupplier(editingSupplier.id, {
      name: editingSupplier.data.name,
      identification: editingSupplier.data.identification,
      observation: editingSupplier.data.observation,
      isActive: true,
    })

    toast({
      title: "Proveedor actualizado",
      description: "El proveedor se ha actualizado correctamente.",
    })

    setEditingSupplier(null)
    setShowEditSupplier(false)
  }

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (supplier) {
      setDeletingSupplier({
        id: supplierId,
        name: supplier.name
      })
      setShowDeleteSupplier(true)
    }
  }

  const handleDeleteSupplierConfirm = () => {
    if (deletingSupplier) {
      deleteSupplier(deletingSupplier.id)
      
      // Limpiar el proveedor seleccionado si es el que se está eliminando
      if (formData.supplierId === deletingSupplier.id) {
        handleInputChange("supplierId", "")
      }
      
      toast({
        title: "Proveedor eliminado",
        description: `El proveedor ${deletingSupplier.name} ha sido eliminado.`,
      })
      
      setDeletingSupplier(null)
      setShowDeleteSupplier(false)
    }
  }

  const addItem = () => {
    const item: PurchaseInvoiceItem = {
      id: `item-${Date.now()}`,
      concept: "",
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
    const supplier = suppliers.find(s => s.id === data.supplierId)
    
    if (!warehouse || !supplier) return

    const { subtotal, totalDiscount, totalTax, totalAmount } = totals

    const invoiceNumber = `PC-${new Date().getFullYear()}-${String(purchaseInvoices.length + 1).padStart(3, '0')}`

    addPurchaseInvoice({
      invoiceNumber,
      warehouseId: data.warehouseId,
      warehouseName: warehouse.name,
      supplierId: data.supplierId,
      supplierName: supplier.name,
      date: data.date,
      observations: data.observations,
      items: formData.items,
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

    router.push("/invoices/purchase")
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
    setNewSupplier({ name: "", identification: "", observation: "" })
  }

  const closeEditSupplierModal = () => {
    setShowEditSupplier(false)
    setEditingSupplier(null)
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
              className="bg-camouflage-green-700 pl-4 pr-4 text-white hover:bg-camouflage-green-800 disabled:opacity-50"
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
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name} - {supplier.identification}
                        </SelectItem>
                      ))}
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
                  className={`border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 ${
                    errors?.observations ? "border-red-500 focus:border-red-500" : "focus:border-camouflage-green-500"
                  }`}
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
                className="bg-camouflage-green-700 hover:bg-camouflage-green-800"
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
                      <TableHead className="font-semibold text-camouflage-green-700 w-[300px]">Concepto</TableHead>
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
                          <Input
                            value={item.concept}
                            onChange={(e) => updateItem(item.id, 'concept', e.target.value)}
                            placeholder="Concepto del item"
                            className="border-camouflage-green-300 h-8 rounded-lg bg-white placeholder:text-camouflage-green-500 text-left w-full"
                          />
                        </TableCell>
                        <TableCell className="w-[120px]">
                          <Input
                            type="number"
                            value={item.price || ""}
                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="border-camouflage-green-300 h-8 rounded-lg bg-white placeholder:text-camouflage-green-500 text-left w-full"
                          />
                        </TableCell>
                        <TableCell className="w-[120px]">
                          <Input
                            type="number"
                            value={item.discount || ""}
                            onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="border-camouflage-green-300 h-8 rounded-lg bg-white placeholder:text-camouflage-green-500 text-left w-full"
                          />
                        </TableCell>
                        <TableCell className="w-[150px]">
                          <Select 
                            value={item.taxRate.toString()} 
                            onValueChange={(value) => updateItem(item.id, 'taxRate', parseFloat(value))}
                          >
                            <SelectTrigger className="border-camouflage-green-300 h-8 rounded-lg bg-white text-left w-full">
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
                            className="border-camouflage-green-300 h-8 rounded-lg bg-white placeholder:text-camouflage-green-500 text-left w-full"
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
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-sm text-red-600">Descuento</div>
                <div className="text-2xl font-bold text-red-900">-${totals.totalDiscount.toLocaleString()}</div>
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
        {showNewSupplier && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeNewSupplierModal}
          >
            <Card className="w-full max-w-md border-camouflage-green-200">
              <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Nuevo Proveedor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierName" className="text-camouflage-green-700">
                    Nombre *
                  </Label>
                  <Input
                    id="supplierName"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre del proveedor"
                    className="border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierId" className="text-camouflage-green-700">
                    Identificación *
                  </Label>
                  <Input
                    id="supplierId"
                    value={newSupplier.identification}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, identification: e.target.value }))}
                    placeholder="NIT, RUC, etc."
                    className="border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierObservation" className="text-camouflage-green-700">
                    Observación
                  </Label>
                  <Textarea
                    id="supplierObservation"
                    value={newSupplier.observation}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, observation: e.target.value }))}
                    placeholder="Observaciones adicionales"
                    className="border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleNewSupplierSubmit}
                    className="flex-1 bg-camouflage-green-700 hover:bg-camouflage-green-800"
                  >
                    Crear Proveedor
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closeNewSupplierModal}
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

        {/* Modal para editar proveedor */}
        {showEditSupplier && editingSupplier && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeEditSupplierModal}
          >
            <Card className="w-full max-w-md border-camouflage-green-200">
              <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Editar Proveedor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editSupplierName" className="text-camouflage-green-700">
                    Nombre *
                  </Label>
                  <Input
                    id="editSupplierName"
                    value={editingSupplier.data.name}
                    onChange={(e) => setEditingSupplier(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, name: e.target.value }
                    } : null)}
                    placeholder="Nombre del proveedor"
                    className="border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSupplierId" className="text-camouflage-green-700">
                    Identificación *
                  </Label>
                  <Input
                    id="editSupplierId"
                    value={editingSupplier.data.identification}
                    onChange={(e) => setEditingSupplier(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, identification: e.target.value }
                    } : null)}
                    placeholder="NIT, RUC, etc."
                    className="border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSupplierObservation" className="text-camouflage-green-700">
                    Observación
                  </Label>
                  <Textarea
                    id="editSupplierObservation"
                    value={editingSupplier.data.observation}
                    onChange={(e) => setEditingSupplier(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, observation: e.target.value }
                    } : null)}
                    placeholder="Observaciones adicionales"
                    className="border-camouflage-green-300 bg-white placeholder:text-camouflage-green-500"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleEditSupplierSubmit}
                    className="flex-1 bg-camouflage-green-700 hover:bg-camouflage-green-800"
                  >
                    Actualizar Proveedor
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closeEditSupplierModal}
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

        {/* Modal de confirmación para eliminar proveedor */}
        {showDeleteSupplier && deletingSupplier && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeDeleteSupplierModal}
          >
            <Card className="w-full max-w-md border-camouflage-green-200">
              <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Confirmar Eliminación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-camouflage-green-700">
                  ¿Estás seguro de que quieres eliminar al proveedor <strong>{deletingSupplier.name}</strong>?
                </p>
                <p className="text-sm text-red-600">
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleDeleteSupplierConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Eliminar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closeDeleteSupplierModal}
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
