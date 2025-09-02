"use client"

import { useState } from "react"
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

interface FormData {
  type: ItemType
  name: string
  unitOfMeasure: string
  warehouse: string
  basePrice: string
  tax: string
  totalPrice: string
  quantity: string
  initialCost: string
}

export function NewItemForm({ onClose, onSuccess }: NewItemFormProps) {
  const { addProduct } = useInventory()
  const [itemType, setItemType] = useState<ItemType>("product")
  const [formData, setFormData] = useState<FormData>({
    type: "product",
    name: "",
    unitOfMeasure: "",
    warehouse: "Principal",
    basePrice: "",
    tax: "",
    totalPrice: "",
    quantity: "",
    initialCost: ""
  })

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Cálculo bidireccional de precios
      if (field === "basePrice" || field === "tax") {
        // Calcular precio total desde precio base + impuesto
        const basePrice = parseFloat(field === "basePrice" ? value : updated.basePrice) || 0
        const taxPercent = parseFloat(field === "tax" ? value : updated.tax) || 0
        const taxAmount = (basePrice * taxPercent) / 100
        const total = basePrice + taxAmount
        updated.totalPrice = total > 0 ? total.toFixed(2) : ""
      } else if (field === "totalPrice") {
        // Calcular precio base desde precio total - impuesto
        const total = parseFloat(value) || 0
        const taxPercent = parseFloat(updated.tax) || 0
        if (taxPercent > 0) {
          const basePrice = total / (1 + taxPercent / 100)
          updated.basePrice = basePrice > 0 ? basePrice.toFixed(2) : ""
        } else {
          updated.basePrice = total > 0 ? total.toFixed(2) : ""
        }
      }
      
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación básica
    if (!formData.name.trim()) {
      alert("Por favor ingresa un nombre")
      return
    }

    const newProduct = {
      name: formData.name,
      sku: `SKU-${Date.now()}`,
      description: `${itemType === "product" ? "Producto" : "Servicio"}: ${formData.name}`,
      price: parseFloat(formData.totalPrice) || 0,
      cost: parseFloat(formData.initialCost) || 0,
      stock: parseInt(formData.quantity) || 0,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <TooltipProvider>
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
            onClick={() => {
              setItemType("product")
              setFormData(prev => ({
                ...prev,
                type: "product",
                // Restaurar valores típicos de producto
                unitOfMeasure: prev.unitOfMeasure || "",
              }))
            }}
          />
          <ItemTypeButton
            type="service"
            label="Servicio"
            isSelected={itemType === "service"}
            onClick={() => {
              setItemType("service")
              setFormData(prev => ({
                ...prev,
                type: "service",
                // Por defecto para servicio
                unitOfMeasure: "Servicio",
              }))
            }}
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
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
            placeholder="Ingresa el nombre del producto"
            required
          />
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
          <Select value={formData.unitOfMeasure} onValueChange={(value) => handleInputChange("unitOfMeasure", value)}>
            <SelectTrigger className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none">
              <SelectValue placeholder="Selecciona una unidad" className="text-gray-500" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" avoidCollisions={false}>
              {itemType === "product" ? (
                <>
                  {/* Unidad */}
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                    Unidad
                  </div>
                  <SelectItem value="Unidad">Unidad</SelectItem>
                  <SelectItem value="Pieza">Pieza</SelectItem>
                  <SelectItem value="Paquete">Paquete</SelectItem>
                  <SelectItem value="Caja">Caja</SelectItem>
                  <SelectItem value="Docena">Docena</SelectItem>
                  
                  {/* Longitud */}
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">
                    Longitud
                  </div>
                  <SelectItem value="Metro">Metro</SelectItem>
                  <SelectItem value="Centímetro">Centímetro</SelectItem>
                  <SelectItem value="Kilómetro">Kilómetro</SelectItem>
                  <SelectItem value="Pulgada">Pulgada</SelectItem>
                  <SelectItem value="Pie">Pie</SelectItem>
                  
                  {/* Área */}
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">
                    Área
                  </div>
                  <SelectItem value="Metro²">Metro²</SelectItem>
                  <SelectItem value="Centímetro²">Centímetro²</SelectItem>
                  <SelectItem value="Hectárea">Hectárea</SelectItem>
                  
                  {/* Volumen */}
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 mt-2">
                    Volumen
                  </div>
                  <SelectItem value="Litro">Litro</SelectItem>
                  <SelectItem value="Mililitro">Mililitro</SelectItem>
                  <SelectItem value="Metro³">Metro³</SelectItem>
                  <SelectItem value="Galón">Galón</SelectItem>
                  
                  {/* Peso */}
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
                  {/* Servicio */}
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                    Servicio
                  </div>
                  <SelectItem value="Servicio">Servicio</SelectItem>
                  <SelectItem value="Consultoría">Consultoría</SelectItem>
                  <SelectItem value="Proyecto">Proyecto</SelectItem>
                  
                  {/* Tiempo */}
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="warehouse" className="text-sm font-medium text-gray-700">
            Bodega <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.warehouse} onValueChange={(value) => handleInputChange("warehouse", value)}>
            <SelectTrigger className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none">
              <SelectValue placeholder="Selecciona una bodega" className="text-gray-500" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Principal">Principal</SelectItem>
              <SelectItem value="Secundaria">Secundaria</SelectItem>
              <SelectItem value="Almacén">Almacén</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Segunda fila: Precios */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="basePrice" className="text-sm font-medium text-gray-700">
              Precio base <span className="text-red-500">*</span>
            </Label>
            <Input
              id="basePrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.basePrice}
              onChange={(e) => handleInputChange("basePrice", e.target.value)}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
              placeholder="0.00"
            />
          </div>
          
          <div className="flex items-center justify-center mt-6">
            <Plus className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="w-32 space-y-2">
            <Label htmlFor="tax" className="text-sm font-medium text-gray-700">
              Impuesto
            </Label>
            <Select value={formData.tax} onValueChange={(value) => handleInputChange("tax", value)}>
              <SelectTrigger className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none">
                <SelectValue placeholder="Ninguno (0%)" className="text-gray-500" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Ninguno (0%)</SelectItem>
                <SelectItem value="5">IVA - (5%)</SelectItem>
                <SelectItem value="19">IVA - (19%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-center mt-6">
            <span className="text-gray-400 text-lg">=</span>
          </div>
          
          <div className="flex-1 space-y-2">
            <Label htmlFor="totalPrice" className="text-sm font-medium text-gray-700">
              Precio Total <span className="text-red-500">*</span>
            </Label>
            <Input
              id="totalPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.totalPrice}
              onChange={(e) => handleInputChange("totalPrice", e.target.value)}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Tercera fila: Cantidad y Costo inicial (solo Producto) */}
      {itemType === "product" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
              Cantidad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
              placeholder="Ingresa la cantidad inicial"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
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
              value={formData.initialCost}
              onChange={(e) => handleInputChange("initialCost", e.target.value)}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
              placeholder="0.00"
            />
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
