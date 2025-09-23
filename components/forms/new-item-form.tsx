"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useInventory } from "@/contexts/inventory-context"
import { Plus, HelpCircle, ExternalLink, Check } from "lucide-react"

interface NewItemFormProps {
  onClose: () => void
  onSuccess?: () => void
}

type ItemType = "product" | "service"

export function NewItemForm({ onClose, onSuccess }: NewItemFormProps) {
  const { addProduct } = useInventory()
  const [itemType, setItemType] = useState<ItemType>("product")

  const schema = z.object({
    type: z.enum(["product", "service"]),
    name: z.string().trim().min(1, "El nombre es requerido"),
    unitOfMeasure: z.string().trim().min(1, "La unidad es requerida"),
    warehouse: z.string().trim().min(1, "La bodega es requerida"),
    basePrice: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Precio base inválido",
    }),
    tax: z.string().refine((v) => v === "" || !isNaN(parseFloat(v)), { message: "Impuesto inválido" }),
    totalPrice: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Precio total inválido",
    }),
    quantity: z.string().optional(),
    initialCost: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.type === "product") {
      if (!data.quantity || isNaN(parseInt(data.quantity)) || parseInt(data.quantity) < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["quantity"], message: "Cantidad inválida" })
      }
      if (!data.initialCost || isNaN(parseFloat(data.initialCost)) || parseFloat(data.initialCost) < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["initialCost"], message: "Costo inválido" })
      }
    }
  })

  type FormSchema = z.infer<typeof schema>

  const { register, handleSubmit, setValue, watch, getValues, formState: { errors, isSubmitting } } = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "product",
      name: "",
      unitOfMeasure: "Unidad", // Por defecto "Unidad" para productos
      warehouse: "Principal",
      basePrice: "",
      tax: "",
      totalPrice: "",
      quantity: "",
      initialCost: "",
    },
  })

  const watchedValues = watch()

  // Efecto para manejar el cambio de tipo automáticamente
  useEffect(() => {
    const newUnitOfMeasure = itemType === "product" ? "Unidad" : "Servicio"
    setValue("type", itemType, { shouldValidate: false })
    setValue("unitOfMeasure", newUnitOfMeasure, { shouldValidate: false })
  }, [itemType, setValue])

  const handleTypeChange = (newType: ItemType) => {
    setItemType(newType)
    // El useEffect se encargará del resto
  }

  const handlePriceChange = (field: "basePrice" | "tax" | "totalPrice", value: string) => {
    setValue(field, value, { shouldValidate: true })
    
    if (field === "basePrice" || field === "tax") {
      const basePrice = parseFloat(field === "basePrice" ? value : (watchedValues.basePrice || "")) || 0
      const taxPercent = parseFloat(field === "tax" ? value : (watchedValues.tax || "")) || 0
      const taxAmount = (basePrice * taxPercent) / 100
      const total = basePrice + taxAmount
      setValue("totalPrice", total > 0 ? total.toFixed(2) : "", { shouldValidate: true })
    } else if (field === "totalPrice") {
      const total = parseFloat(value) || 0
      const taxPercent = parseFloat(watchedValues.tax || "") || 0
      if (taxPercent > 0) {
        const basePrice = total / (1 + taxPercent / 100)
        setValue("basePrice", basePrice > 0 ? basePrice.toFixed(2) : "", { shouldValidate: true })
      } else {
        setValue("basePrice", total > 0 ? total.toFixed(2) : "", { shouldValidate: true })
      }
    }
  }

  const onSubmit = async (data: FormSchema) => {
    const newProduct = {
      name: data.name,
      sku: `SKU-${Date.now()}`,
      description: `${itemType === "product" ? "Producto" : "Servicio"}: ${data.name}`,
      basePrice: parseFloat(data.basePrice) || 0,
      taxPercent: parseFloat(data.tax) || 0,
      price: parseFloat(data.totalPrice) || 0,
      cost: parseFloat(data.initialCost || "0") || 0,
      stock: parseInt(data.quantity || "0") || 0,
      minStock: 5,
      maxStock: 100,
      category: itemType === "product" ? "Productos" : "Servicios",
      supplier: "Proveedor General",
      totalSold: 0,
      reorderPoint: 10,
      leadTime: 7
    }

    addProduct(newProduct)
    onSuccess?.()
    onClose()
  }

  const ItemTypeButton = ({ type, label, isSelected, onClick }: {
    type: ItemType
    label: string
    isSelected: boolean
    onClick: () => void
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 ${
        isSelected
          ? "border-camouflage-green-500 bg-camouflage-green-50 text-camouflage-green-700"
          : "border-gray-200 bg-white text-gray-600 hover:border-camouflage-green-300 hover:bg-camouflage-green-50"
      }`}
    >
      {label}
      {isSelected && (
        <Check className="w-4 h-4 text-camouflage-green-600" />
      )}
    </button>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <TooltipProvider>
        {/* Campo type registrado (hidden) */}
        <input {...register("type")} type="hidden" />
        
        {/* Tipo de Item */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700">
              Tipo de ítem <span className="text-red-500">*</span>
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-camouflage-green-600 transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Selecciona si es un producto físico o un servicio</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex gap-3 h-11">
            <ItemTypeButton
              type="product"
              label="Producto"
              isSelected={itemType === "product"}
              onClick={() => handleTypeChange("product")}
            />
            <ItemTypeButton
              type="service"
              label="Servicio"
              isSelected={itemType === "service"}
              onClick={() => handleTypeChange("service")}
            />
          </div>
          <p className="text-xs text-gray-700 flex items-center gap-2">
            <span className="w-4 h-4 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">!</span>
            Ten en cuenta que, una vez creado, no podrás cambiar el tipo de ítem ni su condición variable.
          </p>
        </div>

        {/* Primera fila: Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              {...register("name")}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
              placeholder="Ingresa el nombre del producto"
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="unit" className="text-sm font-medium text-gray-700 mb-0">
                Unidad de medida <span className="text-red-500">*</span>
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-camouflage-green-600 transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Forma de medir el producto (unidad, kilogramo, litro, etc.)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Campo registrado con RHF */}
            <input {...register("unitOfMeasure")} type="hidden" />
            
            <Select 
              value={watchedValues.unitOfMeasure || (itemType === "product" ? "Unidad" : "Servicio")} 
              onValueChange={(value) => setValue("unitOfMeasure", value, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" avoidCollisions={false}>
                {itemType === "product" ? (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                      Unidad
                    </div>
                    <SelectItem value="Unidad">Unidad</SelectItem>
                    <SelectItem value="Pieza">Pieza</SelectItem>
                    <SelectItem value="Paquete">Paquete</SelectItem>
                    <SelectItem value="Caja">Caja</SelectItem>
                    <SelectItem value="Docena">Docena</SelectItem>
                    
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">
                      Longitud
                    </div>
                    <SelectItem value="Metro">Metro</SelectItem>
                    <SelectItem value="Centímetro">Centímetro</SelectItem>
                    <SelectItem value="Kilómetro">Kilómetro</SelectItem>
                    <SelectItem value="Pulgada">Pulgada</SelectItem>
                    <SelectItem value="Pie">Pie</SelectItem>
                    
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">
                      Área
                    </div>
                    <SelectItem value="Metro²">Metro²</SelectItem>
                    <SelectItem value="Centímetro²">Centímetro²</SelectItem>
                    <SelectItem value="Hectárea">Hectárea</SelectItem>
                    
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">
                      Volumen
                    </div>
                    <SelectItem value="Litro">Litro</SelectItem>
                    <SelectItem value="Mililitro">Mililitro</SelectItem>
                    <SelectItem value="Metro³">Metro³</SelectItem>
                    <SelectItem value="Galón">Galón</SelectItem>
                    
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">
                      Peso
                    </div>
                    <SelectItem value="Kilogramo">Kilogramo</SelectItem>
                    <SelectItem value="Gramo">Gramo</SelectItem>
                    <SelectItem value="Tonelada">Tonelada</SelectItem>
                    <SelectItem value="Libra">Libra</SelectItem>
                    <SelectItem value="Onza">Onza</SelectItem>
                  </>
                ) : (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                      Servicio
                    </div>
                    <SelectItem value="Servicio">Servicio</SelectItem>
                    <SelectItem value="Consultoría">Consultoría</SelectItem>
                    <SelectItem value="Proyecto">Proyecto</SelectItem>
                    
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">
                      Tiempo
                    </div>
                    <SelectItem value="Hora">Hora</SelectItem>
                    <SelectItem value="Día">Día</SelectItem>
                    <SelectItem value="Semana">Semana</SelectItem>
                    <SelectItem value="Mes">Mes</SelectItem>
                    <SelectItem value="Año">Año</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {errors.unitOfMeasure && <p className="text-xs text-red-600">{errors.unitOfMeasure.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="warehouse" className="text-sm font-medium text-gray-700">
              Bodega <span className="text-red-500">*</span>
            </Label>
            <input {...register("warehouse")} type="hidden" />
            <Select value={watchedValues.warehouse || "Principal"} onValueChange={(value) => setValue("warehouse", value, { shouldValidate: true })}>
              <SelectTrigger className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Principal">Principal</SelectItem>
                <SelectItem value="Secundaria">Secundaria</SelectItem>
                <SelectItem value="Almacén">Almacén</SelectItem>
              </SelectContent>
            </Select>
            {errors.warehouse && <p className="text-xs text-red-600">{errors.warehouse.message}</p>}
          </div>
        </div>

        {/* Segunda fila: Precios */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Label htmlFor="basePrice" className="text-sm font-medium text-gray-700">
                Precio base <span className="text-red-500">*</span>
              </Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                min="0"
                {...register("basePrice")}
                onChange={(e) => handlePriceChange("basePrice", e.target.value)}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                placeholder="0.00"
              />
              {errors.basePrice && (
                <p className="absolute -bottom-5 left-0 text-xs text-red-600 bg-white px-1 rounded shadow-sm">
                  {errors.basePrice.message}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-center mt-6">
              <Plus className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="w-32 relative">
              <Label htmlFor="tax" className="text-sm font-medium text-gray-700">
                Impuesto
              </Label>
              <input {...register("tax")} type="hidden" />
              <Select value={watchedValues.tax || "0"} onValueChange={(value) => handlePriceChange("tax", value)}>
                <SelectTrigger className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Ninguno (0%)</SelectItem>
                  <SelectItem value="5">IVA - (5%)</SelectItem>
                  <SelectItem value="19">IVA - (19%)</SelectItem>
                </SelectContent>
              </Select>
              {errors.tax && (
                <p className="absolute -bottom-5 left-0 text-xs text-red-600 bg-white px-1 rounded shadow-sm">
                  {errors.tax.message}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-center mt-6">
              <span className="text-gray-400 text-lg">=</span>
            </div>
            
            <div className="flex-1 relative">
              <Label htmlFor="totalPrice" className="text-sm font-medium text-gray-700">
                Precio Total <span className="text-red-500">*</span>
              </Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                min="0"
                {...register("totalPrice")}
                onChange={(e) => handlePriceChange("totalPrice", e.target.value)}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                placeholder="0.00"
              />
              {errors.totalPrice && (
                <p className="absolute -bottom-5 left-0 text-xs text-red-600 bg-white px-1 rounded shadow-sm">
                  {errors.totalPrice.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tercera fila: Cantidad y Costo inicial (solo Producto) */}
        {itemType === "product" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 h-5">
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                  Cantidad <span className="text-red-500">*</span>
                </Label>
                <div className="w-4 h-4"></div> {/* Espaciador para alineación */}
              </div>
              <Input
                id="quantity"
                type="number"
                min="0"
                {...register("quantity")}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                placeholder="Ingresa la cantidad inicial"
              />
              <div className="h-6">
                {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity.message as string}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 h-5">
                <Label htmlFor="initialCost" className="text-sm font-medium text-gray-700">
                  Costo inicial <span className="text-red-500">*</span>
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-camouflage-green-600 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Costo de adquisición o producción del ítem</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="initialCost"
                type="number"
                step="0.01"
                min="0"
                {...register("initialCost")}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                placeholder="0.00"
              />
              <div className="h-6">
                {errors.initialCost && <p className="text-xs text-red-600 mt-1">{errors.initialCost.message as string}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-between items-center pt-4 border-t">
          <a
            href="/inventory/items/add"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-camouflage-green-700 flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Ir al formulario avanzado
          </a>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white"
            >
              Crear {itemType === "product" ? "producto" : "servicio"}
            </Button>
          </div>
        </div>
      </TooltipProvider>
    </form>
  )
}