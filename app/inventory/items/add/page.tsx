"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Tag } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useInventory } from "@/contexts/inventory-context"
import { useToast } from "@/hooks/use-toast"

export default function AddInventoryItemPage() {
  type ItemType = "product" | "service"

  const router = useRouter()
  const { addProduct } = useInventory()
  const { toast } = useToast()
  const [itemType, setItemType] = useState<ItemType>("product")
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("Unidad")
  const [warehouse, setWarehouse] = useState("Principal")
  const [basePrice, setBasePrice] = useState("")
  const [tax, setTax] = useState("0")
  const [totalPrice, setTotalPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [initialCost, setInitialCost] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isImageDragOver, setIsImageDragOver] = useState(false)
  const [reference, setReference] = useState("")
  const [code, setCode] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")

  // Validación con Zod + RHF (controlamos el estado local y sincronizamos con RHF)
  const addSchema = z
    .object({
      type: z.enum(["product", "service"]),
      name: z.string().trim().min(1, "El nombre es requerido"),
      unit: z.string().trim().min(1, "La unidad es requerida"),
      basePrice: z
        .string()
        .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, { message: "Precio base inválido" }),
      tax: z.string().refine((v) => v === "" || !isNaN(parseFloat(v)), { message: "Impuesto inválido" }),
      totalPrice: z
        .string()
        .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, { message: "Precio total inválido" }),
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

  type AddFormSchema = z.infer<typeof addSchema>
  const {
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddFormSchema>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      type: itemType,
      name,
      unit,
      basePrice,
      tax,
      totalPrice,
      quantity,
      initialCost,
    },
  })

  // Inventario por bodega (solo productos)
  type WarehouseEntry = {
    warehouse: string
    qtyInit: number
    qtyMin?: number
    qtyMax?: number
  }
  const [inventoryByWarehouse, setInventoryByWarehouse] = useState<WarehouseEntry[]>([])
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false)
  const [mwWarehouse, setMwWarehouse] = useState("Principal")
  const [mwQtyInit, setMwQtyInit] = useState("")
  const [mwQtyMin, setMwQtyMin] = useState("")
  const [mwQtyMax, setMwQtyMax] = useState("")

  const resetWarehouseModal = () => {
    setMwWarehouse("Principal")
    setMwQtyInit("")
    setMwQtyMin("")
    setMwQtyMax("")
  }
  const saveWarehouseEntry = () => {
    if (!mwWarehouse) return
    const init = parseInt(mwQtyInit || "")
    if (isNaN(init)) return
    const minV = mwQtyMin ? parseInt(mwQtyMin) : undefined
    const maxV = mwQtyMax ? parseInt(mwQtyMax) : undefined

    setInventoryByWarehouse((prev) => {
      // si ya existe la bodega, reemplazar
      const others = prev.filter((e) => e.warehouse !== mwWarehouse)
      return [...others, { warehouse: mwWarehouse, qtyInit: init, qtyMin: minV, qtyMax: maxV }]
    })
    setIsWarehouseModalOpen(false)
    resetWarehouseModal()
  }

  // Bidirectional price calc
  const handleBaseOrTaxChange = (bp: string, t: string) => {
    setBasePrice(bp)
    setTax(t)
    const base = parseFloat(bp || "0")
    const taxP = parseFloat(t || "0")
    const total = base + (base * taxP) / 100
    setTotalPrice(total > 0 ? total.toFixed(2) : "")
    setValue("basePrice", bp, { shouldValidate: true })
    setValue("tax", t, { shouldValidate: true })
    setValue("totalPrice", total > 0 ? total.toFixed(2) : "", { shouldValidate: true })
  }
  const handleTotalChange = (total: string) => {
    setTotalPrice(total)
    const t = parseFloat(tax || "0")
    const tot = parseFloat(total || "0")
    if (t > 0) {
      const base = tot / (1 + t / 100)
      setBasePrice(base > 0 ? base.toFixed(2) : "")
    } else {
      setBasePrice(tot > 0 ? tot.toFixed(2) : "")
    }
    setValue("totalPrice", total, { shouldValidate: true })
    setValue("basePrice", (t > 0 ? parseFloat(total || "0") / (1 + t / 100) : parseFloat(total || "0")).toString(), {
      shouldValidate: true,
    })
  }

  const priceToShow = useMemo(() => totalPrice || basePrice || "0.00", [totalPrice, basePrice])

  const onImageChange = (file: File | null) => {
    setImageFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    } else {
      setImagePreview(null)
    }
  }

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsImageDragOver(true)
  }

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsImageDragOver(false)
  }

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsImageDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      onImageChange(file)
    }
  }

  const handleImageAreaClick = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        onImageChange(file)
      }
    }
    input.click()
  }

  const doSubmit = async (createAnother: boolean) => {
    // Validaciones requeridas
    if (!name.trim()) return
    if (!unit.trim()) return
    const total = parseFloat(totalPrice || "0")
    const base = parseFloat(basePrice || "0")
    if (!total || total <= 0) return
    if (!base || base <= 0) return
    if (itemType === "product") {
      const cost = parseFloat(initialCost || "")
      if (isNaN(cost) || cost < 0) return
    }

    // Construir el objeto Product (mock) y persistir en contexto
    const resolvedCategory = category || (itemType === "service" ? "Servicios" : "Productos")
    const costValue = itemType === "product" ? parseFloat(initialCost || "0") : 0
    const stockValue = itemType === "product" ? parseInt(quantity || "0") || 0 : 0
    try {
      addProduct({
        name: name.trim(),
        sku: (reference || code || name).trim(),
        basePrice: base,
        taxPercent: parseFloat(tax || "0"),
        price: total,
        cost: costValue,
        category: resolvedCategory,
        stock: stockValue,
        minStock: 0,
        maxStock: 0,
        description: description || "",
        supplier: "",
        unit,
        totalSold: 0,
        reorderPoint: 0,
        leadTime: 0,
        imageUrl: imagePreview || undefined,
      })

      toast({
        title: "¡Éxito!",
        description: "El ítem ha sido creado correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el ítem. Inténtalo de nuevo.",
        variant: "destructive",
      })
      return
    }

    if (createAnother) {
      // reset manteniendo tipo
      setName("")
      setUnit(itemType === "service" ? "Servicio" : "Unidad")
      setWarehouse("Principal")
      setBasePrice("")
      setTax("0")
      setTotalPrice("")
      setQuantity("")
      setInitialCost("")
      setImageFile(null)
      setImagePreview(null)
      setReference("")
      setCode("")
      setCategory("")
      setDescription("")
      return
    }
    router.push("/inventory/items")
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-camouflage-green-900">Nuevo ítem de venta</h1>
            <p className="mt-1 max-w-3xl text-camouflage-green-600">
              Crea tus productos inventariables y/o servicios que ofreces para registrar en tus ventas.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left - Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Tipo */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setItemType("product")
                      setUnit("Unidad")
                    }}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      itemType === "product"
                        ? "border-camouflage-green-500 bg-camouflage-green-50 text-camouflage-green-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-camouflage-green-300 hover:bg-camouflage-green-50"
                    }`}
                  >
                    Producto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemType("service")
                      setUnit("Servicio")
                    }}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      itemType === "service"
                        ? "border-camouflage-green-500 bg-camouflage-green-50 text-camouflage-green-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-camouflage-green-300 hover:bg-camouflage-green-50"
                    }`}
                  >
                    Servicio
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-700">
                  Ten en cuenta que, una vez creado, no podrás cambiar el tipo de ítem ni su condición variable.
                </p>
              </CardContent>
            </Card>

            {/* Información general */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Información general</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700" htmlFor="name">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setValue("name", e.target.value, { shouldValidate: true })
                    }}
                    placeholder="Nombre del producto o servicio"
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                  />
                  {errors?.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700" htmlFor="reference">
                      Referencia
                    </Label>
                    <Input
                      id="reference"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Referencia interna"
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700" htmlFor="code">
                      Código del producto o servicio
                    </Label>
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="SKU / Código"
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Categoría</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Servicios">Servicios</SelectItem>
                        <SelectItem value="Productos">Productos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">
                      Unidad de medida <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={unit}
                      onValueChange={(v) => {
                        setUnit(v)
                        setValue("unit", v, { shouldValidate: true })
                      }}
                    >
                      {errors?.unit && <p className="text-xs text-red-600">{errors.unit.message}</p>}
                      <SelectTrigger className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none">
                        <SelectValue placeholder="Selecciona una unidad" />
                      </SelectTrigger>
                      <SelectContent side="bottom" align="start" avoidCollisions={false}>
                        {itemType === "product" ? (
                          <>
                            {/* Unidad */}
                            <div className="sticky top-0 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Unidad
                            </div>
                            <SelectItem value="Unidad">Unidad</SelectItem>
                            <SelectItem value="Pieza">Pieza</SelectItem>
                            <SelectItem value="Paquete">Paquete</SelectItem>
                            <SelectItem value="Caja">Caja</SelectItem>
                            <SelectItem value="Docena">Docena</SelectItem>

                            {/* Longitud */}
                            <div className="sticky top-0 mt-2 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Longitud
                            </div>
                            <SelectItem value="Metro">Metro</SelectItem>
                            <SelectItem value="Centímetro">Centímetro</SelectItem>
                            <SelectItem value="Kilómetro">Kilómetro</SelectItem>
                            <SelectItem value="Pulgada">Pulgada</SelectItem>
                            <SelectItem value="Pie">Pie</SelectItem>

                            {/* Área */}
                            <div className="sticky top-0 mt-2 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Área
                            </div>
                            <SelectItem value="Metro²">Metro²</SelectItem>
                            <SelectItem value="Centímetro²">Centímetro²</SelectItem>
                            <SelectItem value="Hectárea">Hectárea</SelectItem>

                            {/* Volumen */}
                            <div className="sticky top-0 mt-2 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Volumen
                            </div>
                            <SelectItem value="Litro">Litro</SelectItem>
                            <SelectItem value="Mililitro">Mililitro</SelectItem>
                            <SelectItem value="Metro³">Metro³</SelectItem>
                            <SelectItem value="Galón">Galón</SelectItem>

                            {/* Peso */}
                            <div className="sticky top-0 mt-2 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                            {/* Servicio */}
                            <div className="sticky top-0 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Servicio
                            </div>
                            <SelectItem value="Servicio">Servicio</SelectItem>
                            <SelectItem value="Consultoría">Consultoría</SelectItem>
                            <SelectItem value="Proyecto">Proyecto</SelectItem>

                            {/* Tiempo */}
                            <div className="sticky top-0 mt-2 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700" htmlFor="description">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción del producto o servicio"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Precio */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Precio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_auto_180px_auto_1fr]">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700" htmlFor="basePrice">
                      Precio base <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      value={basePrice}
                      onChange={(e) => handleBaseOrTaxChange(e.target.value, tax)}
                      placeholder="0.00"
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    />
                    {errors?.basePrice && <p className="text-xs text-red-600">{errors.basePrice.message}</p>}
                  </div>
                  <div className="pb-3 text-center text-gray-400">+</div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Impuesto</Label>
                    <Select value={tax} onValueChange={(v) => handleBaseOrTaxChange(basePrice, v)}>
                      <SelectTrigger className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none">
                        <SelectValue placeholder="Ninguno (0%)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Ninguno (0%)</SelectItem>
                        <SelectItem value="5">IVA - (5%)</SelectItem>
                        <SelectItem value="19">IVA - (19%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pb-3 text-center text-gray-400">=</div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700" htmlFor="totalPrice">
                      Precio total <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="totalPrice"
                      type="number"
                      step="0.01"
                      value={totalPrice}
                      onChange={(e) => handleTotalChange(e.target.value)}
                      placeholder="0.00"
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    />
                    {errors?.totalPrice && <p className="text-xs text-red-600">{errors.totalPrice.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalle de Inventario */}
            {itemType === "product" && (
              <Card className="border-camouflage-green-200">
                <CardHeader>
                  <CardTitle className="text-camouflage-green-900">Detalle de Inventario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-camouflage-green-700">
                    Distribuye y controla las cantidades de tus productos en diferentes lugares.
                  </p>
                  {/* Lista de bodegas agregadas */}
                  {inventoryByWarehouse.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-camouflage-green-200">
                      <div className="grid grid-cols-4 bg-camouflage-green-50/50 px-4 py-2 text-sm font-semibold text-camouflage-green-800">
                        <div>Bodega</div>
                        <div className="text-right">Cant. inicial</div>
                        <div className="text-right">Cant. mínima</div>
                        <div className="text-right">Cant. máxima</div>
                      </div>
                      <div>
                        {inventoryByWarehouse.map((w) => (
                          <div
                            key={w.warehouse}
                            className="grid grid-cols-4 border-t border-camouflage-green-100 px-4 py-2 text-sm"
                          >
                            <div className="text-camouflage-green-900">{w.warehouse}</div>
                            <div className="text-right">{w.qtyInit}</div>
                            <div className="text-right">{w.qtyMin ?? "-"}</div>
                            <div className="text-right">{w.qtyMax ?? "-"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-camouflage-green-600">Aún no has agregado bodegas.</div>
                  )}
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                      onClick={() => setIsWarehouseModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Agregar bodega
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Costo */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Costo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-sm space-y-2">
                  <Label className="text-sm text-gray-700" htmlFor="initialCost">
                    Costo inicial {itemType === "product" && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="initialCost"
                    type="number"
                    step="0.01"
                    value={initialCost}
                    onChange={(e) => setInitialCost(e.target.value)}
                    placeholder="0.00"
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - Sticky preview & actions */}
          <div className="lg:col-span-1">
            <div className="space-y-4 lg:sticky lg:top-6">
              <Card className="border-camouflage-green-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Image uploader */}
                    <div>
                      <div
                        className={`aspect-square w-full cursor-pointer overflow-hidden rounded-lg transition-colors ${
                          isImageDragOver
                            ? "border-2 border-camouflage-green-500 bg-camouflage-green-50"
                            : "hover:bg-camouflage-green-25 border-2 border-dashed border-gray-300 hover:border-camouflage-green-400"
                        }`}
                        onClick={!imagePreview ? handleImageAreaClick : undefined}
                        onDragOver={handleImageDragOver}
                        onDragLeave={handleImageDragLeave}
                        onDrop={handleImageDrop}
                      >
                        {imagePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex aspect-square flex-col items-center justify-center bg-white">
                            <Tag className="mb-2 h-14 w-14 text-gray-300" />
                            <p className="px-2 text-center text-xs text-gray-500">
                              Haz clic o arrastra una imagen aquí
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 space-y-2">
                        <input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => onImageChange(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-camouflage-green-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-camouflage-green-800"
                        />
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              onImageChange(null)
                            }}
                          >
                            Eliminar imagen
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Name & price preview */}
                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-camouflage-green-900">{name || "Nombre del ítem"}</div>
                      <div className="font-medium text-camouflage-green-700">${priceToShow || "0.00"}</div>
                      <div className="text-xs text-camouflage-green-600">
                        {itemType === "product" ? "Producto" : "Servicio"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="w-full border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                    onClick={() => router.push("/inventory/items")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="w-full bg-camouflage-green-700 text-white hover:bg-camouflage-green-800 disabled:opacity-50"
                    disabled={isSubmitting}
                    onClick={handleSubmit(() => doSubmit(false))}
                  >
                    {isSubmitting ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  className="w-full bg-camouflage-green-600/20 text-camouflage-green-800 hover:bg-camouflage-green-600/30 disabled:opacity-50"
                  disabled={isSubmitting}
                  onClick={handleSubmit(() => doSubmit(true))}
                >
                  {isSubmitting ? "Guardando..." : "Guardar y crear otro"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal Agregar Bodega */}
      {itemType === "product" && (
        <Modal
          isOpen={isWarehouseModalOpen}
          onClose={() => {
            setIsWarehouseModalOpen(false)
            resetWarehouseModal()
          }}
          title="Seleccionar bodega"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-700">
                Bodega <span className="text-red-500">*</span>
              </Label>
              <Select value={mwWarehouse} onValueChange={setMwWarehouse}>
                <SelectTrigger className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none">
                  <SelectValue placeholder="Selecciona una bodega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Principal">Principal</SelectItem>
                  <SelectItem value="Secundaria">Secundaria</SelectItem>
                  <SelectItem value="Almacén">Almacén</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">
                  Cantidad inicial <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={mwQtyInit}
                  onChange={(e) => setMwQtyInit(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Cantidad mínima</Label>
                <Input
                  type="number"
                  min="0"
                  value={mwQtyMin}
                  onChange={(e) => setMwQtyMin(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Cantidad máxima</Label>
                <Input
                  type="number"
                  min="0"
                  value={mwQtyMax}
                  onChange={(e) => setMwQtyMax(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
                onClick={saveWarehouseEntry}
              >
                Guardar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  )
}
