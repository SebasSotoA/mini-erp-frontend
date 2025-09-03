"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { ExtendedProduct } from "@/lib/types/items"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Plus, Tag } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useInventory } from "@/contexts/inventory-context"
import { useToast } from "@/hooks/use-toast"

export default function EditInventoryItemPage() {
  type ItemType = "product" | "service"

  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { getProductById, updateProduct } = useInventory()
  const { toast } = useToast()

  const product = id ? getProductById(id) : undefined

  // Estado de formulario (mismos campos del formulario avanzado de creación)
  const [itemType, setItemType] = useState<ItemType>("product")
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("")
  const [warehouse, setWarehouse] = useState("Principal")
  const [basePrice, setBasePrice] = useState("")
  const [tax, setTax] = useState("0")
  const [totalPrice, setTotalPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [initialCost, setInitialCost] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [reference, setReference] = useState("")
  const [code, setCode] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")

  // Validación con Zod + RHF (controlamos el estado local y sincronizamos con RHF)
  const editSchema = z.object({
    type: z.enum(["product", "service"]),
    name: z.string().trim().min(1, "El nombre es requerido"),
    unit: z.string().trim().min(1, "La unidad es requerida"),
    basePrice: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, { message: "Precio base inválido" }),
    tax: z.string().refine(v => v === "" || !isNaN(parseFloat(v)), { message: "Impuesto inválido" }),
    totalPrice: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, { message: "Precio total inválido" }),
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

  type EditFormSchema = z.infer<typeof editSchema>
  const { handleSubmit, setValue, formState: { isSubmitting } } = useForm<EditFormSchema>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      type: "product",
      name: "",
      unit: "",
      basePrice: "",
      tax: "",
      totalPrice: "",
      quantity: "",
      initialCost: "",
    },
  })

  // Inventario por bodega (solo productos) - placeholder local para UI
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

  useEffect(() => {
    if (!product) return
    // Deducir tipo por categoría (mock): "Servicios" => service, otro => product
    const deducedType: ItemType = product.category === "Servicios" ? "service" : "product"
    setItemType(deducedType)
    setName(product.name)
    setReference(product.sku)
    setCode(product.sku)
    setCategory(product.category || "")
    setDescription(product.description || "")
    setTotalPrice(String(product.price))
    setBasePrice(String((product as ExtendedProduct).basePrice ?? product.price))
    setTax(String((product as ExtendedProduct).taxPercent ?? 0))
    setQuantity(String(product.stock))
    setInitialCost(String(product.cost))
    setUnit((product as ExtendedProduct).unit ?? (deducedType === "service" ? "Servicio" : "Unidad"))
    setImagePreview((product as ExtendedProduct).imageUrl ?? null)
    setWarehouse("Principal")
  }, [product])



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

    setInventoryByWarehouse(prev => {
      const others = prev.filter(e => e.warehouse !== mwWarehouse)
      return [...others, { warehouse: mwWarehouse, qtyInit: init, qtyMin: minV, qtyMax: maxV }]
    })
    setIsWarehouseModalOpen(false)
    resetWarehouseModal()
  }

  // Cálculo bidireccional de precios (igual que en creación)
  const handleBaseOrTaxChange = (bp: string, t: string) => {
    setBasePrice(bp)
    setTax(t)
    const base = parseFloat(bp || "0")
    const taxP = parseFloat(t || "0")
    const total = base + (base * taxP) / 100
    setTotalPrice(total > 0 ? total.toFixed(2) : "")
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

  const validateForm = () => {
    const errors: string[] = []
    
    if (!name.trim()) errors.push("El nombre es requerido")
    if (!unit.trim()) errors.push("La unidad es requerida")
    if (!basePrice || parseFloat(basePrice) <= 0) errors.push("El precio base debe ser mayor a 0")
    if (!totalPrice || parseFloat(totalPrice) <= 0) errors.push("El precio total debe ser mayor a 0")
    if (itemType === "product") {
      if (!quantity || parseInt(quantity) < 0) errors.push("La cantidad debe ser mayor o igual a 0")
      if (!initialCost || parseFloat(initialCost) < 0) errors.push("El costo inicial debe ser mayor o igual a 0")
    }
    
    return errors
  }

  const doSubmit = async (createAnother: boolean = false) => {
    if (!id || !product) return
    
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      toast({
        title: "Error de validación",
        description: validationErrors.join(", "),
        variant: "destructive",
      })
      return
    }

    try {
      // Mapear a Product parcial y actualizar en contexto
      updateProduct(id, {
        name,
        sku: reference,
        category,
        description,
        unit,
        basePrice: basePrice ? parseFloat(basePrice) : (product as ExtendedProduct).basePrice,
        taxPercent: tax ? parseFloat(tax) : (product as ExtendedProduct).taxPercent,
        price: totalPrice ? parseFloat(totalPrice) : product.price,
        stock: quantity ? parseInt(quantity) : product.stock,
        cost: initialCost ? parseFloat(initialCost) : product.cost,
        imageUrl: imagePreview === null ? undefined : (imagePreview || (product as ExtendedProduct).imageUrl),
      })

      toast({
        title: "¡Éxito!",
        description: "El ítem ha sido actualizado correctamente.",
      })

      if (createAnother) {
        router.push(`/inventory/items/add`)
      } else {
        router.push(`/inventory/items/${id}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el ítem. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900">Ítem no encontrado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-camouflage-green-700">El ítem solicitado no existe o fue eliminado.</p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/inventory/items")}
                  className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                >
                  Volver a la lista
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-camouflage-green-900">Editar ítem de venta</h1>
            <p className="text-camouflage-green-600 mt-1 max-w-3xl">
              Actualiza los datos del producto o servicio.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tipo */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      itemType === "product"
                        ? "border-camouflage-green-500 bg-camouflage-green-50 text-camouflage-green-700"
                        : "border-gray-200 bg-white text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Producto
                  </button>
                  <button
                    type="button"
                    disabled
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      itemType === "service"
                        ? "border-camouflage-green-500 bg-camouflage-green-50 text-camouflage-green-700"
                        : "border-gray-200 bg-white text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Servicio
                  </button>
                </div>
                <p className="text-xs text-gray-700 mt-3">
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
                  <Label className="text-sm text-gray-700" htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre del producto o servicio"
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                  />

                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700" htmlFor="reference">Referencia</Label>
                    <Input
                      id="reference"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Referencia interna"
                      className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700" htmlFor="code">Código del producto o servicio</Label>
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="SKU / Código"
                      className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Categoría</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Servicios">Servicios</SelectItem>
                        <SelectItem value="Productos">Productos</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Stationery">Stationery</SelectItem>
                        <SelectItem value="Kitchen">Kitchen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Unidad de medida <span className="text-red-500">*</span></Label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none">
                        <SelectValue placeholder="Selecciona una unidad" />
                      </SelectTrigger>
                      <SelectContent side="bottom" align="start" avoidCollisions={false}>
                        {itemType === "product" ? (
                          <>
                            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">Unidad</div>
                            <SelectItem value="Unidad">Unidad</SelectItem>
                            <SelectItem value="Pieza">Pieza</SelectItem>
                            <SelectItem value="Paquete">Paquete</SelectItem>
                            <SelectItem value="Caja">Caja</SelectItem>
                            <SelectItem value="Docena">Docena</SelectItem>
                            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">Longitud</div>
                            <SelectItem value="Metro">Metro</SelectItem>
                            <SelectItem value="Centímetro">Centímetro</SelectItem>
                            <SelectItem value="Kilómetro">Kilómetro</SelectItem>
                            <SelectItem value="Pulgada">Pulgada</SelectItem>
                            <SelectItem value="Pie">Pie</SelectItem>
                            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">Área</div>
                            <SelectItem value="Metro²">Metro²</SelectItem>
                            <SelectItem value="Centímetro²">Centímetro²</SelectItem>
                            <SelectItem value="Hectárea">Hectárea</SelectItem>
                            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">Volumen</div>
                            <SelectItem value="Litro">Litro</SelectItem>
                            <SelectItem value="Mililitro">Mililitro</SelectItem>
                            <SelectItem value="Metro³">Metro³</SelectItem>
                            <SelectItem value="Galón">Galón</SelectItem>
                            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">Peso</div>
                            <SelectItem value="Kilogramo">Kilogramo</SelectItem>
                            <SelectItem value="Gramo">Gramo</SelectItem>
                            <SelectItem value="Tonelada">Tonelada</SelectItem>
                            <SelectItem value="Libra">Libra</SelectItem>
                            <SelectItem value="Onza">Onza</SelectItem>
                          </>
                        ) : (
                          <>
                            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">Servicio</div>
                            <SelectItem value="Servicio">Servicio</SelectItem>
                            <SelectItem value="Consultoría">Consultoría</SelectItem>
                            <SelectItem value="Proyecto">Proyecto</SelectItem>
                            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">Tiempo</div>
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
                  <Label className="text-sm text-gray-700" htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción del producto o servicio"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
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
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_180px_auto_1fr] items-end gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700" htmlFor="basePrice">Precio base <span className="text-red-500">*</span></Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      value={basePrice}
                      onChange={(e) => handleBaseOrTaxChange(e.target.value, tax)}
                      placeholder="0.00"
                      className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    />

                  </div>
                  <div className="text-center pb-3 text-gray-400">+</div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Impuesto</Label>
                    <Select value={tax} onValueChange={(v) => handleBaseOrTaxChange(basePrice, v)}>
                      <SelectTrigger className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none">
                        <SelectValue placeholder="Ninguno (0%)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Ninguno (0%)</SelectItem>
                        <SelectItem value="5">IVA - (5%)</SelectItem>
                        <SelectItem value="19">IVA - (19%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-center pb-3 text-gray-400">=</div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700" htmlFor="totalPrice">Precio total <span className="text-red-500">*</span></Label>
                    <Input
                      id="totalPrice"
                      type="number"
                      step="0.01"
                      value={totalPrice}
                      onChange={(e) => handleTotalChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    />

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
                  {inventoryByWarehouse.length > 0 ? (
                    <div className="border border-camouflage-green-200 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-4 bg-camouflage-green-50/50 text-sm font-semibold text-camouflage-green-800 px-4 py-2">
                        <div>Bodega</div>
                        <div className="text-right">Cant. inicial</div>
                        <div className="text-right">Cant. mínima</div>
                        <div className="text-right">Cant. máxima</div>
                      </div>
                      <div>
                        {inventoryByWarehouse.map((w) => (
                          <div key={w.warehouse} className="grid grid-cols-4 px-4 py-2 border-t border-camouflage-green-100 text-sm">
                            <div className="text-camouflage-green-900">{w.warehouse}</div>
                            <div className="text-right">{w.qtyInit}</div>
                            <div className="text-right">{w.qtyMin ?? '-'}</div>
                            <div className="text-right">{w.qtyMax ?? '-'}</div>
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
                      <Plus className="h-4 w-4 mr-2" /> Agregar bodega
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
                <div className="space-y-2 max-w-sm">
                  <Label className="text-sm text-gray-700" htmlFor="initialCost">Costo inicial {itemType === "product" && <span className="text-red-500">*</span>}</Label>
                  <Input
                    id="initialCost"
                    type="number"
                    step="0.01"
                    value={initialCost}
                    onChange={(e) => setInitialCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - Sticky preview & actions */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              <Card className="border-camouflage-green-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <div className="w-full aspect-square rounded-lg overflow-hidden">
                        {imagePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 bg-white">
                            <Tag className="h-14 w-14 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => onImageChange(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-camouflage-green-700 file:text-white hover:file:bg-camouflage-green-800"
                        />
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-2 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                            onClick={() => onImageChange(null)}
                          >
                            Eliminar imagen
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-camouflage-green-900">
                        {name || "Nombre del ítem"}
                      </div>
                      <div className="text-camouflage-green-700 font-medium">
                        ${priceToShow || "0.00"}
                      </div>
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
                    className="w-full bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white disabled:opacity-50"
                    disabled={isSubmitting}
                    onClick={() => doSubmit(false)}
                  >
                    {isSubmitting ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  className="w-full bg-camouflage-green-600/20 text-camouflage-green-800 hover:bg-camouflage-green-600/30 disabled:opacity-50"
                  disabled={isSubmitting}
                  onClick={() => doSubmit(true)}
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
              <Label className="text-sm text-gray-700">Bodega <span className="text-red-500">*</span></Label>
              <Select value={mwWarehouse} onValueChange={setMwWarehouse}>
                <SelectTrigger className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none">
                  <SelectValue placeholder="Selecciona una bodega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Principal">Principal</SelectItem>
                  <SelectItem value="Secundaria">Secundaria</SelectItem>
                  <SelectItem value="Almacén">Almacén</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Cantidad inicial <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  value={mwQtyInit}
                  onChange={(e) => setMwQtyInit(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Cantidad mínima</Label>
                <Input
                  type="number"
                  min="0"
                  value={mwQtyMin}
                  onChange={(e) => setMwQtyMin(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Cantidad máxima</Label>
                <Input
                  type="number"
                  min="0"
                  value={mwQtyMax}
                  onChange={(e) => setMwQtyMax(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white" onClick={saveWarehouseEntry}>
                Guardar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  )
}
