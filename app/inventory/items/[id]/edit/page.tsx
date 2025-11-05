"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Tag, ArrowLeft, ChevronsUpDown, X, AlertCircle, Edit } from "lucide-react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useCallback, useRef } from "react"
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
import { ExtendedProduct } from "@/lib/types/items"
import { useProducto, useUpdateProducto, useProductoBodegas, useProductoCamposExtra, useAddProductoBodega, useUpdateProductoBodega, useDeleteProductoBodega, productoKeys } from "@/hooks/api/use-productos"
import { mapProductToUpdateDto, productosService } from "@/lib/api/services/productos.service"
import { uploadProductImage, deleteProductImage } from "@/lib/storage/supabase-client"
import { useCategorias } from "@/hooks/api/use-categorias"
import { useBodegas, bodegasKeys, useCreateBodega } from "@/hooks/api/use-bodegas"
import { useCamposExtra, camposExtraKeys, mapCampoExtraToFrontend, useCreateCampoExtra, mapTipoDatoFrontendToBackend } from "@/hooks/api/use-campos-extra"
import { useQueryClient } from "@tanstack/react-query"
import type { ProductoBodegaBackend, ProductoCampoExtraBackend } from "@/lib/api/types"

export default function EditInventoryItemPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Hooks para datos del backend
  const { data: product, isLoading, error } = useProducto(id)
  const { data: categorias = [], isLoading: isLoadingCategorias } = useCategorias(true)
  const { data: bodegas = [], isLoading: isLoadingBodegas } = useBodegas(true)
  const createBodegaMutation = useCreateBodega()
  const { data: extraFields = [], isLoading: isLoadingCamposExtra } = useCamposExtra(true)
  const createCampoExtraMutation = useCreateCampoExtra()
  const { data: productoBodegas = [], isLoading: isLoadingProductoBodegas, error: errorProductoBodegas } = useProductoBodegas(id)
  const { data: productoCamposExtra = [], isLoading: isLoadingProductoCamposExtra, error: errorProductoCamposExtra } = useProductoCamposExtra(id)
  
  // Mutations
  const updateMutation = useUpdateProducto()
  const addBodegaMutation = useAddProductoBodega()
  const updateBodegaMutation = useUpdateProductoBodega()
  const deleteBodegaMutation = useDeleteProductoBodega()

  // Estado de formulario (mismos campos del formulario avanzado de creación)
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("")
  const [selectedBodegaId, setSelectedBodegaId] = useState<string>("")
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("none")
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
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null) // URL original de la imagen del producto
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [selectedExtraFields, setSelectedExtraFields] = useState<string[]>([])
  const [extraFieldValues, setExtraFieldValues] = useState<Record<string, string>>({})
  
  // Estados de error
  const [initialCostError, setInitialCostError] = useState(false)
  const [quantityError, setQuantityError] = useState(false)
  const [quantityMinError, setQuantityMinError] = useState(false)
  const [quantityMaxError, setQuantityMaxError] = useState(false)
  const [bodegaPrincipalError, setBodegaPrincipalError] = useState(false)
  const [basePriceError, setBasePriceError] = useState(false)
  const [totalPriceError, setTotalPriceError] = useState(false)
  
  // Estados para tarjetas de error personalizadas
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  

  // Validación con Zod + RHF (controlamos el estado local y sincronizamos con RHF)
  const editSchema = z
    .object({
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
        if (!data.quantity || isNaN(parseInt(data.quantity)) || parseInt(data.quantity) < 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["quantity"], message: "Cantidad inválida" })
        }
        if (!data.initialCost || isNaN(parseFloat(data.initialCost)) || parseFloat(data.initialCost) < 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["initialCost"], message: "Costo inválido" })
      }
    })

  type EditFormSchema = z.infer<typeof editSchema>
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditFormSchema>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "",
      unit: "",
      basePrice: "",
      tax: "",
      totalPrice: "",
      quantity: "",
      initialCost: "",
    },
  })

  // Inventario por bodega (solo productos)
  type WarehouseEntry = {
    bodegaId: string
    bodegaNombre: string
    qtyInit: number
    qtyMin?: number | null
    qtyMax?: number | null
  }
  const [inventoryByWarehouse, setInventoryByWarehouse] = useState<WarehouseEntry[]>([])
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false)
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null)
  const [mwWarehouseId, setMwWarehouseId] = useState<string>("")
  const [mwQtyInit, setMwQtyInit] = useState("")
  const [mwQtyMin, setMwQtyMin] = useState("")
  const [mwQtyMax, setMwQtyMax] = useState("")
  const [mwWarehouseError, setMwWarehouseError] = useState(false)
  const [mwQtyInitError, setMwQtyInitError] = useState(false)
  const [isDeletingWarehouse, setIsDeletingWarehouse] = useState<Record<string, boolean>>({})
  const [isSavingBodega, setIsSavingBodega] = useState(false)
  
  // Estados para modal de nueva bodega
  const [isNewWarehouseModalOpen, setIsNewWarehouseModalOpen] = useState(false)
  const [newWarehouseData, setNewWarehouseData] = useState({
    name: "",
    location: "",
    observations: "",
  })
  
  // Estados para modal de nuevo campo extra
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false)
  const [isExtraFieldsPopoverOpen, setIsExtraFieldsPopoverOpen] = useState(false)
  const [newFieldData, setNewFieldData] = useState({
    name: "",
    type: "texto" as "texto" | "número" | "número decimal" | "fecha" | "si/no",
    defaultValue: "",
    description: "",
    isRequired: false,
  })
  
  // Función helper para validar que un valor sea un entero (sin decimales)
  const validateIntegerInput = (value: string): string => {
    if (value === "" || value === "-") return value
    if (value.includes(".") || value.includes(",")) {
      return value.replace(/[.,]/g, "")
    }
    const num = parseFloat(value)
    if (!isNaN(num)) {
      return Math.floor(num).toString()
    }
    return value
  }

  // Bandera para evitar reinicializaciones múltiples
  const isInitializedRef = useRef(false)
  const initializedProductIdRef = useRef<string | null>(null)
  
  // Ref para prevenir bucles en actualizaciones de precios
  const isUpdatingPriceRef = useRef(false)
  
  // Ref para prevenir bucles en carga de bodegas
  const isLoadingBodegasRef = useRef(false)
  const lastProcessedBodegasRef = useRef<string>("") // Rastrear último productoBodegas procesado
  const lastSelectedBodegaIdRef = useRef<string | null>(null) // Rastrear último selectedBodegaId establecido
  const isSettingBodegaPrincipalRef = useRef(false) // Flag para prevenir bucles al establecer bodega principal
  
  // Refs para prevenir bucles en campos extra
  const lastProcessedCamposExtraRef = useRef<string>("") // Rastrear último productoCamposExtra procesado
  const isProcessingExtraFieldsRef = useRef(false) // Flag para prevenir bucles al procesar campos extra

  // Obtener producto original del backend para tener categoriaId
  const [productoOriginal, setProductoOriginal] = useState<any>(null)
  
  // Estabilizar bodegaPrincipalId usando useMemo para evitar re-renders innecesarios
  const bodegaPrincipalIdFromProduct = useMemo(() => {
    return productoOriginal?.bodegaPrincipalId || null
  }, [productoOriginal?.bodegaPrincipalId])
  useEffect(() => {
    if (!id) return
    // Resetear si cambió el ID del producto
    if (initializedProductIdRef.current !== id) {
      isInitializedRef.current = false
      initializedProductIdRef.current = id
      setProductoOriginal(null)
      // Resetear refs cuando cambia el producto
      lastSelectedBodegaIdRef.current = null
      lastProcessedBodegasRef.current = ""
      isLoadingBodegasRef.current = false
      isSettingBodegaPrincipalRef.current = false
      lastProcessedCamposExtraRef.current = ""
      isProcessingExtraFieldsRef.current = false
    }
    
    // Solo cargar si no está ya cargado para este ID
    if (!productoOriginal || productoOriginal.id !== id) {
      import("@/lib/api/services/productos.service").then(({ productosService }) => {
        productosService.getProductoById(id).then((prod) => {
          setProductoOriginal(prod)
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Prefetch de rutas relevantes
  useEffect(() => {
    if (id) {
      // Prefetch de la ruta de detalle
      router.prefetch(`/inventory/items/${id}`)
      // Prefetch de la ruta de creación si es necesario
      router.prefetch(`/inventory/items/add`)
    }
  }, [id, router])

  // Inicializar formulario con datos del producto
  useEffect(() => {
    if (!product || !productoOriginal || !id) return
    if (isInitializedRef.current && initializedProductIdRef.current === id) return
    
    setName(product.name)
    setCode(product.sku)
    setDescription(product.description || "")
    setTotalPrice(String(product.price))
    setBasePrice(String((product as ExtendedProduct).basePrice ?? product.price))
    setTax(String((product as ExtendedProduct).taxPercent ?? 0))
    // NO usar product.stock aquí - es el stock total (suma de todas las bodegas)
    // La cantidad inicial de la bodega principal se establecerá cuando se carguen productoBodegas
    // setQuantity(String(product.stock)) // ❌ REMOVIDO - esto sumaba todas las bodegas
    setInitialCost(String(product.cost))
    setUnit((product as ExtendedProduct).unit ?? "Unidad")
    const productImageUrl = (product as ExtendedProduct).imageUrl ?? null
    setImagePreview(productImageUrl)
    setOriginalImageUrl(productImageUrl) // Guardar URL original para comparar después
    setUploadedImageUrl(productImageUrl) // Inicializar con la URL existente
    
    // Mapear categoriaId a nombre para el select
    const categoriaId = productoOriginal.categoriaId
    if (categoriaId) {
      setSelectedCategoriaId(categoriaId)
    } else {
      setSelectedCategoriaId("none")
    }
    
    // Establecer bodega principal desde productoOriginal.bodegaPrincipalId SOLO si no está ya establecido
    if (productoOriginal.bodegaPrincipalId && !selectedBodegaId && productoOriginal.bodegaPrincipalId !== lastSelectedBodegaIdRef.current) {
      lastSelectedBodegaIdRef.current = productoOriginal.bodegaPrincipalId
      setSelectedBodegaId(productoOriginal.bodegaPrincipalId)
    }
    
    isInitializedRef.current = true
    initializedProductIdRef.current = id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, productoOriginal, id])

  // Cargar bodegas existentes del producto (solo cuando cambia el producto)
  useEffect(() => {
    if (!productoBodegas || !id || !isInitializedRef.current) return
    if (initializedProductIdRef.current !== id) return
    if (isLoadingBodegasRef.current) return
    if (isSettingBodegaPrincipalRef.current) return // Prevenir ejecución si ya estamos estableciendo la bodega principal
    
    // Crear una firma única de productoBodegas para comparar
    const currentBodegasSignature = JSON.stringify(productoBodegas.map(b => ({
      id: b.bodegaId,
      principal: b.esPrincipal,
      qty: b.cantidadInicial
    })).sort((a, b) => a.id.localeCompare(b.id)))
    
    // Si ya procesamos este mismo conjunto de bodegas, no hacer nada
    if (lastProcessedBodegasRef.current === currentBodegasSignature) return
    
    isLoadingBodegasRef.current = true
    isSettingBodegaPrincipalRef.current = true
    
    try {
      // Identificar bodega principal usando esPrincipal
      const bodegaPrincipal = productoBodegas.find((b: ProductoBodegaBackend) => b.esPrincipal === true)
      
      // Determinar el ID de la bodega principal (prioridad: esPrincipal > bodegaPrincipalId del producto)
      const principalBodegaId = bodegaPrincipal?.bodegaId || bodegaPrincipalIdFromProduct
      
      // Solo establecer bodega principal si realmente necesita cambiar
      const targetBodegaId = principalBodegaId || null
      const currentBodegaId = selectedBodegaId || lastSelectedBodegaIdRef.current
      
      if (productoBodegas.length === 0) {
        setInventoryByWarehouse([])
        // Solo establecer si hay un target y es diferente al actual
        if (targetBodegaId && targetBodegaId !== currentBodegaId) {
          lastSelectedBodegaIdRef.current = targetBodegaId
          setSelectedBodegaId(targetBodegaId)
        }
        lastProcessedBodegasRef.current = currentBodegasSignature
        return
      }
      
      // Establecer bodega principal y sus cantidades
      // IMPORTANTE: Usar la cantidad inicial de la bodega principal específica, NO el stock total
      if (bodegaPrincipal && targetBodegaId) {
        // Si la bodega principal cambió o aún no se ha establecido la cantidad, actualizar
        if (targetBodegaId !== currentBodegaId || !quantity) {
          lastSelectedBodegaIdRef.current = targetBodegaId
          setSelectedBodegaId(targetBodegaId)
          // Usar cantidadInicial de la bodega principal, NO el stock total
          setQuantity(String(bodegaPrincipal.cantidadInicial))
          setQuantityMin(bodegaPrincipal.cantidadMinima?.toString() || "")
          setQuantityMax(bodegaPrincipal.cantidadMaxima?.toString() || "")
        } else if (targetBodegaId === currentBodegaId) {
          // Si es la misma bodega, asegurar que la cantidad esté correcta
          // Solo actualizar si la cantidad actual no coincide con la de la bodega principal
          const cantidadActual = quantity ? parseInt(quantity) : null
          if (cantidadActual !== bodegaPrincipal.cantidadInicial) {
            setQuantity(String(bodegaPrincipal.cantidadInicial))
          }
          if (quantityMin !== (bodegaPrincipal.cantidadMinima?.toString() || "")) {
            setQuantityMin(bodegaPrincipal.cantidadMinima?.toString() || "")
          }
          if (quantityMax !== (bodegaPrincipal.cantidadMaxima?.toString() || "")) {
            setQuantityMax(bodegaPrincipal.cantidadMaxima?.toString() || "")
          }
        }
      } else if (!bodegaPrincipal && bodegaPrincipalIdFromProduct && bodegaPrincipalIdFromProduct !== currentBodegaId) {
        // Si no hay bodega marcada como principal pero tenemos el ID del producto, establecerlo
        lastSelectedBodegaIdRef.current = bodegaPrincipalIdFromProduct
        setSelectedBodegaId(bodegaPrincipalIdFromProduct)
        // Buscar la bodega para obtener sus cantidades
        const bodegaConId = productoBodegas.find((b: ProductoBodegaBackend) => b.bodegaId === bodegaPrincipalIdFromProduct)
        if (bodegaConId) {
          // Usar cantidadInicial de la bodega específica, NO el stock total
          setQuantity(String(bodegaConId.cantidadInicial))
          setQuantityMin(bodegaConId.cantidadMinima?.toString() || "")
          setQuantityMax(bodegaConId.cantidadMaxima?.toString() || "")
        }
      }
      
      // Separar bodegas principales de adicionales
      // IMPORTANTE: Solo agregar a inventoryByWarehouse las bodegas que NO son principales
      // La bodega principal solo debe mostrarse en el dropdown de bodega principal
      const bodegasAdicionales = productoBodegas.filter((b: ProductoBodegaBackend) => {
        // Excluir si es marcada como principal
        if (b.esPrincipal === true) return false
        // Excluir si coincide con el ID de la bodega principal determinada arriba
        const principalIdToCheck = targetBodegaId || currentBodegaId
        if (principalIdToCheck && b.bodegaId === principalIdToCheck) return false
        return true
      })
      
      // Mapear solo bodegas adicionales a inventoryByWarehouse
      const bodegasAdicionalesMapeadas: WarehouseEntry[] = bodegasAdicionales.map((b: ProductoBodegaBackend) => ({
        bodegaId: b.bodegaId,
        bodegaNombre: b.bodegaNombre,
        qtyInit: b.cantidadInicial,
        qtyMin: b.cantidadMinima,
        qtyMax: b.cantidadMaxima,
      }))
      
      // Solo actualizar si hay cambios reales
      setInventoryByWarehouse(prev => {
        // Verificar si hay cambios comparando ambos arrays
        if (prev.length !== bodegasAdicionalesMapeadas.length) {
          return bodegasAdicionalesMapeadas
        }
        // Comparar cada elemento
        const hasChanges = prev.some((p, idx) => {
          const newItem = bodegasAdicionalesMapeadas[idx]
          if (!newItem) return true
          return p.bodegaId !== newItem.bodegaId || 
                 p.qtyInit !== newItem.qtyInit ||
                 p.qtyMin !== newItem.qtyMin ||
                 p.qtyMax !== newItem.qtyMax
        })
        return hasChanges ? bodegasAdicionalesMapeadas : prev
      })
      
      // Marcar como procesado
      lastProcessedBodegasRef.current = currentBodegasSignature
    } finally {
      setTimeout(() => {
        isLoadingBodegasRef.current = false
        isSettingBodegaPrincipalRef.current = false
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoBodegas, id, bodegaPrincipalIdFromProduct])

  // Cargar campos extra existentes del producto (solo cuando cambia el producto)
  useEffect(() => {
    if (!productoCamposExtra || !id || !isInitializedRef.current) return
    if (initializedProductIdRef.current !== id) return
    if (!extraFields.length) return // Esperar a que se carguen los campos extra
    if (isProcessingExtraFieldsRef.current) return // Prevenir ejecución concurrente
    
    // Crear una firma única de productoCamposExtra para comparar
    const currentCamposSignature = JSON.stringify(productoCamposExtra.map(ce => ({
      id: ce.campoExtraId,
      valor: ce.valor
    })).sort((a, b) => a.id.localeCompare(b.id)))
    
    // Si ya procesamos este mismo conjunto de campos, no hacer nada
    if (lastProcessedCamposExtraRef.current === currentCamposSignature) return
    
    isProcessingExtraFieldsRef.current = true
    
    try {
      // Asegurar que los campos requeridos siempre estén incluidos
      const requiredFieldIds = extraFields
        .filter(f => f.isRequired && f.isActive)
        .map(f => f.id)
      
      if (productoCamposExtra.length === 0) {
        // Si no hay campos extra del producto, al menos incluir los campos requeridos
        setSelectedExtraFields(requiredFieldIds)
        
        // Inicializar valores por defecto para campos requeridos
        const defaultValues: Record<string, string> = {}
        requiredFieldIds.forEach(fieldId => {
          const field = extraFields.find(f => f.id === fieldId)
          if (field?.defaultValue) {
            defaultValues[fieldId] = field.defaultValue
          }
        })
        setExtraFieldValues(defaultValues)
        
        lastProcessedCamposExtraRef.current = currentCamposSignature
        return
      }
      
      const camposExtraIds = productoCamposExtra.map((ce: ProductoCampoExtraBackend) => ce.campoExtraId)
      
      // Combinar campos del producto con campos requeridos (sin duplicados)
      const allSelectedFields = Array.from(new Set([...camposExtraIds, ...requiredFieldIds]))
      
      setSelectedExtraFields(allSelectedFields)
      
      // Cargar valores de productoCamposExtra, pero PRESERVAR valores que el usuario ya ingresó
      // Usar valores por defecto solo si el valor está vacío y no hay un valor ingresado por el usuario
      setExtraFieldValues(prev => {
        const valores: Record<string, string> = { ...prev } // Preservar valores existentes
        
        productoCamposExtra.forEach((ce: ProductoCampoExtraBackend) => {
          const campoExtra = extraFields.find(f => f.id === ce.campoExtraId)
          if (!campoExtra) return
          
          // Si el usuario ya ingresó un valor, preservarlo
          const valorUsuario = prev[ce.campoExtraId]
          if (valorUsuario && valorUsuario.trim() !== "") {
            valores[ce.campoExtraId] = valorUsuario
            return
          }
          
          // Si no hay valor del usuario, usar el valor del producto o el valor por defecto
          const valorProducto = ce.valor?.trim() || ""
          const valorPorDefecto = campoExtra.defaultValue || ""
          valores[ce.campoExtraId] = valorProducto || valorPorDefecto
        })
        
        // También asegurar que todos los campos seleccionados (incluyendo requeridos) tengan valores (usar defaults si no tienen)
        allSelectedFields.forEach((campoId) => {
          // Si ya tiene un valor (del usuario o del backend), no sobrescribirlo
          if (valores[campoId] && valores[campoId].trim() !== "") {
            return
          }
          
          const campoExtra = extraFields.find(f => f.id === campoId)
          if (campoExtra?.defaultValue) {
            valores[campoId] = campoExtra.defaultValue
          }
        })
        
        return valores
      })
      lastProcessedCamposExtraRef.current = currentCamposSignature
    } finally {
      setTimeout(() => {
        isProcessingExtraFieldsRef.current = false
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoCamposExtra, id, extraFields])

  // Asegurar que campos requeridos siempre estén seleccionados y tengan valores por defecto
  useEffect(() => {
    if (!extraFields.length || !isInitializedRef.current) return
    if (initializedProductIdRef.current !== id) return
    if (isProcessingExtraFieldsRef.current) return // Prevenir ejecución concurrente
    
    const requiredFields = extraFields.filter(f => f.isRequired && f.isActive)
    const requiredFieldIds = requiredFields.map(f => f.id)
    
    console.log("🔵 useEffect campos requeridos: requiredFieldIds=", requiredFieldIds)
    
    // Actualizar campos seleccionados para incluir requeridos (siempre asegurar que estén)
    setSelectedExtraFields(prev => {
      const newIds = requiredFieldIds.filter(id => !prev.includes(id))
      if (newIds.length === 0) {
        // Aun si no hay nuevos IDs, asegurar que todos los requeridos estén presentes
        const allRequiredPresent = requiredFieldIds.every(id => prev.includes(id))
        if (allRequiredPresent) return prev
        // Si faltan algunos, agregarlos
        return Array.from(new Set([...prev, ...requiredFieldIds]))
      }
      console.log("🔵 Agregando campos requeridos a selectedExtraFields:", newIds)
      return Array.from(new Set([...prev, ...newIds]))
    })
    
    // Inicializar valores por defecto para TODOS los campos requeridos que no tienen valor
    setExtraFieldValues(prev => {
      const defaultValues: Record<string, string> = {}
      
      // Asegurar que los campos requeridos tengan valores por defecto si no los tienen
      requiredFields.forEach(field => {
        const currentValue = prev[field.id]
        // Si no tiene valor o el valor es "undefined" (string), usar el defaultValue
        if (field.defaultValue && (!currentValue || currentValue === "undefined" || currentValue.trim() === "")) {
          defaultValues[field.id] = field.defaultValue
        }
      })
      
      if (Object.keys(defaultValues).length === 0) return prev // No hay cambios
      console.log("🔵 Aplicando valores por defecto a campos requeridos:", defaultValues)
      return { ...prev, ...defaultValues }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraFields.length, id, extraFields])
  
  // Efecto separado para aplicar valores por defecto a campos opcionales seleccionados
  // Este efecto solo se ejecuta cuando cambian los campos seleccionados, pero de forma segura
  useEffect(() => {
    if (!extraFields.length || !isInitializedRef.current) return
    if (initializedProductIdRef.current !== id) return
    if (isProcessingExtraFieldsRef.current) return
    if (selectedExtraFields.length === 0) return
    
    // Aplicar valores por defecto solo a campos opcionales seleccionados que no tienen valor
    setExtraFieldValues(prev => {
      const defaultValues: Record<string, string> = {}
      
      selectedExtraFields.forEach((campoId) => {
        const field = extraFields.find(f => f.id === campoId)
        if (!field || field.isRequired) return // Saltar campos requeridos (ya se manejan arriba)
        
        const currentValue = prev[campoId]
        // Si no tiene valor o está vacío, y el campo tiene un valor por defecto, usarlo
        if (field.defaultValue && (!currentValue || currentValue.trim() === "")) {
          defaultValues[campoId] = field.defaultValue
        }
      })
      
      if (Object.keys(defaultValues).length === 0) return prev // No hay cambios
      return { ...prev, ...defaultValues }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExtraFields.length, id]) // Solo dependemos de la longitud, no del array completo

  const resetWarehouseModal = () => {
    setMwWarehouseId("")
    setMwQtyInit("")
    setMwQtyMin("")
    setMwQtyMax("")
    setEditingWarehouseId(null)
    setMwWarehouseError(false)
    setMwQtyInitError(false)
  }

  const openEditWarehouseModal = (warehouse: WarehouseEntry) => {
    setEditingWarehouseId(warehouse.bodegaId)
    setMwWarehouseId(warehouse.bodegaId)
    setMwQtyInit(String(warehouse.qtyInit))
    setMwQtyMin(warehouse.qtyMin?.toString() || "")
    setMwQtyMax(warehouse.qtyMax?.toString() || "")
    setIsWarehouseModalOpen(true)
  }

  const saveWarehouseEntry = async () => {
    console.log("🔵 saveWarehouseEntry llamado")
    console.log("🔵 id:", id)
    console.log("🔵 mwWarehouseId:", mwWarehouseId)
    console.log("🔵 mwQtyInit:", mwQtyInit)
    console.log("🔵 editingWarehouseId:", editingWarehouseId)
    
    if (!id) {
      console.error("❌ No hay ID de producto")
      return
    }
    
    // Validar bodega seleccionada
    if (!mwWarehouseId) {
      setMwWarehouseError(true)
      toast({
        title: "⚠️ Bodega requerida",
        description: "Debes seleccionar una bodega para continuar.",
        variant: "destructive",
      })
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
      toast({
        title: "⚠️ Cantidad inicial requerida",
        description: "La cantidad inicial es obligatoria y debe ser un número entero mayor o igual a 0.",
        variant: "destructive",
      })
      return
    }

    // Identificar bodega principal: priorizar selectedBodegaId (el valor actual del dropdown)
    // que es la fuente de verdad más actual, incluso si aún no se ha guardado
    const bodegaPrincipalActual = productoBodegas.find((b: ProductoBodegaBackend) => b.esPrincipal === true)
    const bodegaPrincipalId = selectedBodegaId || // Priorizar selectedBodegaId (valor actual del dropdown)
                             bodegaPrincipalActual?.bodegaId || // Si no hay selectedBodegaId, usar la del backend
                             bodegaPrincipalIdFromProduct // Fallback al ID del producto
    
    // Validar que la bodega seleccionada no sea la bodega principal actual
    if (bodegaPrincipalId && mwWarehouseId === bodegaPrincipalId) {
      const bodegaPrincipal = bodegas.find(b => b.id === bodegaPrincipalId)
      toast({
        title: "⚠️ Bodega ya configurada como principal",
        description: `La bodega "${bodegaPrincipal?.nombre || "seleccionada"}" ya está configurada como bodega principal. No puedes agregarla como bodega adicional. Por favor, selecciona una bodega diferente.`,
        variant: "destructive",
      })
      setMwWarehouseError(true)
      return
    }
    
    // También validar si la bodega está marcada como principal en productoBodegas
    // (por si acaso hay algún desfase entre selectedBodegaId y productoBodegas)
    const bodegaEsPrincipal = productoBodegas.some(
      (b: ProductoBodegaBackend) => b.bodegaId === mwWarehouseId && b.esPrincipal === true
    )
    if (bodegaEsPrincipal) {
      const bodegaPrincipal = bodegas.find(b => b.id === mwWarehouseId)
      toast({
        title: "⚠️ Bodega principal detectada",
        description: `La bodega "${bodegaPrincipal?.nombre || "seleccionada"}" está marcada como bodega principal en el sistema. No puedes agregarla como bodega adicional. Por favor, selecciona una bodega diferente.`,
        variant: "destructive",
      })
      setMwWarehouseError(true)
      return
    }

    // Validar que la bodega no esté ya agregada (excepto si estamos editando)
    const bodega = bodegas.find(b => b.id === mwWarehouseId)
    if (!bodega) {
      toast({
        title: "❌ Error",
        description: "No se pudo encontrar la bodega seleccionada.",
        variant: "destructive",
      })
      return
    }

    // Validar que no se agregue una bodega que ya está en productoBodegas como adicional (excepto si se está editando)
    if (!editingWarehouseId) {
      const bodegaEnProductoBodegas = productoBodegas.find(
        (b: ProductoBodegaBackend) => b.bodegaId === mwWarehouseId && !b.esPrincipal
      )
      if (bodegaEnProductoBodegas) {
        toast({
          title: "⚠️ Bodega duplicada",
          description: `La bodega "${bodega.nombre}" ya está agregada en las bodegas adicionales del producto.`,
          variant: "destructive",
        })
        return
      }

      // También validar en inventoryByWarehouse (estado local)
      if (inventoryByWarehouse.some(w => w.bodegaId === mwWarehouseId)) {
        toast({
          title: "⚠️ Bodega duplicada",
          description: `La bodega "${bodega.nombre}" ya está agregada en la lista de bodegas adicionales.`,
          variant: "destructive",
        })
        return
      }
    }

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

    // Validar que cantidad mínima no sea mayor que máxima
    if (minV !== undefined && maxV !== undefined && minV > maxV) {
      toast({
        title: "⚠️ Rangos inválidos",
        description: "La cantidad mínima no puede ser mayor que la cantidad máxima. Por favor, verifica los valores ingresados.",
        variant: "destructive",
      })
      return
    }

    // Validar que cantidad inicial esté dentro del rango
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

    setIsSavingBodega(true)
    
    try {
      if (editingWarehouseId) {
        // Actualizar bodega existente
        await updateBodegaMutation.mutateAsync({
          productId: id,
          bodegaId: editingWarehouseId,
          data: {
            cantidadInicial: init,
            cantidadMinima: minV ?? null,
            cantidadMaxima: maxV ?? null,
          },
        })
        
        // El hook ya muestra el toast de éxito, pero agregamos uno adicional con más detalles
        toast({
          title: "✅ Bodega actualizada",
          description: `La bodega "${bodega.nombre}" ha sido actualizada exitosamente.`,
        })
      } else {
        // Agregar nueva bodega - llama al endpoint POST /api/productos/{productId}/bodegas
        await addBodegaMutation.mutateAsync({
          productId: id,
          data: {
            bodegaId: mwWarehouseId,
            cantidadInicial: init,
            cantidadMinima: minV ?? null,
            cantidadMaxima: maxV ?? null,
          },
        })
        
        // El hook ya muestra el toast de éxito, pero agregamos uno adicional con más detalles
        toast({
          title: "✅ Bodega agregada exitosamente",
          description: `La bodega "${bodega.nombre}" ha sido agregada como bodega adicional.`,
        })
      }

      // Invalidar queries para actualizar la UI automáticamente
      // (El hook ya invalida, pero lo hacemos aquí también para asegurar)
      queryClient.invalidateQueries({ queryKey: productoKeys.bodegas(id) })

      setIsWarehouseModalOpen(false)
      resetWarehouseModal()
    } catch (error: any) {
      console.error("Error al guardar bodega:", error)
      console.error("Error completo:", JSON.stringify(error, null, 2))
      console.error("Error response:", error?.response)
      console.error("Error response data:", error?.response?.data)
      
      // El hook ya maneja los errores y muestra toasts, pero agregamos uno adicional
      // para asegurar que el usuario vea el error con más detalles
      let errorMessage = "Ha ocurrido un error al intentar guardar la bodega. Por favor, intenta nuevamente."
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.response?.data?.errors) {
        // Si hay errores de validación del backend
        const validationErrors = Object.values(error.response.data.errors).flat().join(", ")
        errorMessage = `Errores de validación: ${validationErrors}`
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "❌ Error al guardar bodega",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSavingBodega(false)
    }
  }

  const removeWarehouseEntry = async (bodegaId: string) => {
    if (!id) return
    
    // Validar que no sea la bodega principal
    const bodega = productoBodegas.find((b: ProductoBodegaBackend) => b.bodegaId === bodegaId)
    if (bodega?.esPrincipal === true) {
      toast({
        title: "⚠️ No se puede eliminar",
        description: "No se puede eliminar la bodega principal. Si deseas cambiar la bodega principal, selecciona una diferente en el dropdown.",
        variant: "destructive",
      })
      return
    }

    const warehouse = inventoryByWarehouse.find(w => w.bodegaId === bodegaId)
    if (!warehouse) {
      toast({
        title: "⚠️ Bodega no encontrada",
        description: "No se pudo encontrar la bodega a eliminar.",
        variant: "destructive",
      })
      return
    }

    // Establecer estado de carga para esta bodega específica
    setIsDeletingWarehouse(prev => ({ ...prev, [bodegaId]: true }))

    try {
      await deleteBodegaMutation.mutateAsync({
        productId: id,
        bodegaId,
      })

      // Invalidar queries para actualizar la UI automáticamente
      queryClient.invalidateQueries({ queryKey: productoKeys.bodegas(id) })

      // Actualizar estado local removiendo la bodega eliminada
      setInventoryByWarehouse(prev => prev.filter(w => w.bodegaId !== bodegaId))

      toast({
        title: "✅ Bodega eliminada",
        description: `La bodega "${warehouse.bodegaNombre}" ha sido eliminada exitosamente.`,
      })
    } catch (error: any) {
      console.error("Error al eliminar bodega:", error)
      toast({
        title: "❌ Error al eliminar bodega",
        description: error?.message || "Ha ocurrido un error al intentar eliminar la bodega. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      // Limpiar estado de carga
      setIsDeletingWarehouse(prev => {
        const newState = { ...prev }
        delete newState[bodegaId]
        return newState
      })
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

  // Función para campos adicionales
  const toggleExtraField = async (fieldId: string) => {
    const field = extraFields.find(f => f.id === fieldId)
    if (!field) return

    // No permitir deseleccionar campos requeridos
    if (field.isRequired && selectedExtraFields.includes(fieldId)) {
      toast({
        title: "⚠️ Campo obligatorio",
        description: `El campo "${field.name}" es obligatorio y no puede ser removido.`,
        variant: "destructive",
      })
      return
    }

    const isSelected = selectedExtraFields.includes(fieldId)

    if (isSelected) {
      // Remover campo extra del estado local
      setSelectedExtraFields(prev => prev.filter(id => id !== fieldId))
      setExtraFieldValues(prev => {
        const newValues = { ...prev }
        delete newValues[fieldId]
        return newValues
      })
    } else {
      // Agregar campo extra al estado local con valor por defecto
      setSelectedExtraFields(prev => [...prev, fieldId])
      const defaultValue = field.defaultValue || ""
      setExtraFieldValues(prev => ({
        ...prev,
        [fieldId]: defaultValue
      }))
    }
  }

  const handleExtraFieldValueChange = async (fieldId: string, value: string) => {
    if (!id) return
    
    // Actualizar valor localmente - permitir valores vacíos para permitir edición completa
    setExtraFieldValues(prev => {
      const newValues = {
        ...prev,
        [fieldId]: value // Guardar el valor tal cual (puede estar vacío)
      }
      return newValues
    })
  }

  // Función para renderizar inputs de campos adicionales
  const renderExtraFieldInput = (field: any) => {
    // Si hay un valor en extraFieldValues, usarlo (incluso si está vacío, para permitir edición)
    // Si no hay valor pero hay defaultValue, usar defaultValue como valor inicial
    const currentValue = extraFieldValues[field.id]
    const hasValueInState = field.id in extraFieldValues // Verificar si existe la clave, incluso si el valor está vacío
    
    // Si ya se ha modificado el campo (existe en extraFieldValues), usar ese valor (puede estar vacío)
    // Si no se ha modificado, usar el defaultValue como valor inicial
    const value = hasValueInState ? (currentValue || "") : (field.defaultValue || "")
    
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

  // Cálculo bidireccional de precios (igual que en creación)
  const handleBaseOrTaxChange = useCallback((bp: string, t: string) => {
    // Prevenir bucles infinitos
    if (isUpdatingPriceRef.current) return
    isUpdatingPriceRef.current = true
    
    try {
      // Actualizar estados locales primero
      setBasePrice(bp)
      setTax(t)
      const base = parseFloat(bp || "0")
      const taxP = parseFloat(t || "0")
      const total = base + (base * taxP) / 100
      const newTotal = total > 0 ? total.toFixed(2) : ""
      setTotalPrice(newTotal)
      
      // Actualizar React Hook Form sin disparar validación que cause bucles
      setValue("basePrice", bp, { shouldValidate: false, shouldDirty: true })
      setValue("tax", t, { shouldValidate: false, shouldDirty: true })
      setValue("totalPrice", newTotal, { shouldValidate: false, shouldDirty: true })
      setBasePriceError(false)
    } finally {
      // Usar setTimeout para asegurar que el flag se resetee después del render
      setTimeout(() => {
        isUpdatingPriceRef.current = false
      }, 0)
    }
  }, [setValue])
  
  const handleTotalChange = useCallback((total: string) => {
    // Prevenir bucles infinitos
    if (isUpdatingPriceRef.current) return
    isUpdatingPriceRef.current = true
    
    try {
      setTotalPrice(total)
      const t = parseFloat(tax || "0")
      const tot = parseFloat(total || "0")
      let newBase = ""
      if (t > 0) {
        const base = tot / (1 + t / 100)
        newBase = base > 0 ? base.toFixed(2) : ""
      } else {
        newBase = tot > 0 ? tot.toFixed(2) : ""
      }
      setBasePrice(newBase)
      
      // Actualizar React Hook Form sin disparar validación que cause bucles
      setValue("totalPrice", total, { shouldValidate: false, shouldDirty: true })
      setValue("basePrice", newBase, { shouldValidate: false, shouldDirty: true })
      setTotalPriceError(false)
    } finally {
      // Usar setTimeout para asegurar que el flag se resetee después del render
      setTimeout(() => {
        isUpdatingPriceRef.current = false
      }, 0)
    }
  }, [tax, setValue])

  const priceToShow = useMemo(() => totalPrice || basePrice || "0.00", [totalPrice, basePrice])

  // Detectar si hay cambios en el formulario
  const hasChanges = useMemo(() => {
    if (!product || !productoOriginal || !isInitializedRef.current) return false

    // Comparar campos básicos
    if (name.trim() !== (product.name || "").trim()) return true
    if (code.trim() !== (product.sku || "").trim()) return true
    if (description.trim() !== (product.description || "").trim()) return true
    
    // Comparar categoría
    const categoriaIdOriginal = productoOriginal.categoriaId || "none"
    if (selectedCategoriaId !== categoriaIdOriginal) return true
    
    // Comparar unidad
    const unitOriginal = (product as ExtendedProduct).unit ?? "Unidad"
    if (unit !== unitOriginal) return true
    
    // Comparar precios (con tolerancia para decimales)
    const basePriceOriginal = (product as ExtendedProduct).basePrice ?? product.price
    if (Math.abs(parseFloat(basePrice || "0") - basePriceOriginal) > 0.01) return true
    
    const taxOriginal = (product as ExtendedProduct).taxPercent ?? 0
    if (Math.abs(parseFloat(tax || "0") - taxOriginal) > 0.01) return true
    
    if (Math.abs(parseFloat(totalPrice || "0") - product.price) > 0.01) return true
    
    // Comparar costo
    if (Math.abs(parseFloat(initialCost || "0") - product.cost) > 0.01) return true
    
    // Comparar imagen
    if (imageFile) return true // Nueva imagen seleccionada
    if (imagePreview === null && originalImageUrl) return true // Imagen eliminada
    if (imagePreview && originalImageUrl && imagePreview !== originalImageUrl) return true // Imagen diferente
    
    // Comparar bodega principal
    const bodegaPrincipalOriginal = productoOriginal.bodegaPrincipalId || null
    if (selectedBodegaId !== bodegaPrincipalOriginal) return true
    
    // Comparar cantidades de bodega principal
    const bodegaPrincipal = productoBodegas.find((b: ProductoBodegaBackend) => b.esPrincipal === true)
    if (bodegaPrincipal) {
      const quantityValue = parseInt(quantity || "0")
      if (quantityValue !== bodegaPrincipal.cantidadInicial) return true
      
      const quantityMinValue = quantityMin ? parseInt(quantityMin) : null
      if (quantityMinValue !== bodegaPrincipal.cantidadMinima) return true
      
      const quantityMaxValue = quantityMax ? parseInt(quantityMax) : null
      if (quantityMaxValue !== bodegaPrincipal.cantidadMaxima) return true
    } else if (selectedBodegaId) {
      // Si no hay bodega principal pero hay una seleccionada, hay cambio
      if (quantity && parseInt(quantity) !== 0) return true
      if (quantityMin) return true
      if (quantityMax) return true
    }
    
    // Comparar campos extra seleccionados
    const camposExtraOriginales = productoCamposExtra.map((ce: ProductoCampoExtraBackend) => ce.campoExtraId).sort()
    const camposExtraSeleccionados = [...selectedExtraFields].sort()
    if (JSON.stringify(camposExtraOriginales) !== JSON.stringify(camposExtraSeleccionados)) return true
    
    // Comparar valores de campos extra
    for (const campo of productoCamposExtra) {
      const valorOriginal = campo.valor || ""
      const campoExtra = extraFields.find(f => f.id === campo.campoExtraId)
      const userValue = extraFieldValues[campo.campoExtraId]?.trim() || ""
      const defaultValue = campoExtra?.defaultValue || ""
      const valorActual = userValue || defaultValue
      
      if (valorActual.trim() !== valorOriginal.trim()) return true
    }
    
    // Verificar si hay campos extra nuevos con valores
    const camposExtraNuevos = selectedExtraFields.filter(fieldId => 
      !productoCamposExtra.some((ce: ProductoCampoExtraBackend) => ce.campoExtraId === fieldId)
    )
    for (const fieldId of camposExtraNuevos) {
      const campoExtra = extraFields.find(f => f.id === fieldId)
      const userValue = extraFieldValues[fieldId]?.trim() || ""
      const defaultValue = campoExtra?.defaultValue || ""
      const valor = userValue || defaultValue
      if (valor && valor.trim() !== "") return true
    }
    
    // Comparar bodegas adicionales
    const bodegasAdicionalesOriginales = productoBodegas
      .filter((b: ProductoBodegaBackend) => !b.esPrincipal)
      .map((b: ProductoBodegaBackend) => ({
        bodegaId: b.bodegaId,
        cantidadInicial: b.cantidadInicial,
        cantidadMinima: b.cantidadMinima,
        cantidadMaxima: b.cantidadMaxima,
      }))
      .sort((a, b) => a.bodegaId.localeCompare(b.bodegaId))
    
    const bodegasAdicionalesActuales = inventoryByWarehouse
      .map(w => ({
        bodegaId: w.bodegaId,
        cantidadInicial: w.qtyInit,
        cantidadMinima: w.qtyMin ?? null,
        cantidadMaxima: w.qtyMax ?? null,
      }))
      .sort((a, b) => a.bodegaId.localeCompare(b.bodegaId))
    
    if (JSON.stringify(bodegasAdicionalesOriginales) !== JSON.stringify(bodegasAdicionalesActuales)) return true
    
    return false
  }, [
    product,
    productoOriginal,
    name,
    code,
    description,
    selectedCategoriaId,
    unit,
    basePrice,
    tax,
    totalPrice,
    initialCost,
    imageFile,
    imagePreview,
    originalImageUrl,
    selectedBodegaId,
    quantity,
    quantityMin,
    quantityMax,
    productoBodegas,
    productoCamposExtra,
    selectedExtraFields,
    extraFieldValues,
    extraFields,
    inventoryByWarehouse,
  ])

  const onImageChange = (file: File | null) => {
    // Si se está eliminando la imagen
    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      setUploadedImageUrl(null) // Marcar que no hay imagen subida
      toast({
        title: "✅ Imagen eliminada",
        description: "La imagen ha sido eliminada exitosamente.",
      })
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

    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    setUploadedImageUrl(null) // Resetear URL subida hasta que se suba nuevamente
    toast({
      title: "✅ Imagen cargada",
      description: "La imagen se ha cargado exitosamente. Se subirá al guardar el producto.",
    })
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

  const doSubmit = async (createAnother: boolean = false) => {
    console.log("🔵 doSubmit llamado, createAnother:", createAnother)
    console.log("🔵 id:", id)
    console.log("🔵 product:", product)
    console.log("🔵 productoOriginal:", productoOriginal)
    
    if (!id || !product || !productoOriginal) {
      console.error("❌ Faltan datos requeridos:", { id, product: !!product, productoOriginal: !!productoOriginal })
      return
    }

    console.log("🔵 Datos disponibles - name:", name, "unit:", unit, "basePrice:", basePrice, "totalPrice:", totalPrice, "initialCost:", initialCost, "selectedBodegaId:", selectedBodegaId, "quantity:", quantity)
    console.log("🔵 Validando nombre...")
    // Validar nombre
    if (!name.trim()) {
      console.error("❌ Validación falló: nombre vacío")
      setErrorMessage("El nombre del producto es obligatorio.")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Campo requerido",
        description: "El nombre del producto es obligatorio.",
        variant: "destructive",
      })
      return
    }

    console.log("🔵 Validando unidad de medida...")
    // Validar unidad de medida
    if (!unit || unit.trim() === "") {
      console.error("❌ Validación falló: unidad de medida vacía")
      setErrorMessage("Debes seleccionar una unidad de medida para el producto.")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Unidad de medida requerida",
        description: "Debes seleccionar una unidad de medida para el producto.",
        variant: "destructive",
      })
      return
    }

    console.log("🔵 Validando precio base...")
    // Validar precio base
    const basePriceValue = parseFloat(basePrice || "0")
    if (!basePrice || basePrice.trim() === "" || isNaN(basePriceValue) || basePriceValue <= 0) {
      console.error("❌ Validación falló: precio base inválido", { basePrice, basePriceValue })
      setBasePriceError(true)
      setErrorMessage("El precio base debe ser un número mayor a 0.")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Precio base inválido",
        description: "El precio base debe ser un número mayor a 0.",
        variant: "destructive",
      })
      return
    }

    console.log("🔵 Validando precio total...")
    // Validar precio total
    const totalPriceValue = parseFloat(totalPrice || "0")
    if (!totalPrice || totalPrice.trim() === "" || isNaN(totalPriceValue) || totalPriceValue <= 0) {
      console.error("❌ Validación falló: precio total inválido", { totalPrice, totalPriceValue })
      setTotalPriceError(true)
      setErrorMessage("El precio total debe ser un número mayor a 0.")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Precio total inválido",
        description: "El precio total debe ser un número mayor a 0.",
        variant: "destructive",
      })
      return
    }

    console.log("🔵 Validando costo inicial...")
    // Validar costo inicial
    const initialCostValue = parseFloat(initialCost || "0")
    if (!initialCost || initialCost.trim() === "" || isNaN(initialCostValue) || initialCostValue < 0) {
      console.error("❌ Validación falló: costo inicial inválido", { initialCost, initialCostValue })
      setInitialCostError(true)
      setErrorMessage("El costo inicial es obligatorio y debe ser un número mayor o igual a 0.")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Costo inicial inválido",
        description: "El costo inicial es obligatorio y debe ser un número mayor o igual a 0. Por favor, ingresa un valor válido.",
        variant: "destructive",
      })
      return
    }

    console.log("🔵 Validando bodega principal...")
    // Validar bodega principal
    if (!selectedBodegaId || selectedBodegaId.trim() === "") {
      console.error("❌ Validación falló: bodega principal no seleccionada")
      setBodegaPrincipalError(true)
      setErrorMessage("Debes seleccionar una bodega principal para el producto.")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Bodega principal requerida",
        description: "Debes seleccionar una bodega principal para el producto.",
        variant: "destructive",
      })
      return
    }

    console.log("🔵 Validando cantidad inicial de bodega principal...")
    // Validar cantidad inicial de bodega principal
    if (quantity && (quantity.includes(".") || quantity.includes(","))) {
      console.error("❌ Validación falló: cantidad tiene decimales", { quantity })
      setQuantityError(true)
      setErrorMessage("La cantidad inicial debe ser un número entero (sin decimales).")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Cantidad inválida",
        description: "La cantidad inicial debe ser un número entero (sin decimales).",
        variant: "destructive",
      })
      return
    }
    const quantityValue = parseInt(quantity || "0")
    if (!quantity || quantity.trim() === "" || isNaN(quantityValue) || quantityValue < 0) {
      console.error("❌ Validación falló: cantidad inicial inválida", { quantity, quantityValue })
      setQuantityError(true)
      setErrorMessage("La cantidad inicial es obligatoria y debe ser un número entero mayor o igual a 0.")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Cantidad inicial inválida",
        description: "La cantidad inicial es obligatoria y debe ser un número entero mayor o igual a 0.",
        variant: "destructive",
      })
      return
    }
    console.log("🔵 Cantidad inicial válida:", quantityValue)

    // Validar que cantidad mínima y máxima sean enteros si están definidas
    if (quantityMin && (quantityMin.includes(".") || quantityMin.includes(","))) {
      setQuantityMinError(true)
      setErrorMessage("La cantidad mínima debe ser un número entero (sin decimales).")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Cantidad mínima inválida",
        description: "La cantidad mínima debe ser un número entero (sin decimales).",
        variant: "destructive",
      })
      return
    }
    if (quantityMax && (quantityMax.includes(".") || quantityMax.includes(","))) {
      setQuantityMaxError(true)
      setErrorMessage("La cantidad máxima debe ser un número entero (sin decimales).")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Cantidad máxima inválida",
        description: "La cantidad máxima debe ser un número entero (sin decimales).",
        variant: "destructive",
      })
      return
    }

    const quantityMinValue = quantityMin ? parseInt(quantityMin) : undefined
    const quantityMaxValue = quantityMax ? parseInt(quantityMax) : undefined

    // Validar que cantidad mínima y máxima sean números positivos
    if (quantityMinValue !== undefined && quantityMinValue < 0) {
      setQuantityMinError(true)
      setErrorMessage("La cantidad mínima debe ser un número positivo (mayor o igual a 0).")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Cantidad mínima inválida",
        description: "La cantidad mínima debe ser un número positivo (mayor o igual a 0).",
        variant: "destructive",
      })
      return
    }

    if (quantityMaxValue !== undefined && quantityMaxValue < 0) {
      setQuantityMaxError(true)
      setErrorMessage("La cantidad máxima debe ser un número positivo (mayor o igual a 0).")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Cantidad máxima inválida",
        description: "La cantidad máxima debe ser un número positivo (mayor o igual a 0).",
        variant: "destructive",
      })
      return
    }

    // Validar que cantidad máxima sea mayor a cantidad mínima
    if (quantityMinValue !== undefined && quantityMaxValue !== undefined && quantityMinValue > quantityMaxValue) {
      setQuantityMinError(true)
      setQuantityMaxError(true)
      setErrorMessage("La cantidad máxima debe ser mayor que la cantidad mínima.")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Rangos inválidos",
        description: "La cantidad máxima debe ser mayor que la cantidad mínima. Por favor, verifica los valores ingresados.",
        variant: "destructive",
      })
      return
    }

    // Validar que siempre exista una bodega principal
    if (!selectedBodegaId || selectedBodegaId.trim() === "") {
      setBodegaPrincipalError(true)
      setErrorMessage("Debe existir siempre una bodega principal. Por favor, selecciona una bodega principal antes de guardar.")
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
      toast({
        title: "⚠️ Bodega principal requerida",
        description: "Debe existir siempre una bodega principal. Por favor, selecciona una bodega principal antes de guardar.",
        variant: "destructive",
      })
      return
    }

    console.log("🔵 Validando campos extra requeridos...")
    // Validar campos extra requeridos
    const camposExtraRequeridos = extraFields.filter(field => field.isRequired && field.isActive)
    console.log("🔵 camposExtraRequeridos:", camposExtraRequeridos.map(f => ({ name: f.name, id: f.id })))
    console.log("🔵 selectedExtraFields:", selectedExtraFields)
    console.log("🔵 extraFieldValues:", extraFieldValues)
    
    const missingRequiredFields: string[] = []
    
    camposExtraRequeridos.forEach((field) => {
      // Obtener el valor ingresado por el usuario (puede estar vacío)
      const userValue = extraFieldValues[field.id]?.trim() || ""
      // Si no hay valor del usuario, usar el defaultValue
      const defaultValue = field.defaultValue || ""
      const finalValue = userValue || defaultValue
      
      console.log(`🔵 Campo requerido "${field.name}" (${field.id}): userValue="${userValue}", defaultValue="${defaultValue}", finalValue="${finalValue}"`)
      
      // Validar que el campo tenga un valor final (no vacío)
      // Si el usuario borró el valor por defecto y no ingresó uno nuevo, debe fallar
      // Pero si hay defaultValue, lo usamos como fallback
      if (!finalValue || finalValue.trim() === "") {
        console.log(`❌ Campo requerido "${field.name}" no tiene valor`)
        missingRequiredFields.push(field.name)
      }
    })
    
    console.log("🔵 missingRequiredFields:", missingRequiredFields)

    if (missingRequiredFields.length > 0) {
      console.error("❌ Validación falló: campos extra requeridos incompletos", missingRequiredFields)
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

    console.log("🔵 Validando campos extra opcionales seleccionados...")
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
      
      console.log(`🔵 Campo opcional "${field.name}" (${field.id}): userValue="${userValue}", defaultValue="${defaultValue}", finalValue="${finalValue}"`)
      
      // Si el campo está seleccionado, debe tener un valor (no puede estar vacío)
      if (!finalValue || finalValue.trim() === "") {
        console.log(`❌ Campo opcional seleccionado "${field.name}" no tiene valor`)
        missingOptionalFields.push(field.name)
      }
    })
    
    console.log("🔵 missingOptionalFields:", missingOptionalFields)

    if (missingOptionalFields.length > 0) {
      console.error("❌ Validación falló: campos opcionales seleccionados incompletos", missingOptionalFields)
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
    console.log("🔵 Todas las validaciones pasaron, procediendo a actualizar...")

    try {
      console.log("🔵 Iniciando actualización del producto...")
      
      // Manejar imagen: subir nueva o eliminar si se quitó
      let finalImageUrl: string | undefined | null = null
      
      if (imageFile) {
        // Hay una nueva imagen para subir
        setIsUploadingImage(true)
        try {
          console.log("🔵 Subiendo nueva imagen a Supabase...")
          finalImageUrl = await uploadProductImage(imageFile, id)
          setUploadedImageUrl(finalImageUrl)
          
          // Si había una imagen original diferente, eliminarla
          if (originalImageUrl && originalImageUrl !== finalImageUrl) {
            console.log("🔵 Eliminando imagen anterior...")
            deleteProductImage(originalImageUrl).catch((error) => {
              console.error("Error al eliminar imagen anterior:", error)
              // No es crítico, continuar
            })
          }
          
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
      } else if (imagePreview === null && originalImageUrl) {
        // Se eliminó la imagen (imagePreview es null pero había una original)
        console.log("🔵 Eliminando imagen del producto...")
        try {
          await deleteProductImage(originalImageUrl)
          finalImageUrl = null
          setUploadedImageUrl(null)
        } catch (error) {
          console.error("Error al eliminar imagen:", error)
          // Continuar aunque falle la eliminación
        }
      } else {
        // No hay cambios en la imagen, usar la URL existente
        finalImageUrl = uploadedImageUrl || originalImageUrl || undefined
      }
      
      // Mapear categoriaId correctamente
      const categoriaId = selectedCategoriaId && selectedCategoriaId !== "none" ? selectedCategoriaId : null

      // Mapear a DTO del backend
      // Incluir bodegaPrincipalId si cambió la bodega principal
      console.log("🔵 Mapeando datos a DTO...")
      const updateDto = mapProductToUpdateDto({
        name,
        sku: code,
        category: categoriaId || undefined, // Usar ID en lugar de nombre (convertir null a undefined)
        description,
        unit,
        basePrice: basePriceValue,
        taxPercent: tax ? parseFloat(tax) : (product as ExtendedProduct).taxPercent ?? 0,
        price: totalPriceValue,
        cost: initialCostValue,
        imageUrl: finalImageUrl === null ? undefined : finalImageUrl || undefined,
        bodegaPrincipalId: selectedBodegaId, // Incluir la bodega principal seleccionada
      })
      console.log("🔵 DTO creado:", updateDto)
      
      // Iniciar la petición principal y navegar inmediatamente (optimistic navigation)
      // El hook maneja optimistic updates automáticamente
      console.log("🔵 Iniciando actualización en background...")
      const updatePromise = updateMutation.mutateAsync({ id, data: updateDto })
      
      // Navegar inmediatamente sin esperar (optimistic navigation)
      // Pasar parámetro en URL para mostrar toast de éxito en la página destino
      console.log("🔵 Navegando optimísticamente... createAnother:", createAnother)
      if (createAnother) {
        router.replace(`/inventory/items/add?updated=true`)
      } else {
        router.replace(`/inventory/items/${id}?updated=true`)
      }
      
      // Continuar con bodega y campos extra en background usando .then() para que continúen aunque el componente se desmonte
      updatePromise
        .then((updateResponse) => {
          console.log("✅ Producto actualizado exitosamente, continuando con bodega y campos extra...")
          
          // Actualizar bodega principal con las cantidades
          console.log("🔵 Verificando si necesita actualizar bodega principal...")
          const bodegaPrincipalActual = productoBodegas.find((b: ProductoBodegaBackend) => b.esPrincipal === true)
          const bodegaPrincipalIdActual = bodegaPrincipalActual?.bodegaId || bodegaPrincipalIdFromProduct || selectedBodegaId
          
          // Verificar si la bodega principal cambió o si las cantidades cambiaron
          const bodegaCambio = bodegaPrincipalIdActual !== selectedBodegaId
          const cantidadesCambiaron = bodegaPrincipalActual 
            ? (bodegaPrincipalActual.cantidadInicial !== quantityValue ||
               bodegaPrincipalActual.cantidadMinima !== quantityMinValue ||
               bodegaPrincipalActual.cantidadMaxima !== quantityMaxValue)
            : true

          console.log("🔵 bodegaCambio:", bodegaCambio, "cantidadesCambiaron:", cantidadesCambiaron)
          if (bodegaCambio || cantidadesCambiaron) {
            console.log("🔵 Actualizando bodega principal...")
            
            // Actualizar o agregar la bodega principal
            const bodegaExiste = productoBodegas.some((b: ProductoBodegaBackend) => b.bodegaId === selectedBodegaId)
            
            if (bodegaExiste) {
              // Actualizar bodega existente
              return updateBodegaMutation.mutateAsync({
                productId: id,
                bodegaId: selectedBodegaId,
                data: {
                  cantidadInicial: quantityValue,
                  cantidadMinima: quantityMinValue ?? null,
                  cantidadMaxima: quantityMaxValue ?? null,
                },
              }).then(() => updateResponse)
            } else {
              // Agregar nueva bodega principal
              return addBodegaMutation.mutateAsync({
                productId: id,
                data: {
                  bodegaId: selectedBodegaId,
                  cantidadInicial: quantityValue,
                  cantidadMinima: quantityMinValue ?? null,
                  cantidadMaxima: quantityMaxValue ?? null,
                },
              }).then(() => updateResponse)
            }
          }
          return updateResponse
        })
        .then(() => {
          // Actualizar campos extra del producto
          console.log("🔵 Actualizando campos extra...")
          
          // Obtener campos extra actuales del backend
          const camposExtraActuales = productoCamposExtra.map((ce: ProductoCampoExtraBackend) => ce.campoExtraId)
          
          // Campos que deben estar presentes (seleccionados)
          const camposExtraParaActualizar = selectedExtraFields.map((fieldId) => {
            const field = extraFields.find(f => f.id === fieldId)
            if (!field) return null
            const userValue = extraFieldValues[fieldId]?.trim() || ""
            const defaultValue = field.defaultValue || ""
            const finalValue = userValue || defaultValue
            return {
              campoExtraId: fieldId,
              valor: finalValue,
            }
          }).filter((campo): campo is NonNullable<typeof campo> => campo !== null)

          // Asegurar que todos los campos requeridos estén incluidos
          camposExtraRequeridos.forEach((field) => {
            if (!camposExtraParaActualizar.find(c => c.campoExtraId === field.id)) {
              const userValue = extraFieldValues[field.id]?.trim() || ""
              const defaultValue = field.defaultValue || ""
              const finalValue = userValue || defaultValue
              camposExtraParaActualizar.push({
                campoExtraId: field.id,
                valor: finalValue,
              })
            }
          })

          // Eliminar campos que ya no están seleccionados (excepto campos requeridos)
          const camposParaEliminar = camposExtraActuales.filter(campoId => {
            const campo = extraFields.find(f => f.id === campoId)
            if (campo?.isRequired) return false
            return !selectedExtraFields.includes(campoId)
          })

          // Eliminar campos extra que ya no están seleccionados
          const deletePromises = camposParaEliminar.map(campoId =>
            productosService.deleteProductoCampoExtra(id, campoId).catch((error) => {
              console.error(`❌ Error al eliminar campo extra ${campoId}:`, error)
            })
          )

          // Actualizar o agregar cada campo extra
          const updatePromises = camposExtraParaActualizar.map(campo =>
            productosService.setProductoCampoExtra(id, campo.campoExtraId, {
              valor: campo.valor
            })
          )

          return Promise.all([...deletePromises, ...updatePromises])
        })
        .then(() => {
          // Invalidar query de campos extra para actualizar la UI
          queryClient.invalidateQueries({ queryKey: productoKeys.camposExtra(id) })
          console.log("✅ Campos extra actualizados exitosamente")
        })
        .catch((error) => {
          console.error("❌ Error en background updates:", error)
          // Los errores ya se manejan en los hooks con toasts
        })
    } catch (error: any) {
      console.error("Error al actualizar producto:", error)
      console.error("Error completo:", JSON.stringify(error, null, 2))
      console.error("Error response:", error?.response)
      console.error("Error response data:", error?.response?.data)
      
      let errorMessage = "Ha ocurrido un error al intentar actualizar el producto. Por favor, verifica los datos e intenta nuevamente."
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.response?.data?.errors) {
        // Si hay errores de validación del backend
        const validationErrors = Object.values(error.response.data.errors).flat().join(", ")
        errorMessage = `Errores de validación: ${validationErrors}`
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "❌ Error al actualizar producto",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-camouflage-green-300 border-t-camouflage-green-600"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Card className="border-camouflage-green-200">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900">Ítem no encontrado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-camouflage-green-700">
                  {error instanceof Error ? error.message : "El ítem solicitado no existe o fue eliminado."}
                </p>
                  <Button
                    variant="ghost"
                    size="md2"
                    onClick={() => router.push("/inventory/items")}
                    className="text-black bg-white hover:text-black border border-gray-700 hover:bg-gray-100"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4 text-black" />
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
            <p className="mt-1 max-w-3xl text-camouflage-green-600">Actualiza los datos del producto o servicio.</p>
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
                        setShowErrorToast(false)
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
                        setShowErrorToast(false)
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
                        setShowErrorToast(false)
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
                      value={selectedBodegaId || undefined} 
                      onValueChange={(bodegaId) => {
                        if (bodegaId === "__create_new__") {
                          setIsNewWarehouseModalOpen(true)
                          return
                        }
                        
                        // Validar que la nueva bodega principal no esté ya en bodegas adicionales
                        const bodegaEnAdicionales = productoBodegas.find(
                          (b: ProductoBodegaBackend) => b.bodegaId === bodegaId && b.esPrincipal === false
                        )
                        if (bodegaEnAdicionales) {
                          const bodegaNombre = bodegas.find(b => b.id === bodegaId)?.nombre || "seleccionada"
                          toast({
                            title: "⚠️ Bodega ya configurada",
                            description: `La bodega "${bodegaNombre}" ya está configurada como bodega adicional. Primero elimínala de las bodegas adicionales antes de asignarla como principal.`,
                            variant: "destructive",
                          })
                          return
                        }
                        
                        // Actualizar ref para prevenir bucles
                        if (bodegaId !== lastSelectedBodegaIdRef.current) {
                          lastSelectedBodegaIdRef.current = bodegaId
                          setSelectedBodegaId(bodegaId)
                          setBodegaPrincipalError(false)
                          // Buscar la bodega en productoBodegas para obtener sus cantidades
                          const bodega = productoBodegas.find((b: ProductoBodegaBackend) => b.bodegaId === bodegaId)
                          if (bodega) {
                            // Si la bodega existe en productoBodegas, mostrar sus cantidades
                            setQuantity(String(bodega.cantidadInicial))
                            setQuantityMin(bodega.cantidadMinima?.toString() || "")
                            setQuantityMax(bodega.cantidadMaxima?.toString() || "")
                          } else {
                            // Si la bodega no existe en productoBodegas (nueva bodega), limpiar los campos
                            setQuantity("")
                            setQuantityMin("")
                            setQuantityMax("")
                          }
                        }
                      }}
                      disabled={isLoadingBodegas || isLoadingProductoBodegas}
                    >
                      <SelectTrigger className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none ${
                        bodegaPrincipalError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                      }`}>
                        <SelectValue placeholder={isLoadingBodegas || isLoadingProductoBodegas ? "Cargando bodegas..." : "Selecciona una bodega principal"} />
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
                      min="0"
                      value={quantity}
                      onChange={(e) => {
                        const value = validateIntegerInput(e.target.value)
                        setQuantity(value)
                        setValue("quantity", value, { shouldValidate: true })
                        setQuantityError(false)
                        setShowErrorToast(false)
                      }}
                      placeholder="0"
                      className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                        quantityError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
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
                        onChange={(e) => {
                          const value = validateIntegerInput(e.target.value)
                          setQuantityMin(value)
                          setQuantityMinError(false)
                          setShowErrorToast(false)
                          
                          // Validación en tiempo real
                          if (value) {
                            const numValue = parseInt(value)
                            const maxValue = quantityMax ? parseInt(quantityMax) : undefined
                            
                            if (isNaN(numValue) || numValue < 0) {
                              setQuantityMinError(true)
                              setErrorMessage("La cantidad mínima debe ser un número positivo (mayor o igual a 0).")
                              setShowErrorToast(true)
                              setTimeout(() => setShowErrorToast(false), 5000)
                              toast({
                                title: "⚠️ Cantidad mínima inválida",
                                description: "La cantidad mínima debe ser un número positivo (mayor o igual a 0).",
                                variant: "destructive",
                              })
                            } else if (maxValue !== undefined && !isNaN(maxValue) && numValue > maxValue) {
                              setQuantityMinError(true)
                              setQuantityMaxError(true)
                              setErrorMessage("La cantidad máxima debe ser mayor que la cantidad mínima.")
                              setShowErrorToast(true)
                              setTimeout(() => setShowErrorToast(false), 5000)
                              toast({
                                title: "⚠️ Rangos inválidos",
                                description: "La cantidad máxima debe ser mayor que la cantidad mínima.",
                                variant: "destructive",
                              })
                            } else {
                              setQuantityMinError(false)
                              setQuantityMaxError(false)
                              setShowErrorToast(false)
                            }
                          } else {
                            setQuantityMinError(false)
                            setQuantityMaxError(false)
                            setShowErrorToast(false)
                          }
                        }}
                        placeholder="Opcional"
                        className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                          quantityMinError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                        }`}
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
                        onChange={(e) => {
                          const value = validateIntegerInput(e.target.value)
                          setQuantityMax(value)
                          setQuantityMaxError(false)
                          setShowErrorToast(false)
                          
                          // Validación en tiempo real
                          if (value) {
                            const numValue = parseInt(value)
                            const minValue = quantityMin ? parseInt(quantityMin) : undefined
                            
                            if (isNaN(numValue) || numValue < 0) {
                              setQuantityMaxError(true)
                              setErrorMessage("La cantidad máxima debe ser un número positivo (mayor o igual a 0).")
                              setShowErrorToast(true)
                              setTimeout(() => setShowErrorToast(false), 5000)
                              toast({
                                title: "⚠️ Cantidad máxima inválida",
                                description: "La cantidad máxima debe ser un número positivo (mayor o igual a 0).",
                                variant: "destructive",
                              })
                            } else if (minValue !== undefined && !isNaN(minValue) && numValue < minValue) {
                              setQuantityMinError(true)
                              setQuantityMaxError(true)
                              setErrorMessage("La cantidad máxima debe ser mayor que la cantidad mínima.")
                              setShowErrorToast(true)
                              setTimeout(() => setShowErrorToast(false), 5000)
                              toast({
                                title: "⚠️ Rangos inválidos",
                                description: "La cantidad máxima debe ser mayor que la cantidad mínima.",
                                variant: "destructive",
                              })
                            } else {
                              setQuantityMinError(false)
                              setQuantityMaxError(false)
                              setShowErrorToast(false)
                            }
                          } else {
                            setQuantityMinError(false)
                            setQuantityMaxError(false)
                            setShowErrorToast(false)
                          }
                        }}
                        placeholder="Opcional"
                        className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                          quantityMaxError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Lista de bodegas adicionales */}
                  {isLoadingProductoBodegas ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-camouflage-green-300 border-t-camouflage-green-600"></div>
                    </div>
                  ) : errorProductoBodegas ? (
                    <div className="text-sm text-red-600">
                      {errorProductoBodegas instanceof Error ? errorProductoBodegas.message : "Error al cargar bodegas"}
                    </div>
                  ) : (() => {
                    // Filtrar bodegas adicionales usando únicamente productoBodegas y esPrincipal
                    // Las bodegas adicionales son aquellas donde esPrincipal === false
                    const bodegasAdicionalesFiltradas = productoBodegas
                      .filter((b: ProductoBodegaBackend) => !b.esPrincipal)
                      .map((b) => ({
                        bodegaId: b.bodegaId,
                        bodegaNombre: b.bodegaNombre,
                        qtyInit: b.cantidadInicial,
                        qtyMin: b.cantidadMinima,
                        qtyMax: b.cantidadMaxima,
                      }))
                    return bodegasAdicionalesFiltradas.length > 0 ? (
                      <div className="overflow-hidden rounded-lg border border-camouflage-green-200">
                        <div className="grid grid-cols-5 bg-camouflage-green-50/50 px-4 py-2 text-sm font-semibold text-camouflage-green-800">
                          <div>Bodega</div>
                          <div className="text-right">Cant. inicial</div>
                          <div className="text-right">Cant. mínima</div>
                          <div className="text-right">Cant. máxima</div>
                          <div className="text-center">Acciones</div>
                        </div>
                        <div>
                          {bodegasAdicionalesFiltradas.map((w) => (
                            <div
                              key={w.bodegaId}
                              className="grid grid-cols-5 border-t border-camouflage-green-100 px-4 py-2 text-sm items-center"
                            >
                              <div className="text-camouflage-green-900">{w.bodegaNombre}</div>
                              <div className="text-right">{w.qtyInit}</div>
                              <div className="text-right">{w.qtyMin ?? "-"}</div>
                              <div className="text-right">{w.qtyMax ?? "-"}</div>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditWarehouseModal(w)}
                                  className="h-8 w-8 p-0 text-camouflage-green-600 hover:text-camouflage-green-700 hover:bg-camouflage-green-50"
                                  title="Editar bodega"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeWarehouseEntry(w.bodegaId)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Eliminar bodega"
                                  disabled={isDeletingWarehouse[w.bodegaId] || deleteBodegaMutation.isPending}
                                >
                                  {isDeletingWarehouse[w.bodegaId] ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-camouflage-green-600">Aún no has agregado bodegas adicionales.</div>
                    )
                  })()}

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
                      <Plus className="mr-2 h-4 w-4" /> Agregar bodega adicional
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
                  <Popover open={isExtraFieldsPopoverOpen} onOpenChange={setIsExtraFieldsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between rounded-lg border-gray-300 h-10"
                        disabled={isLoadingCamposExtra}
                      >
                        {selectedExtraFields.length > 0
                          ? `${selectedExtraFields.length} campos seleccionados`
                          : isLoadingCamposExtra ? "Cargando campos..." : "Seleccionar campos adicionales..."}
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
                                setIsExtraFieldsPopoverOpen(false) // Cerrar el popover
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
                                setIsExtraFieldsPopoverOpen(false) // Cerrar el popover
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
                
                {/* Mensaje cuando no hay campos seleccionados */}
                {isLoadingProductoCamposExtra ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-camouflage-green-300 border-t-camouflage-green-600"></div>
                  </div>
                ) : errorProductoCamposExtra ? (
                  <div className="text-sm text-red-600">
                    {errorProductoCamposExtra instanceof Error ? errorProductoCamposExtra.message : "Error al cargar campos extra"}
                  </div>
                ) : selectedExtraFields.filter(fieldId => {
                  const field = extraFields.find(f => f.id === fieldId)
                  return field && !field.isRequired
                }).length === 0 && extraFields.filter(f => f.isRequired && f.isActive).length === 0 ? (
                  <div className="text-sm text-camouflage-green-600">No hay campos adicionales seleccionados.</div>
                ) : null}
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
                      setInitialCost(e.target.value)
                      setInitialCostError(false)
                      setShowErrorToast(false)
                    }}
                    placeholder="0.00"
                    className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none ${
                      initialCostError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
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
                    <div>
                      {/* Image uploader */}
                      <div
                        className={`aspect-square w-full cursor-pointer overflow-hidden rounded-lg transition-colors ${
                          isImageDragOver
                            ? "border-2 border-camouflage-green-500 bg-camouflage-green-50"
                            : "hover:bg-camouflage-green-25 border-2 border-dashed border-gray-300 hover:border-camouflage-green-400"
                        }`}
                        onClick={handleImageAreaClick}
                        onDragOver={handleImageDragOver}
                        onDragLeave={handleImageDragLeave}
                        onDrop={handleImageDrop}
                        title={imagePreview ? "Haz clic para cambiar la imagen" : "Haz clic o arrastra una imagen aquí"}
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
                            }}
                            disabled={isUploadingImage}
                          >
                            Eliminar imagen
                          </Button>
                        )}
                      </div>
                    </div>

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
                    onClick={() => router.push("/inventory/items")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full"
                    disabled={!hasChanges || updateMutation.isPending || isUploadingImage}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log("🔵 Botón Guardar clickeado")
                      doSubmit(false)
                    }}
                  >
                    {updateMutation.isPending || isUploadingImage ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={!hasChanges || updateMutation.isPending || isUploadingImage}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log("🔵 Botón Guardar y crear otro clickeado")
                    doSubmit(true)
                  }}
                >
                  {updateMutation.isPending || isUploadingImage ? "Guardando..." : "Guardar y crear otro"}
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
          title={editingWarehouseId ? "Editar bodega" : "Seleccionar bodega"}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-700">
                Bodega <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={mwWarehouseId || undefined} 
                onValueChange={(value) => {
                  if (value === "__create_new__") {
                    setIsNewWarehouseModalOpen(true)
                    return
                  }
                  setMwWarehouseId(value)
                  setMwWarehouseError(false)
                }}
                disabled={isLoadingBodegas || !!editingWarehouseId}
              >
                <SelectTrigger className={`h-10 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none ${
                  mwWarehouseError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-camouflage-green-500"
                }`}>
                  <SelectValue placeholder={isLoadingBodegas ? "Cargando bodegas..." : editingWarehouseId ? "Bodega seleccionada" : "Selecciona una bodega"} />
                </SelectTrigger>
                <SelectContent className="rounded-3xl">
                  {(() => {
                    // Identificar bodega principal: priorizar selectedBodegaId (el valor actual del dropdown)
                    // Si no hay selectedBodegaId, usar la bodega principal de productoBodegas
                    const bodegaPrincipalId = selectedBodegaId || productoBodegas.find((b: ProductoBodegaBackend) => b.esPrincipal)?.bodegaId
                    
                    const bodegasDisponibles = bodegas.filter((bodega) => {
                      // Excluir la bodega principal seleccionada (no puede ser adicional)
                      if (bodegaPrincipalId && bodega.id === bodegaPrincipalId) {
                        return false
                      }
                      // Si estamos editando, permitir la bodega actual
                      if (editingWarehouseId && bodega.id === editingWarehouseId) {
                        return true
                      }
                      // Excluir bodegas que ya están en productoBodegas como adicionales
                      const bodegaYaEnAdicionales = productoBodegas.some(
                        (b: ProductoBodegaBackend) => b.bodegaId === bodega.id && !b.esPrincipal
                      )
                      if (bodegaYaEnAdicionales) {
                        return false
                      }
                      // Excluir bodegas que ya están en inventoryByWarehouse (estado local)
                      return !inventoryByWarehouse.some(w => w.bodegaId === bodega.id)
                    })

                    if (bodegasDisponibles.length === 0) {
                      return (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">
                          No hay bodegas disponibles para agregar
                        </div>
                      )
                    }

                    return (
                      <>
                        {bodegasDisponibles.map((bodega) => (
                          <SelectItem key={bodega.id} value={bodega.id}>
                            {bodega.nombre}
                          </SelectItem>
                        ))}
                        {!editingWarehouseId && (
                          <>
                            <SelectSeparator className="bg-gray-200" />
                            <SelectItem
                              value="__create_new__"
                              className="text-camouflage-green-700 font-medium hover:!bg-camouflage-green-50 focus:!bg-camouflage-green-50 data-[highlighted]:!bg-camouflage-green-50"
                            >
                              <Plus className="mr-2 h-4 w-4 inline" />
                              Crear nueva bodega
                            </SelectItem>
                          </>
                        )}
                      </>
                    )
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
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-camouflage-green-500"
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
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-camouflage-green-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log("🔵 Botón Guardar bodega clickeado")
                  saveWarehouseEntry()
                }}
                disabled={isSavingBodega || addBodegaMutation.isPending || updateBodegaMutation.isPending}
              >
                {isSavingBodega || addBodegaMutation.isPending || updateBodegaMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </Modal>

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
              className="scrollbar-thin scrollbar-thumb-camouflage-green-300 scrollbar-track-gray-100 min-h-[80px] resize-none border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
              >
                Guardar
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
              className="scrollbar-thin scrollbar-thumb-camouflage-green-300 scrollbar-track-gray-100 min-h-[80px] resize-none border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
            >
              Guardar
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
    </MainLayout>
  )
}

