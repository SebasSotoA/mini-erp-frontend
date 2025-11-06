"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, HelpCircle, ExternalLink, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RequiredFieldsWarning } from "./required-fields-warning"
import { useCreateProducto } from "@/hooks/api/use-productos"
import { mapProductToCreateDto } from "@/lib/api/services/productos.service"
import { useCategorias } from "@/hooks/api/use-categorias"
import { useBodegasActive } from "@/hooks/api/use-bodegas"
import { useCamposExtraRequeridos } from "@/hooks/api/use-campos-extra"


interface NewItemFormProps {
  onClose: () => void
  onSuccess?: () => void
}

type ItemType = "product"

export function NewItemForm({ onClose, onSuccess }: NewItemFormProps) {
  const createMutation = useCreateProducto()
  const { data: categorias = [], isLoading: isLoadingCategorias } = useCategorias(true)
  const { data: bodegas = [], isLoading: isLoadingBodegas } = useBodegasActive(true)
  const { data: requiredFields = [], isLoading: isLoadingCamposExtra } = useCamposExtraRequeridos()
  const itemType: ItemType = "product"
  const [extraFieldValues, setExtraFieldValues] = useState<Record<string, string>>({})
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("")
  const [selectedBodegaId, setSelectedBodegaId] = useState<string>("")

  const schema = z
    .object({
      type: z.enum(["product"]),
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
    })
    .superRefine((data, ctx) => {
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "product",
      name: "",
      unitOfMeasure: "Unidad", // Por defecto "Unidad" para productos
      warehouse: "",
      basePrice: "",
      tax: "",
      totalPrice: "",
      quantity: "",
      initialCost: "",
    },
  })

  const watchedValues = watch()

  // Efecto para inicializar valores por defecto de campos extra requeridos
  useEffect(() => {
    if (requiredFields.length === 0) return
    
    setExtraFieldValues(prev => {
      const defaultValues: Record<string, string> = {}
      let hasChanges = false
      
      requiredFields.forEach(field => {
        // Solo agregar valor por defecto si no existe ya un valor (incluyendo vacío)
        if (field.defaultValue && prev[field.id] === undefined) {
          defaultValues[field.id] = field.defaultValue
          hasChanges = true
        }
      })
      
      return hasChanges ? { ...prev, ...defaultValues } : prev
    })
  }, [requiredFields]) // Ejecutar cuando cambien los campos requeridos

  const handleExtraFieldChange = (fieldId: string, value: string) => {
    setExtraFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handlePriceChange = (field: "basePrice" | "tax" | "totalPrice", value: string) => {
    setValue(field, value, { shouldValidate: true })

    if (field === "basePrice" || field === "tax") {
      const basePrice = parseFloat(field === "basePrice" ? value : watchedValues.basePrice || "") || 0
      const taxPercent = parseFloat(field === "tax" ? value : watchedValues.tax || "") || 0
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
    try {
      // Validar que se haya seleccionado una bodega
      if (!selectedBodegaId) {
        throw new Error("Debe seleccionar una bodega")
      }

      // Validar campos extra requeridos
      const missingRequiredFields: string[] = []
      
      requiredFields.forEach((field) => {
        const value = extraFieldValues[field.id]?.trim() || ""
        // Si el campo tiene un valor por defecto, verificar si fue cambiado
        const defaultValue = field.defaultValue || ""
        const finalValue = value || defaultValue
        
        if (!finalValue || finalValue.trim() === "") {
          missingRequiredFields.push(field.name)
        }
      })

      if (missingRequiredFields.length > 0) {
        const errorMsg = `Debes completar los siguientes campos obligatorios: ${missingRequiredFields.join(", ")}`
        setErrorMessage(errorMsg)
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 5000)
        return
      }

      // Mapear campos extra requeridos a formato del backend (incluir valores por defecto si no fueron cambiados)
      const camposExtra = requiredFields.map((field) => {
        const value = extraFieldValues[field.id]?.trim() || field.defaultValue || ""
        return {
          campoExtraId: field.id,
          valor: String(value),
        }
      })

      // Crear DTO del backend
      const createDto = mapProductToCreateDto(
        {
          name: data.name,
          sku: undefined, // El backend lo genera automáticamente si no se proporciona
          description: `Producto: ${data.name}`,
          basePrice: parseFloat(data.basePrice) || 0,
          taxPercent: parseFloat(data.tax) || 0, // El mapper convierte a decimal
          cost: parseFloat(data.initialCost || "0") || 0,
          unit: data.unitOfMeasure,
        },
        {
          categoriaId: selectedCategoriaId || null,
          bodegaPrincipalId: selectedBodegaId,
          cantidadInicial: parseInt(data.quantity || "0") || undefined,
        },
      )

      // Agregar campos extra requeridos (siempre deben estar presentes si hay campos requeridos)
      if (camposExtra.length > 0) {
        createDto.camposExtra = camposExtra
      }

      await createMutation.mutateAsync(createDto)
      
      onSuccess?.()
      onClose()
    } catch (error) {
      // Los errores de API ya se manejan en el hook
      console.error("Error al crear producto:", error)
      throw error // Re-lanzar para que handleFormSubmit lo capture
    }
  }

  const handleFormSubmit = async (data: FormSchema) => {
    try {
      await onSubmit(data)
    } catch (error) {
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 4000)
    }
  }

  const handleFormError = () => {
    setShowErrorToast(true)
    setTimeout(() => setShowErrorToast(false), 4000)
  }


  return (
    <div className="relative">
      <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="space-y-3">
      <TooltipProvider>
        {/* Campo type registrado (hidden) */}
        <input {...register("type")} type="hidden" />


        {/* Primera fila: Información básica */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              {...register("name")}
              className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                errors.name ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
              }`}
              placeholder="Ingresa el nombre del producto"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="unit" className="mb-0 text-sm font-medium text-gray-700">
                Unidad de medida <span className="text-red-500">*</span>
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400 transition-colors hover:text-camouflage-green-600" />
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-gray-700">
                  <p>Forma de medir el producto (unidad, kilogramo, litro, etc.)</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Campo registrado con RHF */}
            <input {...register("unitOfMeasure")} type="hidden" />

            <Select
              value={watchedValues.unitOfMeasure || "Unidad"}
              onValueChange={(value) => setValue("unitOfMeasure", value, { shouldValidate: true })}
            >
              <SelectTrigger className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none ${
                errors.unitOfMeasure ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
              }`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" avoidCollisions={false} className="rounded-3xl">
                <div className="sticky top-0 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Unidad
                </div>
                <SelectItem value="Unidad">Unidad</SelectItem>
                <SelectItem value="Pieza">Pieza</SelectItem>
                <SelectItem value="Paquete">Paquete</SelectItem>
                <SelectItem value="Caja">Caja</SelectItem>
                <SelectItem value="Docena">Docena</SelectItem>

                <div className="sticky top-0 mt-2 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Longitud
                </div>
                <SelectItem value="Metro">Metro</SelectItem>
                <SelectItem value="Centímetro">Centímetro</SelectItem>
                <SelectItem value="Kilómetro">Kilómetro</SelectItem>
                <SelectItem value="Pulgada">Pulgada</SelectItem>
                <SelectItem value="Pie">Pie</SelectItem>

                <div className="sticky top-0 mt-2 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Área
                </div>
                <SelectItem value="Metro²">Metro²</SelectItem>
                <SelectItem value="Centímetro²">Centímetro²</SelectItem>
                <SelectItem value="Hectárea">Hectárea</SelectItem>

                <div className="sticky top-0 mt-2 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Volumen
                </div>
                <SelectItem value="Litro">Litro</SelectItem>
                <SelectItem value="Mililitro">Mililitro</SelectItem>
                <SelectItem value="Metro³">Metro³</SelectItem>
                <SelectItem value="Galón">Galón</SelectItem>

                <div className="sticky top-0 mt-2 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Peso
                </div>
                <SelectItem value="Kilogramo">Kilogramo</SelectItem>
                <SelectItem value="Gramo">Gramo</SelectItem>
                <SelectItem value="Tonelada">Tonelada</SelectItem>
                <SelectItem value="Libra">Libra</SelectItem>
                <SelectItem value="Onza">Onza</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse" className="text-sm font-medium text-gray-700">
              Bodega <span className="text-red-500">*</span>
            </Label>
            <input {...register("warehouse")} type="hidden" />
            <Select
              value={selectedBodegaId}
              onValueChange={(bodegaId) => {
                setSelectedBodegaId(bodegaId)
                const bodega = bodegas.find(b => b.id === bodegaId)
                setValue("warehouse", bodega?.nombre || "", { shouldValidate: true })
              }}
              disabled={isLoadingBodegas}
            >
              <SelectTrigger className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none ${
                errors.warehouse ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
              }`}>
                <SelectValue placeholder={isLoadingBodegas ? "Cargando bodegas..." : "Selecciona una bodega"} />
              </SelectTrigger>
              <SelectContent className="rounded-3xl">
                {bodegas.map((bodega) => (
                  <SelectItem key={bodega.id} value={bodega.id}>
                    {bodega.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Segunda fila: Precios */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
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
                className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                  errors.basePrice ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                }`}
                placeholder="0.00"
              />
            </div>

            <div className="mt-6 flex items-center justify-center">
              <Plus className="h-5 w-5 text-gray-400" />
            </div>

            <div className="relative w-32">
              <Label htmlFor="tax" className="text-sm font-medium text-gray-700">
                Impuesto
              </Label>
              <input {...register("tax")} type="hidden" />
              <Select value={watchedValues.tax || "0"} onValueChange={(value) => handlePriceChange("tax", value)}>
                <SelectTrigger className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none ${
                  errors.tax ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                }`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-3xl">
                  <SelectItem value="0">Ninguno (0%)</SelectItem>
                  <SelectItem value="5">IVA - (5%)</SelectItem>
                  <SelectItem value="19">IVA - (19%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <span className="text-lg text-gray-400">=</span>
            </div>

            <div className="relative flex-1">
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
                className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                  errors.totalPrice ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                }`}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Tercera fila: Cantidad y Costo inicial */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex h-5 items-center gap-2">
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                  Cantidad <span className="text-red-500">*</span>
                </Label>
                <div className="h-4 w-4"></div> {/* Espaciador para alineación */}
              </div>
              <Input
                id="quantity"
                type="number"
                min="0"
                {...register("quantity")}
                className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                  errors.quantity ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                }`}
                placeholder="Ingresa la cantidad inicial"
              />
            </div>
            <div className="space-y-2">
              <div className="flex h-5 items-center gap-2">
                <Label htmlFor="initialCost" className="text-sm font-medium text-gray-700">
                  Costo inicial <span className="text-red-500">*</span>
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400 transition-colors hover:text-camouflage-green-600" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white border-gray-700">
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
                className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                  errors.initialCost ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                }`}
                placeholder="0.00"
              />
            </div>
          </div>

        {/* Tarjeta de advertencia para campos extra requeridos */}
        <RequiredFieldsWarning 
          onFieldChange={handleExtraFieldChange}
          fieldValues={extraFieldValues}
          requiredFields={requiredFields}
          isLoading={isLoadingCamposExtra}
        />

        {/* Acciones */}
        <div className="flex items-center justify-between border-t pt-4">
          <a
            href="/inventory/items/add"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-camouflage-green-700"
          >
            <ExternalLink className="h-4 w-4" />
            Ir al formulario avanzado
          </a>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="px-6">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-camouflage-green-700 px-6 text-white hover:bg-camouflage-green-800"
            >
              Crear producto
            </Button>
          </div>
        </div>
      </TooltipProvider>
      </form>

      {/* Mensaje flotante de error */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300 max-w-md">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">
              {errorMessage || "Error, verifica los campos marcados en rojo y los campos adicionales obligatorios para continuar"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
