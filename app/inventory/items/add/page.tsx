"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Tag, ChevronsUpDown, AlertCircle, X, CheckCircle } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { Modal } from "@/components/ui/modal"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useCreateProducto } from "@/hooks/api/use-productos"
import { mapProductToCreateDto } from "@/lib/api/services/productos.service"
import { uploadProductImage, deleteProductImage, moveImageToProductFolder } from "@/lib/storage/supabase-client"
import { useCategorias } from "@/hooks/api/use-categorias"
import { useBodegas, bodegasKeys, useCreateBodega } from "@/hooks/api/use-bodegas"
import { useCamposExtra, camposExtraKeys, useCreateCampoExtra, mapTipoDatoFrontendToBackend } from "@/hooks/api/use-campos-extra"
import { useQueryClient } from "@tanstack/react-query"

export default function AddInventoryItemPage() {
  type ItemType = "product"

  const router = useRouter()
  const searchParams = useSearchParams()
  const createMutation = useCreateProducto()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: categorias = [], isLoading: isLoadingCategorias } = useCategorias(true)
  const { data: bodegas = [], isLoading: isLoadingBodegas } = useBodegas(true)
  const createBodegaMutation = useCreateBodega()
  const { data: extraFields = [], isLoading: isLoadingCamposExtra } = useCamposExtra(true) // Trae todos los campos activos (requeridos y opcionales)
  const createCampoExtraMutation = useCreateCampoExtra()
  const itemType: ItemType = "product"
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("Unidad")
  const [warehouse, setWarehouse] = useState("")
  const [selectedBodegaId, setSelectedBodegaId] = useState<string>("")
  const [basePrice, setBasePrice] = useState("")
  const [tax, setTax] = useState("0")
  const [totalPrice, setTotalPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [quantityMin, setQuantityMin] = useState("")
  const [quantityMax, setQuantityMax] = useState("")
  const [initialCost, setInitialCost] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isImageDragOver, setIsImageDragOver] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null) // URL de la imagen subida a Supabase
  const [code, setCode] = useState("")
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("none")
  const [description, setDescription] = useState("")
  const [selectedExtraFields, setSelectedExtraFields] = useState<string[]>([])
  const [extraFieldValues, setExtraFieldValues] = useState<Record<string, string>>({})
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  // Estados para tarjetas de éxito personalizadas
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  // Prefetch de rutas relevantes
  useEffect(() => {
    // Prefetch de la ruta de lista
    router.prefetch("/inventory/items")
  }, [router])
  
  // Verificar si viene de una edición exitosa (guardar y crear otro)
  useEffect(() => {
    const updated = searchParams?.get("updated")
    if (updated === "true") {
      setShowSuccessToast(true)
      setSuccessMessage("Producto actualizado exitosamente. Ahora puedes crear otro.")
      setTimeout(() => setShowSuccessToast(false), 5000)
      // Limpiar el parámetro de la URL sin recargar la página
      const newUrl = window.location.pathname
      window.history.replaceState({}, "", newUrl)
    }
  }, [searchParams])
  
  const [initialCostError, setInitialCostError] = useState(false)
  const [quantityError, setQuantityError] = useState(false)
  const [bodegaPrincipalError, setBodegaPrincipalError] = useState(false)
  const [basePriceError, setBasePriceError] = useState(false)
  const [totalPriceError, setTotalPriceError] = useState(false)

  // Estados para modal de nueva bodega
  const [isNewWarehouseModalOpen, setIsNewWarehouseModalOpen] = useState(false)
  const [newWarehouseData, setNewWarehouseData] = useState({
    name: "",
    location: "",
    observations: "",
  })

  // Estados para modal de nuevo campo extra
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false)
  const [newFieldData, setNewFieldData] = useState({
    name: "",
    type: "texto" as "texto" | "número" | "número decimal" | "fecha" | "si/no",
    defaultValue: "",
    description: "",
    isRequired: false,
  })

  // Efecto para inicializar campos extra requeridos automáticamente
  useEffect(() => {
    if (extraFields.length > 0) {
      const requiredFields = extraFields.filter(f => f.isRequired && f.isActive)
      const requiredFieldIds = requiredFields.map(f => f.id)
      
      setSelectedExtraFields(prev => {
        const newIds = requiredFieldIds.filter(id => !prev.includes(id))
        if (newIds.length > 0) {
          // Mostrar toast solo si hay campos nuevos agregados
          toast({
            title: "📋 Campos obligatorios agregados",
            description: `${newIds.length} campo(s) obligatorio(s) agregado(s) automáticamente.`,
          })
          return [...prev, ...newIds]
        }
        return prev
      })
      
      // Inicializar valores por defecto para campos requeridos
      setExtraFieldValues(prev => {
        const defaultValues: Record<string, string> = {}
        requiredFields.forEach(field => {
          if (field.defaultValue && prev[field.id] === undefined) {
            defaultValues[field.id] = field.defaultValue
          }
        })
        
        return Object.keys(defaultValues).length > 0 ? { ...prev, ...defaultValues } : prev
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraFields.length]) // Solo cuando cambie la cantidad de campos extra

  // Validación con Zod + RHF (controlamos el estado local y sincronizamos con RHF)
  const addSchema = z
    .object({
      type: z.enum(["product"]),
      name: z.string().trim().min(1, "El nombre es requerido"),
      unit: z.string().trim().min(1, "La unidad es requerida"),
      basePrice: z
        .string()
        .refine((v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) > 0), { message: "Precio base inválido" }),
      tax: z.string().refine((v) => v === "" || !isNaN(parseFloat(v)), { message: "Impuesto inválido" }),
      totalPrice: z
        .string()
        .refine((v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) > 0), { message: "Precio total inválido" }),
      quantity: z.string().refine((v) => v === "" || (!isNaN(parseInt(v)) && parseInt(v) >= 0), { message: "Cantidad inválida" }),
      initialCost: z.string().refine((v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), { message: "Costo inválido" }),
    })
    .superRefine((data, ctx) => {
      if (data.type === "product") {
        // Validar quantity solo si está presente y no está vacío
        if (data.quantity && data.quantity.trim() !== "") {
          const qty = parseInt(data.quantity)
          if (isNaN(qty) || qty < 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["quantity"], message: "Cantidad inválida" })
          }
        }
        // Validar initialCost solo si está presente y no está vacío
        if (data.initialCost && data.initialCost.trim() !== "") {
          const cost = parseFloat(data.initialCost)
          if (isNaN(cost) || cost < 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["initialCost"], message: "Costo inválido" })
          }
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
  const [mwWarehouseId, setMwWarehouseId] = useState<string>("")
  const [mwQtyInit, setMwQtyInit] = useState("")
  const [mwQtyMin, setMwQtyMin] = useState("")
  const [mwQtyMax, setMwQtyMax] = useState("")
  const [mwWarehouseError, setMwWarehouseError] = useState(false)
  const [mwQtyInitError, setMwQtyInitError] = useState(false)
  const [showWarehouseModalErrorToast, setShowWarehouseModalErrorToast] = useState(false)

  // Función helper para validar que un valor sea un entero (sin decimales)
  const validateIntegerInput = (value: string): string => {
    // Si está vacío, permitir (para poder borrar)
    if (value === "" || value === "-") return value
    
    // Rechazar si contiene punto o coma decimal
    if (value.includes(".") || value.includes(",")) {
      return value.replace(/[.,]/g, "")
    }
    
    // Si el valor es un número válido, asegurar que sea entero
    const num = parseFloat(value)
    if (!isNaN(num)) {
      return Math.floor(num).toString()
    }
    
    return value
  }

  const resetWarehouseModal = () => {
    setMwWarehouseId("")
    setMwQtyInit("")
    setMwQtyMin("")
    setMwQtyMax("")
    setMwWarehouseError(false)
    setMwQtyInitError(false)
    setShowWarehouseModalErrorToast(false)
  }
  const saveWarehouseEntry = () => {
    // Resetear errores
    setMwWarehouseError(false)
    setMwQtyInitError(false)
    setShowWarehouseModalErrorToast(false)

    // Validar que exista una bodega principal configurada
    if (!selectedBodegaId) {
      toast({
        title: "⚠️ Bodega principal requerida",
        description: "Primero debes seleccionar una bodega principal antes de agregar bodegas adicionales.",
        variant: "destructive",
      })
      return
    }

    // Validar que se haya seleccionado una bodega
    if (!mwWarehouseId) {
      setMwWarehouseError(true)
      setShowWarehouseModalErrorToast(true)
      setTimeout(() => setShowWarehouseModalErrorToast(false), 5000)
      return
    }

    // Validar cantidad inicial - verificar que no tenga decimales
    if (mwQtyInit && (mwQtyInit.includes(".") || mwQtyInit.includes(","))) {
      setMwQtyInitError(true)
      toast({
        title: "⚠️ Cantidad inválida",
        description: "La cantidad inicial debe ser un número entero (sin decimales).",
        variant: "destructive",
      })
      return
    }
    const init = parseInt(mwQtyInit || "")
    if (isNaN(init) || init < 0 || mwQtyInit.trim() === "") {
      setMwQtyInitError(true)
      setShowWarehouseModalErrorToast(true)
      setTimeout(() => setShowWarehouseModalErrorToast(false), 5000)
      return
    }

    // Validar que la bodega seleccionada no sea la bodega principal
    if (selectedBodegaId && mwWarehouseId === selectedBodegaId) {
      const bodegaPrincipal = bodegas.find(b => b.id === selectedBodegaId)
      toast({
        title: "⚠️ Bodega ya configurada",
        description: `La bodega "${bodegaPrincipal?.nombre || "seleccionada"}" ya está configurada como bodega principal. No puedes agregar la misma bodega como adicional. Por favor, selecciona una bodega diferente.`,
        variant: "destructive",
      })
      return
    }

    // Validar que no se dupliquen bodegas adicionales
    const bodega = bodegas.find(b => b.id === mwWarehouseId)
    if (!bodega) {
      toast({
        title: "❌ Error",
        description: "No se pudo encontrar la bodega seleccionada.",
        variant: "destructive",
      })
      return
    }

    // Validar que la bodega no esté ya agregada en inventoryByWarehouse
    if (inventoryByWarehouse.some(w => w.warehouse === bodega.nombre)) {
      toast({
        title: "⚠️ Bodega duplicada",
        description: `La bodega "${bodega.nombre}" ya está agregada en la lista de bodegas adicionales. No puedes agregar la misma bodega dos veces.`,
        variant: "destructive",
      })
      return
    }

    // Si llegamos aquí, las validaciones básicas pasaron, limpiar errores
    setMwWarehouseError(false)
    setMwQtyInitError(false)

    // Validar que cantidad mínima y máxima sean enteros si están definidas
    if (mwQtyMin && (mwQtyMin.includes(".") || mwQtyMin.includes(","))) {
      toast({
        title: "⚠️ Cantidad mínima inválida",
        description: "La cantidad mínima debe ser un número entero (sin decimales).",
        variant: "destructive",
      })
      return
    }
    if (mwQtyMax && (mwQtyMax.includes(".") || mwQtyMax.includes(","))) {
      toast({
        title: "⚠️ Cantidad máxima inválida",
        description: "La cantidad máxima debe ser un número entero (sin decimales).",
        variant: "destructive",
      })
      return
    }

    const minV = mwQtyMin ? parseInt(mwQtyMin) : undefined
    const maxV = mwQtyMax ? parseInt(mwQtyMax) : undefined

    // Validar que cantidad mínima no sea mayor que máxima si ambas están definidas
    if (minV !== undefined && maxV !== undefined && minV > maxV) {
      toast({
        title: "⚠️ Rangos inválidos",
        description: "La cantidad mínima no puede ser mayor que la cantidad máxima. Por favor, verifica los valores ingresados.",
        variant: "destructive",
      })
      return
    }

    // Validar que cantidad inicial esté dentro del rango si hay mínimo y máximo
    if (minV !== undefined && init < minV) {
      toast({
        title: "⚠️ Cantidad fuera de rango",
        description: `La cantidad inicial (${init}) no puede ser menor que la cantidad mínima (${minV}).`,
        variant: "destructive",
      })
      return
    }

    if (maxV !== undefined && init > maxV) {
      toast({
        title: "⚠️ Cantidad fuera de rango",
        description: `La cantidad inicial (${init}) no puede ser mayor que la cantidad máxima (${maxV}).`,
        variant: "destructive",
      })
      return
    }

    setInventoryByWarehouse((prev) => {
      // si ya existe la bodega, reemplazar
      const others = prev.filter((e) => e.warehouse !== bodega.nombre)
      return [...others, { warehouse: bodega.nombre, qtyInit: init, qtyMin: minV, qtyMax: maxV }]
    })

    toast({
      title: "✅ Bodega agregada",
      description: `La bodega "${bodega.nombre}" ha sido agregada exitosamente con ${init} unidades iniciales.`,
    })

    setIsWarehouseModalOpen(false)
    resetWarehouseModal()
  }

  const removeWarehouseEntry = (warehouseName: string) => {
    setInventoryByWarehouse((prev) => prev.filter((w) => w.warehouse !== warehouseName))
    toast({
      title: "✅ Bodega eliminada",
      description: `La bodega "${warehouseName}" ha sido eliminada de la lista.`,
    })
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

  // Función helper para renderizar el input de valor por defecto según el tipo
  const renderDefaultValueInput = (type: string, value: string, onChange: (value: string) => void) => {
    switch (type) {
      case "texto":
        return (
          <Input
            type="text"
            placeholder="Valor por defecto del campo"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
      
      case "número":
        return (
          <Input
            type="number"
            placeholder="Valor por defecto del campo"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
      
      case "número decimal":
        return (
          <Input
            type="number"
            step="0.01"
            placeholder="Valor por defecto del campo"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
      
      case "fecha":
        const dateValue = value && value !== "" ? new Date(value) : null
        const isValidDate = dateValue && !isNaN(dateValue.getTime())
        return (
          <DatePicker
            value={isValidDate ? dateValue : null}
            onChange={(date) => onChange(date ? date.toISOString().split('T')[0] : "")}
            placeholder="Seleccionar fecha por defecto"
            className="border-camouflage-green-300 bg-white focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
      
      case "si/no":
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="border-camouflage-green-300 bg-white focus:border-camouflage-green-500 focus:ring-camouflage-green-500">
              <SelectValue placeholder="Seleccionar valor por defecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sí">Sí</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        )
      
      default:
        return (
          <Input
            type="text"
            placeholder="Valor por defecto del campo"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
    }
  }

  // Handlers para modal de nueva bodega
  const handleNewWarehouseInputChange = (field: keyof typeof newWarehouseData, value: string) => {
    setNewWarehouseData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveNewWarehouse = async () => {
    if (!newWarehouseData.name.trim()) {
      toast({
        title: "⚠️ Campo obligatorio",
        description: "El nombre de la bodega es obligatorio.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await createBodegaMutation.mutateAsync({
        nombre: newWarehouseData.name.trim(),
        direccion: newWarehouseData.location.trim() || null,
        observaciones: newWarehouseData.observations.trim() || null,
      })

      // Seleccionar automáticamente la bodega recién creada si no hay bodega principal
      if (!selectedBodegaId && response.data) {
        setSelectedBodegaId(response.data.id)
        const bodega = response.data
        setWarehouse(bodega.nombre)
      }

      setNewWarehouseData({ name: "", location: "", observations: "" })
      setIsNewWarehouseModalOpen(false)
    } catch (error) {
      console.error("Error al crear bodega:", error)
      // El error ya se maneja en el hook con toast
    }
  }

  const handleCancelNewWarehouse = () => {
    setNewWarehouseData({ name: "", location: "", observations: "" })
    setIsNewWarehouseModalOpen(false)
  }

  // Handlers para modal de nuevo campo extra
  const handleNewFieldInputChange = (field: keyof typeof newFieldData, value: string | boolean) => {
    setNewFieldData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveNewField = async () => {
    if (!newFieldData.name.trim()) {
      toast({
        title: "⚠️ Campo obligatorio",
        description: "El nombre del campo es obligatorio.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await createCampoExtraMutation.mutateAsync({
        nombre: newFieldData.name.trim(),
        tipoDato: mapTipoDatoFrontendToBackend(newFieldData.type),
        descripcion: newFieldData.description.trim() || null,
        valorPorDefecto: newFieldData.defaultValue.trim() || null,
        esRequerido: newFieldData.isRequired,
      })

      // Si es campo requerido, agregarlo automáticamente a la selección
      if (newFieldData.isRequired && response.data) {
        setSelectedExtraFields(prev => [...prev, response.data.id])
        if (newFieldData.defaultValue) {
          setExtraFieldValues(prev => ({
            ...prev,
            [response.data.id]: newFieldData.defaultValue
          }))
        }
      }

      setNewFieldData({ name: "", type: "texto", defaultValue: "", description: "", isRequired: false })
      setIsNewFieldModalOpen(false)
    } catch (error) {
      console.error("Error al crear campo extra:", error)
      // El error ya se maneja en el hook con toast
    }
  }

  const handleCancelNewField = () => {
    setNewFieldData({ name: "", type: "texto", defaultValue: "", description: "", isRequired: false })
    setIsNewFieldModalOpen(false)
  }

  // Función para campos adicionales
  const toggleExtraField = (fieldId: string) => {
    const field = extraFields.find(f => f.id === fieldId)
    if (!field) return

    // No permitir deseleccionar campos requeridos
    if (field.isRequired && field.isActive) {
      toast({
        title: "⚠️ Campo obligatorio",
        description: `El campo "${field.name}" es obligatorio y no puede ser removido.`,
        variant: "destructive",
      })
      return
    }

    setSelectedExtraFields(prev => {
      if (prev.includes(fieldId)) {
        // Remover campo
        setExtraFieldValues(prevValues => {
          const newValues = { ...prevValues }
          delete newValues[fieldId]
          return newValues
        })
        return prev.filter(id => id !== fieldId)
      } else {
        // Agregar campo con valor por defecto
        setExtraFieldValues(prevValues => ({
          ...prevValues,
          [fieldId]: field.defaultValue || ""
        }))
        return [...prev, fieldId]
      }
    })
  }

  const handleExtraFieldValueChange = (fieldId: string, value: string) => {
    setExtraFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  // Función para renderizar inputs de campos adicionales
  const renderExtraFieldInput = (field: any) => {
    const value = extraFieldValues[field.id] || ""
    
    switch (field.type) {
      case "texto":
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleExtraFieldValueChange(field.id, e.target.value)}
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
          />
        )
      
      case "número":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleExtraFieldValueChange(field.id, e.target.value)}
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
          />
        )
      
      case "número decimal":
        return (
          <Input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => handleExtraFieldValueChange(field.id, e.target.value)}
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
          />
        )
      
      case "fecha":
        return (
          <DatePicker
            value={value ? new Date(value) : null}
            onChange={(date) => handleExtraFieldValueChange(field.id, date ? date.toISOString().split('T')[0] : "")}
            placeholder="Seleccionar fecha"
            className="h-10"
          />
        )
      
      case "si/no":
        return (
          <Select value={value} onValueChange={(val) => handleExtraFieldValueChange(field.id, val)}>
            <SelectTrigger className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none">
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent className="rounded-3xl">
              <SelectItem value="Sí">Sí</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        )
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleExtraFieldValueChange(field.id, e.target.value)}
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
          />
        )
    }
  }

  const onImageChange = (file: File | null) => {
    // Si se está eliminando la imagen, limpiar todo
    if (!file) {
      // Si había una imagen subida, eliminarla de Supabase
      if (uploadedImageUrl) {
        deleteProductImage(uploadedImageUrl).catch((error) => {
          console.error("Error al eliminar imagen de Supabase:", error)
        })
      }
      setImageFile(null)
      setImagePreview(null)
      setUploadedImageUrl(null)
      return
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "⚠️ Archivo no válido",
        description: "Por favor, selecciona un archivo de imagen válido (JPG, PNG, etc.).",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "⚠️ Imagen muy grande",
        description: "La imagen no puede ser mayor a 5MB. Por favor, selecciona una imagen más pequeña.",
        variant: "destructive",
      })
      return
    }

    // Si había una imagen subida anteriormente, eliminarla
    if (uploadedImageUrl) {
      deleteProductImage(uploadedImageUrl).catch((error) => {
        console.error("Error al eliminar imagen anterior:", error)
      })
    }

    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    setUploadedImageUrl(null) // Resetear URL subida hasta que se suba nuevamente
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
      toast({
        title: "✅ Imagen cargada",
        description: "La imagen se ha cargado exitosamente.",
      })
    } else if (file) {
      toast({
        title: "⚠️ Archivo no válido",
        description: "Por favor, selecciona un archivo de imagen válido (JPG, PNG, etc.).",
        variant: "destructive",
      })
    }
  }

  const handleImageAreaClick = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        if (file.type.startsWith("image/")) {
          onImageChange(file)
          toast({
            title: "✅ Imagen cargada",
            description: "La imagen se ha cargado exitosamente.",
          })
        } else {
          toast({
            title: "⚠️ Archivo no válido",
            description: "Por favor, selecciona un archivo de imagen válido (JPG, PNG, etc.).",
            variant: "destructive",
          })
        }
      }
    }
    input.click()
  }

  const handleFormSubmit = async (data: any) => {
    // Aquí se ejecuta cuando la validación es exitosa
    await doSubmit(false)
  }

  const handleFormSubmitAndCreateAnother = async (data: any) => {
    // Aquí se ejecuta cuando la validación es exitosa y quiere crear otro
    await doSubmit(true)
  }

  const handleFormError = (errors: any) => {
    // Aquí se ejecuta cuando hay errores de validación
    // Verificar si hay error en nombre
    if (errors?.name) {
      toast({
        title: "⚠️ Nombre requerido",
        description: "El nombre del producto es obligatorio. Por favor, ingresa un nombre válido.",
        variant: "destructive",
      })
    } else if (errors?.unit) {
      toast({
        title: "⚠️ Unidad de medida requerida",
        description: "Debes seleccionar una unidad de medida para el producto.",
        variant: "destructive",
      })
    } else if (errors?.basePrice) {
      setBasePriceError(true)
      toast({
        title: "⚠️ Precio base inválido",
        description: "El precio base debe ser un número mayor a 0. Por favor, ingresa un valor válido.",
        variant: "destructive",
      })
    } else if (errors?.totalPrice) {
      setTotalPriceError(true)
      toast({
        title: "⚠️ Precio total inválido",
        description: "El precio total debe ser un número mayor a 0. Por favor, ingresa un valor válido.",
        variant: "destructive",
      })
    } else if (errors?.quantity) {
      setQuantityError(true)
      toast({
        title: "⚠️ Cantidad inicial inválida",
        description: "La cantidad inicial es obligatoria y debe ser un número entero mayor o igual a 0.",
        variant: "destructive",
      })
    } else if (errors?.initialCost) {
      setInitialCostError(true)
      toast({
        title: "⚠️ Costo inicial inválido",
        description: "El costo inicial es obligatorio y debe ser un número mayor o igual a 0. Por favor, ingresa un valor válido.",
        variant: "destructive",
      })
    } else {
      // Si hay otros errores no específicos, mostrar mensaje genérico pero descriptivo
      const errorFields = Object.keys(errors || {})
      if (errorFields.length > 0) {
        toast({
          title: "⚠️ Errores en el formulario",
          description: `Por favor, verifica los siguientes campos: ${errorFields.join(", ")}. Todos los campos marcados con * son obligatorios.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "⚠️ Error de validación",
          description: "Por favor, verifica que todos los campos requeridos estén completos y con valores válidos.",
          variant: "destructive",
        })
      }
    }
  }

  const doSubmit = async (createAnother: boolean) => {
    // Resetear todos los errores
    setInitialCostError(false)
    setQuantityError(false)
    setBodegaPrincipalError(false)
    setBasePriceError(false)
    setTotalPriceError(false)
    setShowErrorToast(false)

    // Validar nombre
    if (!name.trim()) {
      toast({
        title: "⚠️ Campo requerido",
        description: "El nombre del producto es obligatorio.",
        variant: "destructive",
      })
      return
    }

    // Validar precio base
    const basePriceValue = parseFloat(basePrice || "0")
    if (!basePrice || basePrice.trim() === "" || isNaN(basePriceValue) || basePriceValue <= 0) {
      setBasePriceError(true)
      toast({
        title: "⚠️ Precio base inválido",
        description: "El precio base debe ser un número mayor a 0.",
        variant: "destructive",
      })
      return
    }

    // Validar precio total
    const totalPriceValue = parseFloat(totalPrice || "0")
    if (!totalPrice || totalPrice.trim() === "" || isNaN(totalPriceValue) || totalPriceValue <= 0) {
      setTotalPriceError(true)
      toast({
        title: "⚠️ Precio total inválido",
        description: "El precio total debe ser un número mayor a 0.",
        variant: "destructive",
      })
      return
    }

    // Validar bodega principal
    if (!selectedBodegaId || selectedBodegaId.trim() === "") {
      setBodegaPrincipalError(true)
      toast({
        title: "⚠️ Bodega principal requerida",
        description: "La bodega principal es obligatoria. Por favor, selecciona una bodega principal antes de crear el producto.",
        variant: "destructive",
      })
      return
    }

    // Validar cantidad inicial
    // Verificar que no tenga decimales
    if (quantity && (quantity.includes(".") || quantity.includes(","))) {
      setQuantityError(true)
      toast({
        title: "⚠️ Cantidad inválida",
        description: "La cantidad inicial debe ser un número entero (sin decimales).",
        variant: "destructive",
      })
      return
    }
    const quantityValue = parseInt(quantity || "0")
    if (!quantity || quantity.trim() === "" || isNaN(quantityValue) || quantityValue < 0) {
      setQuantityError(true)
      toast({
        title: "⚠️ Cantidad inicial inválida",
        description: "La cantidad inicial es obligatoria y debe ser un número mayor o igual a 0.",
        variant: "destructive",
      })
      return
    }

    // Validar que cantidad mínima y máxima sean enteros si están definidas
    if (quantityMin && (quantityMin.includes(".") || quantityMin.includes(","))) {
      toast({
        title: "⚠️ Cantidad mínima inválida",
        description: "La cantidad mínima debe ser un número entero (sin decimales).",
        variant: "destructive",
      })
      return
    }
    if (quantityMax && (quantityMax.includes(".") || quantityMax.includes(","))) {
      toast({
        title: "⚠️ Cantidad máxima inválida",
        description: "La cantidad máxima debe ser un número entero (sin decimales).",
        variant: "destructive",
      })
      return
    }

    // Validar rangos de cantidad en bodega principal
    const quantityMinValue = quantityMin ? parseInt(quantityMin) : undefined
    const quantityMaxValue = quantityMax ? parseInt(quantityMax) : undefined

    if (quantityMinValue !== undefined && isNaN(quantityMinValue)) {
      toast({
        title: "⚠️ Cantidad mínima inválida",
        description: "La cantidad mínima debe ser un número válido mayor o igual a 0.",
        variant: "destructive",
      })
      return
    }

    if (quantityMaxValue !== undefined && isNaN(quantityMaxValue)) {
      toast({
        title: "⚠️ Cantidad máxima inválida",
        description: "La cantidad máxima debe ser un número válido mayor o igual a 0.",
        variant: "destructive",
      })
      return
    }

    // Validar que cantidad mínima no sea mayor que máxima
    if (quantityMinValue !== undefined && quantityMaxValue !== undefined && quantityMinValue > quantityMaxValue) {
      toast({
        title: "⚠️ Rangos inválidos",
        description: "La cantidad mínima no puede ser mayor que la cantidad máxima. Por favor, verifica los valores ingresados.",
        variant: "destructive",
      })
      return
    }

    // Validar que cantidad inicial esté dentro del rango
    if (quantityMinValue !== undefined && quantityValue < quantityMinValue) {
      toast({
        title: "⚠️ Cantidad fuera de rango",
        description: `La cantidad inicial (${quantityValue}) no puede ser menor que la cantidad mínima (${quantityMinValue}).`,
        variant: "destructive",
      })
      return
    }

    if (quantityMaxValue !== undefined && quantityValue > quantityMaxValue) {
      toast({
        title: "⚠️ Cantidad fuera de rango",
        description: `La cantidad inicial (${quantityValue}) no puede ser mayor que la cantidad máxima (${quantityMaxValue}).`,
        variant: "destructive",
      })
      return
    }

    // Validar costo inicial
    const initialCostValue = parseFloat(initialCost || "0")
    if (!initialCost || initialCost.trim() === "" || isNaN(initialCostValue) || initialCostValue < 0) {
      setInitialCostError(true)
      toast({
        title: "⚠️ Costo inicial inválido",
        description: "El costo inicial es obligatorio y debe ser un número mayor o igual a 0.",
        variant: "destructive",
      })
      return
    }

    // Validar que se haya seleccionado una bodega principal
    if (!selectedBodegaId) {
      setBodegaPrincipalError(true)
      toast({
        title: "⚠️ Bodega principal requerida",
        description: "Debes seleccionar una bodega principal para continuar con la creación del producto.",
        variant: "destructive",
      })
      return
    }

    // Asegurar que todos los campos requeridos estén seleccionados automáticamente
    const camposExtraRequeridos = extraFields.filter(field => field.isRequired && field.isActive)
    const camposRequeridosNoSeleccionados = camposExtraRequeridos.filter(field => !selectedExtraFields.includes(field.id))
    
    if (camposRequeridosNoSeleccionados.length > 0) {
      // Agregar automáticamente los campos requeridos que faltan
      const nuevosIds = camposRequeridosNoSeleccionados.map(f => f.id)
      setSelectedExtraFields(prev => [...prev, ...nuevosIds])
      
      // Inicializar valores por defecto si existen
      setExtraFieldValues(prev => {
        const defaultValues: Record<string, string> = {}
        camposRequeridosNoSeleccionados.forEach(field => {
          if (field.defaultValue && prev[field.id] === undefined) {
            defaultValues[field.id] = field.defaultValue
          }
        })
        return Object.keys(defaultValues).length > 0 ? { ...prev, ...defaultValues } : prev
      })
    }

    // Validar campos extra requeridos (verificar que tengan valores válidos)
    const missingRequiredFields: string[] = []
    
    camposExtraRequeridos.forEach((field) => {
      // Obtener el valor ingresado por el usuario (puede estar vacío)
      const userValue = extraFieldValues[field.id]?.trim() || ""
      // Si no hay valor del usuario, usar el defaultValue
      const defaultValue = field.defaultValue || ""
      const finalValue = userValue || defaultValue
      
      // Validar que el campo tenga un valor final (no vacío)
      // Si el usuario borró el valor por defecto y no ingresó uno nuevo, debe fallar
      // Pero si hay defaultValue, lo usamos como fallback
      if (!finalValue || finalValue.trim() === "") {
        missingRequiredFields.push(field.name)
      }
    })

    if (missingRequiredFields.length > 0) {
      setErrorMessage(`Los campos obligatorios deben tener un valor: ${missingRequiredFields.join(", ")}. Por favor, completa estos campos antes de guardar.`)
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Campos obligatorios incompletos",
        description: `Los campos obligatorios deben tener un valor: ${missingRequiredFields.join(", ")}. Por favor, completa estos campos antes de guardar.`,
        variant: "destructive",
      })
      return
    }

    // Validar campos extra opcionales seleccionados
    // Si un campo opcional está seleccionado, también debe tener un valor
    const camposOpcionalesSeleccionados = extraFields.filter(field => 
      !field.isRequired && 
      field.isActive && 
      selectedExtraFields.includes(field.id)
    )
    
    const missingOptionalFields: string[] = []
    
    camposOpcionalesSeleccionados.forEach((field) => {
      // Obtener el valor ingresado por el usuario (puede estar vacío)
      const userValue = extraFieldValues[field.id]?.trim() || ""
      // Si no hay valor del usuario, usar el defaultValue
      const defaultValue = field.defaultValue || ""
      const finalValue = userValue || defaultValue
      
      // Si el campo está seleccionado, debe tener un valor (no puede estar vacío)
      if (!finalValue || finalValue.trim() === "") {
        missingOptionalFields.push(field.name)
      }
    })

    if (missingOptionalFields.length > 0) {
      setErrorMessage(`Los campos opcionales seleccionados deben tener un valor: ${missingOptionalFields.join(", ")}. Por favor, completa estos campos o deselecciónalos.`)
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Campos opcionales incompletos",
        description: `Los campos opcionales seleccionados deben tener un valor: ${missingOptionalFields.join(", ")}. Por favor, completa estos campos o deselecciónalos.`,
        variant: "destructive",
      })
      return
    }

    // Validar unidad de medida
    if (!unit || unit.trim() === "") {
      toast({
        title: "⚠️ Unidad de medida requerida",
        description: "Debes seleccionar una unidad de medida para el producto.",
        variant: "destructive",
      })
      return
    }

    try {
      // Subir imagen a Supabase si hay un archivo nuevo
      let finalImageUrl: string | undefined = undefined
      
      if (imageFile) {
        setIsUploadingImage(true)
        try {
          // Subir imagen a carpeta temporal (sin productId aún)
          finalImageUrl = await uploadProductImage(imageFile)
          setUploadedImageUrl(finalImageUrl)
          toast({
            title: "✅ Imagen subida",
            description: "La imagen se ha subido exitosamente.",
          })
        } catch (error: any) {
          console.error("Error al subir imagen:", error)
          setIsUploadingImage(false)
          toast({
            title: "❌ Error al subir imagen",
            description: error?.message || "No se pudo subir la imagen. Por favor, intenta nuevamente.",
            variant: "destructive",
          })
          return
        } finally {
          setIsUploadingImage(false)
        }
      }

      // Mapear campos extra seleccionados a formato del backend
      // Mapear campos extra seleccionados - usar valor del usuario o defaultValue si no hay valor del usuario
      const camposExtra = selectedExtraFields.map((fieldId) => {
        const field = extraFields.find(f => f.id === fieldId)
        if (!field) return null
        // Usar valor del usuario si existe (incluso si está vacío), sino usar defaultValue
        const userValue = extraFieldValues[fieldId]?.trim() || ""
        const defaultValue = field.defaultValue || ""
        const finalValue = userValue || defaultValue
        return {
          campoExtraId: fieldId,
          valor: String(finalValue),
        }
      }).filter((campo): campo is NonNullable<typeof campo> => campo !== null)

      // Asegurar que todos los campos requeridos estén incluidos
      camposExtraRequeridos.forEach((field) => {
        if (!camposExtra.find(c => c.campoExtraId === field.id)) {
          // Para campos requeridos, usar valor del usuario o defaultValue
          const userValue = extraFieldValues[field.id]?.trim() || ""
          const defaultValue = field.defaultValue || ""
          const finalValue = userValue || defaultValue
          camposExtra.push({
            campoExtraId: field.id,
            valor: String(finalValue),
          })
        }
      })

      // Mapear bodegas adicionales
      // Obtener el nombre de la bodega principal
      const bodegaPrincipal = bodegas.find(b => b.id === selectedBodegaId)
      const bodegasAdicionales = inventoryByWarehouse
        .filter((w) => bodegaPrincipal && w.warehouse !== bodegaPrincipal.nombre) // Excluir la bodega principal
        .map((w) => {
          // Buscar el ID de la bodega por nombre
          const bodega = bodegas.find((b) => b.nombre === w.warehouse)
          if (!bodega) return null
          return {
            bodegaId: bodega.id,
            cantidadInicial: w.qtyInit,
            cantidadMinima: w.qtyMin ?? null,
            cantidadMaxima: w.qtyMax ?? null,
          }
        })
        .filter((b): b is NonNullable<typeof b> => b !== null)

      // Crear DTO del backend
      const createDto = mapProductToCreateDto(
        {
          name: name.trim(),
          sku: code.trim() || undefined, // El backend lo genera si no se proporciona
          description: description || undefined,
          basePrice: parseFloat(basePrice || "0"),
          taxPercent: parseFloat(tax || "0"), // El mapper convierte a decimal
          cost: parseFloat(initialCost || "0"),
          unit,
          imageUrl: finalImageUrl || undefined, // URL de la imagen subida a Supabase
        },
        {
          categoriaId: selectedCategoriaId && selectedCategoriaId !== "none" ? selectedCategoriaId : null,
          bodegaPrincipalId: selectedBodegaId,
          cantidadInicial: quantityValue, // Siempre enviar como número (ya validado arriba)
          cantidadMinima: quantityMinValue !== undefined ? quantityMinValue : null,
          cantidadMaxima: quantityMaxValue !== undefined ? quantityMaxValue : null,
          bodegasAdicionales: bodegasAdicionales.length > 0 ? bodegasAdicionales : undefined,
        },
      )

      // Agregar campos extra si hay
      if (camposExtra.length > 0) {
        createDto.camposExtra = camposExtra
      }

      // Iniciar la creación (el hook maneja optimistic updates automáticamente)
      const createPromise = createMutation.mutateAsync(createDto)
      
      // Si es "Guardar y crear otro", esperar la creación, mostrar éxito y resetear
      if (createAnother) {
        // Esperar la creación antes de resetear
        const response = await createPromise
        
        // Si se creó el producto exitosamente y hay una imagen en carpeta temporal, moverla a la carpeta del producto
        if (response.data?.id && finalImageUrl && finalImageUrl.includes("/temp/")) {
          moveImageToProductFolder(finalImageUrl, response.data.id)
            .then((newImageUrl) => {
              setUploadedImageUrl(newImageUrl)
            })
            .catch((error) => {
              console.error("Error al mover imagen a carpeta del producto:", error)
            })
        }
        
        // Guardar el nombre del producto para el mensaje de éxito
        const productName = name.trim()
        
        // Resetear formulario
        setName("")
        setUnit("Unidad")
        setWarehouse("")
        setSelectedBodegaId("")
        setBasePrice("")
        setTax("0")
        setTotalPrice("")
        setQuantity("")
        setQuantityMin("")
        setQuantityMax("")
        setInitialCost("")
        setImageFile(null)
        setImagePreview(null)
        setCode("")
        setSelectedCategoriaId("none")
        setDescription("")
        setInventoryByWarehouse([])
        setSelectedExtraFields([])
        setExtraFieldValues({})
        
        // Mostrar tarjeta de éxito DESPUÉS de resetear el formulario
        setSuccessMessage(`Producto "${productName}" creado exitosamente. Puedes crear otro producto ahora.`)
        setShowSuccessToast(true)
        setTimeout(() => setShowSuccessToast(false), 5000)
        
        return
      }
      
      // Para "Guardar": navegar optimísticamente a la lista
      router.replace("/inventory/items")
      
      // Mover imagen en background si es necesario
      createPromise
        .then((response) => {
          if (response.data?.id && finalImageUrl && finalImageUrl.includes("/temp/")) {
            return moveImageToProductFolder(finalImageUrl, response.data.id)
          }
        })
        .catch((error) => {
          console.error("Error al mover imagen a carpeta del producto:", error)
        })
    } catch (error: any) {
      // Los errores ya se manejan en el hook, pero agregar toast adicional si es necesario
      console.error("Error al crear producto:", error)
      
      // Verificar si es un error de validación del backend
      if (error?.response?.data?.message) {
        toast({
          title: "❌ Error al crear producto",
          description: error.response.data.message || "Ha ocurrido un error al intentar crear el producto. Por favor, verifica los datos e intenta nuevamente.",
          variant: "destructive",
        })
      } else if (error?.message) {
        toast({
          title: "❌ Error al crear producto",
          description: error.message || "Ha ocurrido un error al intentar crear el producto. Por favor, verifica los datos e intenta nuevamente.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "❌ Error al crear producto",
          description: "Ha ocurrido un error inesperado al intentar crear el producto. Por favor, verifica los datos e intenta nuevamente.",
          variant: "destructive",
        })
      }
      return
    }

      // La navegación y reset ya se manejan arriba
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-camouflage-green-900">Nuevo ítem de venta</h1>
            <p className="mt-1 max-w-3xl text-camouflage-green-600">
              Crea tus productos inventariables para registrar en tus ventas.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left - Form */}
          <div className="space-y-6 lg:col-span-2">

            {/* Información general */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Información general</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      placeholder="Nombre del producto"
                      className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                        errors?.name ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700" htmlFor="code">
                      Código del producto
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
                    <Select 
                      value={selectedCategoriaId || undefined} 
                      onValueChange={(value) => setSelectedCategoriaId(value || "")} 
                      disabled={isLoadingCategorias}
                    >
                      <SelectTrigger className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none">
                        <SelectValue placeholder={isLoadingCategorias ? "Cargando categorías..." : "Selecciona una categoría"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-3xl">
                        <SelectItem value="none">Sin categoría</SelectItem>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nombre}
                          </SelectItem>
                        ))}
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
                        if (!v || v.trim() === "") {
                          toast({
                            title: "⚠️ Unidad requerida",
                            description: "Debes seleccionar una unidad de medida para el producto.",
                            variant: "destructive",
                          })
                          return
                        }
                        setUnit(v)
                        setValue("unit", v, { shouldValidate: true })
                      }}
                    >
                      <SelectTrigger className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none ${
                        errors?.unit ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                      }`}>
                        <SelectValue placeholder="Selecciona una unidad" />
                      </SelectTrigger>
                      <SelectContent side="bottom" align="start" avoidCollisions={false} className="rounded-3xl">
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
                    placeholder="Descripción del producto"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-camouflage-green-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:ring-offset-0"
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
                      onChange={(e) => {
                        handleBaseOrTaxChange(e.target.value, tax)
                        setBasePriceError(false)
                      }}
                      placeholder="0.00"
                      className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                        basePriceError || errors?.basePrice ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                      }`}
                    />
                  </div>
                  <div className="pb-3 text-center text-gray-400">+</div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Impuesto</Label>
                    <Select value={tax} onValueChange={(v) => handleBaseOrTaxChange(basePrice, v)}>
                      <SelectTrigger className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none">
                        <SelectValue placeholder="Ninguno (0%)" />
                      </SelectTrigger>
                      <SelectContent className="rounded-3xl">
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
                      onChange={(e) => {
                        handleTotalChange(e.target.value)
                        setTotalPriceError(false)
                      }}
                      placeholder="0.00"
                      className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                        totalPriceError || errors?.totalPrice ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                      }`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalle de Inventario */}
            <Card className="border-camouflage-green-200">
                <CardHeader>
                  <CardTitle className="text-camouflage-green-900">Detalle de Inventario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-camouflage-green-700">
                    Distribuye y controla las cantidades de tus productos en diferentes lugares.
                  </p>
                  {/* Bodega principal */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">
                      Bodega principal <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={selectedBodegaId} 
                      onValueChange={(bodegaId) => {
                        if (bodegaId === "__create_new__") {
                          setIsNewWarehouseModalOpen(true)
                          return
                        }
                        setSelectedBodegaId(bodegaId)
                        setBodegaPrincipalError(false)
                        const bodega = bodegas.find(b => b.id === bodegaId)
                        setWarehouse(bodega?.nombre || "")
                      }}
                      disabled={isLoadingBodegas}
                    >
                      <SelectTrigger className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none ${
                        bodegaPrincipalError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                      }`}>
                        <SelectValue placeholder={isLoadingBodegas ? "Cargando bodegas..." : "Selecciona una bodega principal"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-3xl">
                        {bodegas.map((bodega) => (
                          <SelectItem key={bodega.id} value={bodega.id}>
                            {bodega.nombre}
                          </SelectItem>
                        ))}
                        <SelectSeparator className="bg-gray-200" />
                        <SelectItem
                          value="__create_new__"
                          className="text-camouflage-green-700 font-medium hover:!bg-camouflage-green-50 focus:!bg-camouflage-green-50 data-[highlighted]:!bg-camouflage-green-50"
                        >
                          <Plus className="mr-2 h-4 w-4 inline" />
                          Crear nueva bodega
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Cantidad inicial en bodega principal */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700" htmlFor="quantity">
                      Cantidad inicial en bodega principal <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="1"
                      value={quantity}
                      onChange={(e) => {
                        const value = validateIntegerInput(e.target.value)
                        setQuantity(value)
                        setValue("quantity", value, { shouldValidate: true })
                        setQuantityError(false)
                      }}
                      placeholder="0"
                      className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                        quantityError || errors?.quantity ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                      }`}
                    />
                  </div>
                  {/* Cantidad mínima y máxima en bodega principal */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700" htmlFor="quantityMin">
                        Cantidad mínima
                      </Label>
                      <Input
                        id="quantityMin"
                        type="number"
                        step="1"
                        min="0"
                        value={quantityMin}
                        onChange={(e) => setQuantityMin(validateIntegerInput(e.target.value))}
                        placeholder="Opcional"
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-camouflage-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700" htmlFor="quantityMax">
                        Cantidad máxima
                      </Label>
                      <Input
                        id="quantityMax"
                        type="number"
                        step="1"
                        min="0"
                        value={quantityMax}
                        onChange={(e) => setQuantityMax(validateIntegerInput(e.target.value))}
                        placeholder="Opcional"
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-camouflage-green-500"
                      />
                    </div>
                  </div>
                  {/* Lista de bodegas agregadas */}
                  {inventoryByWarehouse.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-camouflage-green-200">
                      <div className="grid grid-cols-5 bg-camouflage-green-50/50 px-4 py-2 text-sm font-semibold text-camouflage-green-800">
                        <div>Bodega</div>
                        <div className="text-right">Cant. inicial</div>
                        <div className="text-right">Cant. mínima</div>
                        <div className="text-right">Cant. máxima</div>
                        <div className="text-center">Acciones</div>
                      </div>
                      <div>
                        {inventoryByWarehouse.map((w) => (
                          <div
                            key={w.warehouse}
                            className="grid grid-cols-5 border-t border-camouflage-green-100 px-4 py-2 text-sm items-center"
                          >
                            <div className="text-camouflage-green-900">{w.warehouse}</div>
                            <div className="text-right">{w.qtyInit}</div>
                            <div className="text-right">{w.qtyMin ?? "-"}</div>
                            <div className="text-right">{w.qtyMax ?? "-"}</div>
                            <div className="text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeWarehouseEntry(w.warehouse)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Eliminar bodega"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
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
                      onClick={() => {
                        if (!selectedBodegaId) {
                          toast({
                            title: "⚠️ Bodega principal requerida",
                            description: "Primero debes seleccionar una bodega principal antes de agregar bodegas adicionales.",
                            variant: "destructive",
                          })
                          return
                        }
                        setIsWarehouseModalOpen(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Agregar bodega
                    </Button>
                  </div>
                </CardContent>
              </Card>


             {/* Campos adicionales */}
             <Card className="border-camouflage-green-200">
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Campos adicionales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-camouflage-green-700">
                  Configura los campos adicionales que quieres incluir en este ítem.
                </p>
                
                {/* Dropdown con campos adicionales */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Seleccionar campos adicionales</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between rounded-lg border-gray-300 h-10"
                      >
                        {selectedExtraFields.length > 0
                          ? `${selectedExtraFields.length} campos seleccionados`
                          : "Seleccionar campos adicionales..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full max-h-60 overflow-y-auto rounded-lg border bg-white p-3 shadow-lg" side="bottom" align="start">
                      {isLoadingCamposExtra ? (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">
                          Cargando campos adicionales...
                        </div>
                      ) : extraFields.filter(field => field.isActive && !field.isRequired).length > 0 ? (
                        <>
                          {/* Mostrar campos requeridos primero (solo lectura) */}
                          {extraFields.filter(field => field.isRequired && field.isActive).length > 0 && (
                            <>
                              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50 rounded-md mb-2">
                                Campos obligatorios
                              </div>
                              {extraFields.filter(field => field.isRequired && field.isActive).map((field) => (
                                <div
                                  key={field.id}
                                  className="flex items-center gap-5 rounded-md px-3 py-1 bg-gray-50 opacity-75"
                                >
                                  <Checkbox
                                    id={`field-${field.id}`}
                                    checked={true}
                                    disabled={true}
                                    className="h-4 w-4"
                                  />
                                  <label
                                    htmlFor={`field-${field.id}`}
                                    className="flex-1 text-sm text-gray-700 cursor-not-allowed"
                                  >
                                    {field.name} <span className="text-red-500">*</span>
                                  </label>
                                  <span className="text-xs text-gray-400 capitalize">{field.type}</span>
                                </div>
                              ))}
                              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50 rounded-md my-2">
                                Campos opcionales
                              </div>
                            </>
                          )}
                          {/* Campos opcionales */}
                          {extraFields.filter(field => field.isActive && !field.isRequired).map((field) => (
                            <div
                              key={field.id}
                              className="flex items-center gap-5 rounded-md px-3 py-1 hover:bg-gray-100"
                            >
                              <Checkbox
                                id={`field-${field.id}`}
                                checked={selectedExtraFields.includes(field.id)}
                                onCheckedChange={() => toggleExtraField(field.id)}
                                className="h-4 w-4"
                              />
                              <label
                                htmlFor={`field-${field.id}`}
                                className="flex-1 cursor-pointer text-sm text-gray-700"
                              >
                                {field.name}
                              </label>
                              <span className="text-xs text-gray-400 capitalize">{field.type}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 mt-2 pt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full justify-start text-camouflage-green-700 font-medium hover:bg-camouflage-green-50"
                              onClick={() => {
                                setIsNewFieldModalOpen(true)
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Crear nuevo campo
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="px-3 py-4 text-center text-sm text-gray-500 mb-2">
                            No hay campos adicionales opcionales disponibles
                          </div>
                          <div className="border-t border-gray-200 pt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full justify-start text-camouflage-green-700 font-medium hover:bg-camouflage-green-50"
                              onClick={() => {
                                setIsNewFieldModalOpen(true)
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Crear nuevo campo
                            </Button>
                          </div>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Mostrar campos requeridos primero (no se pueden deseleccionar) */}
                {extraFields.filter(f => f.isRequired && f.isActive).length > 0 && (
                  <div className="space-y-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-camouflage-green-700">
                      Campos obligatorios
                    </div>
                    {extraFields
                      .filter(f => f.isRequired && f.isActive)
                      .map((field) => {
                        return (
                          <div key={field.id} className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              {field.name} <span className="text-red-500">*</span>
                            </Label>
                            {renderExtraFieldInput(field)}
                          </div>
                        )
                      })}
                  </div>
                )}

                {/* Campos adicionales editables (opcionales) */}
                {selectedExtraFields.filter(fieldId => {
                  const field = extraFields.find(f => f.id === fieldId)
                  return field && !field.isRequired
                }).length > 0 && (
                  <div className="space-y-4">
                    {extraFields.filter(f => f.isRequired && f.isActive).length > 0 && (
                      <div className="text-xs font-semibold uppercase tracking-wider text-camouflage-green-700 mt-4">
                        Campos opcionales
                      </div>
                    )}
                    {selectedExtraFields
                      .filter(fieldId => {
                        const field = extraFields.find(f => f.id === fieldId)
                        return field && !field.isRequired
                      })
                      .map((fieldId) => {
                        const field = extraFields.find(f => f.id === fieldId)
                        if (!field) return null
                        
                        return (
                          <div key={fieldId} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium text-gray-700">
                                {field.name}
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExtraField(fieldId)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                              >
                                ×
                              </Button>
                            </div>
                            {renderExtraFieldInput(field)}
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Costo */}
            <Card className="border-camouflage-green-200">
              <CardHeader>
                <CardTitle className="text-camouflage-green-900">Costo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-sm space-y-2">
                  <Label className="text-sm text-gray-700" htmlFor="initialCost">
                    Costo inicial <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="initialCost"
                    type="number"
                    step="0.01"
                    value={initialCost}
                    onChange={(e) => {
                      const value = e.target.value
                      setInitialCost(value)
                      setValue("initialCost", value, { shouldValidate: true })
                      setInitialCostError(false)
                    }}
                    placeholder="0.00"
                    className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                      initialCostError || errors?.initialCost ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                    }`}
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
                          disabled={isUploadingImage}
                          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-camouflage-green-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-camouflage-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {isUploadingImage && (
                          <div className="text-sm text-camouflage-green-600 flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-camouflage-green-300 border-t-camouflage-green-600"></div>
                            Subiendo imagen...
                          </div>
                        )}
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              onImageChange(null)
                              toast({
                                title: "✅ Imagen eliminada",
                                description: "La imagen ha sido eliminada exitosamente.",
                              })
                            }}
                            disabled={isUploadingImage}
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
                        Producto
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
                    onClick={() => {
                      if (name || basePrice || quantity || description || selectedBodegaId || selectedExtraFields.length > 0) {
                        // Si hay datos ingresados, mostrar confirmación
                        const confirmCancel = window.confirm("¿Estás seguro de que deseas cancelar? Se perderán todos los datos ingresados.")
                        if (confirmCancel) {
                          router.push("/inventory/items")
                        }
                      } else {
                        router.push("/inventory/items")
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={createMutation.isPending || isUploadingImage}
                    onClick={handleSubmit(handleFormSubmit, (errors) => handleFormError(errors))}
                  >
                    {createMutation.isPending || isUploadingImage ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={createMutation.isPending || isUploadingImage}
                    onClick={handleSubmit(handleFormSubmitAndCreateAnother, (errors) => handleFormError(errors))}
                >
                  {createMutation.isPending || isUploadingImage ? "Guardando..." : "Guardar y crear otro"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal Agregar Bodega */}
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
              <Select 
                value={mwWarehouseId || undefined} 
                onValueChange={(value) => {
                  setMwWarehouseId(value)
                  setMwWarehouseError(false)
                }}
                disabled={isLoadingBodegas}
              >
                <SelectTrigger className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none ${
                  mwWarehouseError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                }`}>
                  <SelectValue placeholder={isLoadingBodegas ? "Cargando bodegas..." : "Selecciona una bodega"} />
                </SelectTrigger>
                <SelectContent className="rounded-3xl">
                  {(() => {
                    const bodegasDisponibles = bodegas.filter((bodega) => {
                      // Excluir la bodega principal si está seleccionada
                      if (selectedBodegaId && bodega.id === selectedBodegaId) {
                        return false
                      }
                      // Excluir bodegas que ya están en inventoryByWarehouse
                      return !inventoryByWarehouse.some(w => w.warehouse === bodega.nombre)
                    })

                    if (bodegasDisponibles.length === 0) {
                      return (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">
                          No hay bodegas disponibles para agregar
                        </div>
                      )
                    }

                    return bodegasDisponibles.map((bodega) => (
                      <SelectItem key={bodega.id} value={bodega.id}>
                        {bodega.nombre}
                      </SelectItem>
                    ))
                  })()}
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
                  step="1"
                  min="0"
                  value={mwQtyInit}
                  onChange={(e) => {
                    setMwQtyInit(validateIntegerInput(e.target.value))
                    setMwQtyInitError(false)
                  }}
                  className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                    mwQtyInitError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                  }`}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Cantidad mínima</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={mwQtyMin}
                  onChange={(e) => setMwQtyMin(validateIntegerInput(e.target.value))}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Cantidad máxima</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={mwQtyMax}
                  onChange={(e) => setMwQtyMax(validateIntegerInput(e.target.value))}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={saveWarehouseEntry}
              >
                Guardar
              </Button>
            </div>
          </div>
        </Modal>

      {/* Mensaje flotante de error para modal de bodega */}
      {showWarehouseModalErrorToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              {mwWarehouseError && mwQtyInitError 
                ? "Debes seleccionar una bodega y completar la cantidad inicial"
                : mwWarehouseError
                ? "Debes seleccionar una bodega para continuar"
                : "La cantidad inicial es requerida y debe ser un número válido mayor o igual a 0"}
            </p>
          </div>
        </div>
      )}

      {/* Modal para nueva bodega */}
      <Modal isOpen={isNewWarehouseModalOpen} onClose={handleCancelNewWarehouse} title="Nueva Bodega" size="lg">
        <div className="space-y-4">
          <div className="space-y-1 pt-2.5">
            <Label htmlFor="warehouse-name" className="font-medium text-camouflage-green-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="warehouse-name"
              type="text"
              placeholder="Ingresa el nombre de la bodega"
              value={newWarehouseData.name}
              onChange={(e) => handleNewWarehouseInputChange("name", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse-location" className="font-medium text-camouflage-green-700">
              Dirección
            </Label>
            <Input
              id="warehouse-location"
              type="text"
              placeholder="Ingresa la dirección de la bodega"
              value={newWarehouseData.location}
              onChange={(e) => handleNewWarehouseInputChange("location", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse-observations" className="font-medium text-camouflage-green-700">
              Observaciones
            </Label>
            <Textarea
              id="warehouse-observations"
              placeholder="Ingresa observaciones adicionales sobre la bodega"
              value={newWarehouseData.observations}
              onChange={(e) => handleNewWarehouseInputChange("observations", e.target.value)}
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
              onClick={handleCancelNewWarehouse}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNewWarehouse}
              variant="primary"
              disabled={createBodegaMutation.isPending}
            >
              {createBodegaMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para nuevo campo extra */}
      <Modal isOpen={isNewFieldModalOpen} onClose={handleCancelNewField} title="Nuevo Campo">
        <div className="space-y-4">
          <div className="space-y-1 pt-2.5">
            <Label htmlFor="field-name" className="font-medium text-camouflage-green-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="field-name"
              type="text"
              placeholder="Ej: Color, Peso, Fecha de Vencimiento..."
              value={newFieldData.name}
              onChange={(e) => handleNewFieldInputChange("name", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-type" className="font-medium text-camouflage-green-700">
              Tipo de Campo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={newFieldData.type}
              onValueChange={(value) => handleNewFieldInputChange("type", value as typeof newFieldData.type)}
            >
              <SelectTrigger className="border-camouflage-green-300 bg-white focus:border-camouflage-green-500 focus:ring-camouflage-green-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="texto">Texto</SelectItem>
                <SelectItem value="número">Número</SelectItem>
                <SelectItem value="número decimal">Número Decimal</SelectItem>
                <SelectItem value="fecha">Fecha</SelectItem>
                <SelectItem value="si/no">Si/No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-default" className="font-medium text-camouflage-green-700">
              Valor por Defecto
            </Label>
            {renderDefaultValueInput(
              newFieldData.type,
              newFieldData.defaultValue,
              (value) => handleNewFieldInputChange("defaultValue", value)
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-description" className="font-medium text-camouflage-green-700">
              Descripción
            </Label>
            <Textarea
              id="field-description"
              placeholder="Descripción del campo adicional"
              value={newFieldData.description}
              onChange={(e) => handleNewFieldInputChange("description", e.target.value)}
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="field-required"
              checked={newFieldData.isRequired}
              onCheckedChange={(checked) => handleNewFieldInputChange("isRequired", checked as boolean)}
            />
            <Label htmlFor="field-required" className="text-sm font-medium text-camouflage-green-700">
              Campo requerido
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelNewField}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNewField}
              variant="primary"
              disabled={createCampoExtraMutation.isPending}
            >
              {createCampoExtraMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast de error de validación personalizado */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              {errorMessage || "Error, verifica los campos marcados en rojo para continuar"}
            </p>
          </div>
        </div>
      )}
      
      {/* Toast de éxito personalizado */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              {successMessage || "Producto creado exitosamente"}
            </p>
          </div>
        </div>
      )}
      
    </MainLayout>
  )
}
