"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Receipt,
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Calculator,
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
import { SalesInvoiceItem, PurchaseInvoiceItem } from "@/lib/types/invoices"

// Tipos genéricos para items
type InvoiceItem = SalesInvoiceItem | PurchaseInvoiceItem

// Esquema base de validación
const createInvoiceSchema = (itemSchema: z.ZodType<any>) =>
  z.object({
    warehouseId: z.string().min(1, "La bodega es requerida"),
    date: z.string().min(1, "La fecha es requerida"),
    observations: z.string().optional(),
    items: z.array(itemSchema).min(1, "Debe agregar al menos un item a la factura"),
  })

// Esquemas específicos
const salesInvoiceSchema = createInvoiceSchema(
  z.object({
    id: z.string(),
    productId: z.string().min(1, "El producto es requerido"),
    productName: z.string(),
    price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
    discount: z.number().min(0, "El descuento debe ser mayor o igual a 0"),
    taxRate: z.number().min(0, "El impuesto debe ser mayor o igual a 0"),
    quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
    subtotal: z.number(),
    discountAmount: z.number(),
    taxAmount: z.number(),
    total: z.number(),
  })
)

const purchaseInvoiceSchema = createInvoiceSchema(
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
)

type SalesInvoiceFormSchema = z.infer<typeof salesInvoiceSchema>
type PurchaseInvoiceFormSchema = z.infer<typeof purchaseInvoiceSchema>

interface NewInvoiceFormProps<T extends InvoiceItem> {
  title: string
  description: string
  icon: React.ReactNode
  schema: z.ZodType<any>
  formData: {
    warehouseId: string
    supplierId?: string
    salespersonId?: string
    date: string
    observations: string
    items: T[]
  }
  onFormDataChange: (data: any) => void
  onSubmit: (data: any) => void
  onBack: () => void
  entityConfig: {
    entityField: keyof typeof formData
    entityLabel: string
    entities: Array<{ id: string; name: string; identification?: string }>
    newEntityModal: React.ReactNode
    editEntityModal: React.ReactNode
    deleteEntityModal: React.ReactNode
  }
  itemConfig: {
    itemType: 'sales' | 'purchase'
    addItem: () => void
    removeItem: (id: string) => void
    updateItem: (id: string, field: keyof T, value: any) => void
    renderItemRow: (item: T, index: number) => React.ReactNode
  }
}

export function NewInvoiceForm<T extends InvoiceItem>({
  title,
  description,
  icon,
  schema,
  formData,
  onFormDataChange,
  onSubmit,
  onBack,
  entityConfig,
  itemConfig,
}: NewInvoiceFormProps<T>) {
  const { warehouses } = useInventory()
  const router = useRouter()
  const { toast } = useToast()

  // Estado para mostrar errores de validación
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [showItemsErrorToast, setShowItemsErrorToast] = useState(false)

  // React Hook Form
  const {
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: formData,
  })

  const handleInputChange = (field: string, value: string) => {
    onFormDataChange({ ...formData, [field]: value })
    setValue(field as any, value, { shouldValidate: true })
  }

  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0)
    const totalDiscount = formData.items.reduce((sum, item) => sum + item.discountAmount, 0)
    const totalTax = formData.items.reduce((sum, item) => sum + item.taxAmount, 0)
    const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0)

    return { subtotal, totalDiscount, totalTax, totalAmount }
  }, [formData.items])

  const handleFormSubmit = async (data: any) => {
    onSubmit(data)
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              {icon}
              {title}
            </h1>
            <p className="mt-1 text-camouflage-green-600">{description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="md2"
              onClick={onBack}
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

              {/* Campo de entidad (Proveedor o Vendedor) */}
              <div className="space-y-2">
                <Label htmlFor={entityConfig.entityField} className="text-camouflage-green-700">
                  {entityConfig.entityLabel} *
                </Label>
                <div className="flex items-center gap-2">
                  <Select value={formData[entityConfig.entityField] || ""} onValueChange={(value) => {
                    if (value === "new-entity") {
                      // Abrir modal de nueva entidad
                    } else {
                      handleInputChange(entityConfig.entityField, value)
                    }
                  }}>
                      <SelectTrigger className={`border-camouflage-green-300 bg-white flex-1 ${
                        errors?.[entityConfig.entityField] ? "border-red-500 focus:border-red-500" : "focus:border-camouflage-green-500"
                      }`}>
                        <SelectValue placeholder={`Seleccionar ${entityConfig.entityLabel.toLowerCase()}`} />
                      </SelectTrigger>
                    <SelectContent className="rounded-3xl">
                      {entityConfig.entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name} - {entity.identification || ''}
                        </SelectItem>
                      ))}
                      <SelectItem value="new-entity" className="text-camouflage-green-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Nuevo {entityConfig.entityLabel}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                onClick={itemConfig.addItem}
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
                      {itemConfig.itemType === 'sales' ? (
                        <>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[300px]">Producto</TableHead>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[120px]">Precio</TableHead>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[120px]">Descuento %</TableHead>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[150px]">Impuesto</TableHead>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[120px]">Cantidad</TableHead>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[120px]">Total</TableHead>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[100px]">Acciones</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[300px]">Concepto</TableHead>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[120px]">Precio</TableHead>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[120px]">Descuento %</TableHead>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[150px]">Impuesto</TableHead>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[120px]">Cantidad</TableHead>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[120px]">Total</TableHead>
                          <TableHead className="font-semibold text-camouflage-green-700 w-[100px]">Acciones</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={item.id} className="border-camouflage-green-100 hover:bg-transparent">
                        {itemConfig.renderItemRow(item, index)}
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

        {/* Modales de entidad */}
        {entityConfig.newEntityModal}
        {entityConfig.editEntityModal}
        {entityConfig.deleteEntityModal}

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
