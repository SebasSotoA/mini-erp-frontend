"use client"

import { useState } from "react"
import { ShoppingCart, ShoppingBag, Package, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useInventory } from "@/contexts/inventory-context"

interface StockMovementModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  movementType: "purchase" | "sale"
}

export function StockMovementModal({
  isOpen,
  onClose,
  productId,
  productName,
  movementType,
}: StockMovementModalProps) {
  const { warehouses, addStockMovement } = useInventory()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    warehouseId: "",
    quantity: "",
    observation: "",
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    if (!formData.warehouseId) {
      toast({
        title: "Error de validación",
        description: "Debe seleccionar una bodega.",
        variant: "destructive",
      })
      return
    }
    
    const quantity = Number(formData.quantity)
    if (!quantity || quantity <= 0) {
      toast({
        title: "Error de validación",
        description: "La cantidad debe ser mayor a 0.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Determinar el tipo de movimiento
      const movementTypeMap = {
        purchase: "in" as const,
        sale: "out" as const,
      }
      
      const stockType = movementTypeMap[movementType]
      const finalQuantity = movementType === "sale" ? -quantity : quantity
      
      // Crear el movimiento
      addStockMovement({
        productId,
        productName,
        quantity: finalQuantity,
        type: stockType,
        reason: formData.observation || (movementType === "purchase" ? "Compra de producto" : "Venta de producto"),
        cost: undefined, // Se puede agregar costo unitario en el futuro
        reference: undefined, // Se puede agregar referencia de factura en el futuro
        warehouseId: formData.warehouseId,
        userId: "system", // Por ahora usamos "system", en el futuro se puede obtener del contexto de usuario
      })
      
      toast({
        title: movementType === "purchase" ? "Compra registrada" : "Venta registrada",
        description: `Se ha registrado la ${movementType === "purchase" ? "compra" : "venta"} de ${quantity} unidades de "${productName}".`,
      })
      
      // Limpiar formulario y cerrar modal
      setFormData({
        warehouseId: "",
        quantity: "",
        observation: "",
      })
      onClose()
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el movimiento. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const activeWarehouses = warehouses.filter(w => w.isActive)
  
  const modalTitle = movementType === "purchase" ? "Registrar Compra" : "Registrar Venta"
  const modalIcon = movementType === "purchase" ? ShoppingBag : ShoppingCart
  const IconComponent = modalIcon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-camouflage-green-200 bg-white">
        <DialogHeader className="border-b border-camouflage-green-200 pb-4">
          <DialogTitle className="flex items-center gap-2 text-camouflage-green-900">
            <IconComponent className="h-5 w-5 text-camouflage-green-600" />
            {modalTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información del producto */}
          <div className="rounded-lg border border-camouflage-green-200 bg-camouflage-green-50 p-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-camouflage-green-600" />
              <div>
                <p className="text-sm font-medium text-camouflage-green-800">Producto</p>
                <p className="text-sm text-camouflage-green-600">{productName}</p>
              </div>
            </div>
          </div>

          {/* Bodega */}
          <div className="space-y-2">
            <Label htmlFor="warehouse" className="font-medium text-camouflage-green-700">
              Bodega <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.warehouseId}
              onValueChange={(value) => handleInputChange("warehouseId", value)}
            >
              <SelectTrigger className="border-camouflage-green-300 bg-white focus:border-camouflage-green-500 focus:ring-camouflage-green-500">
                <SelectValue placeholder="Seleccionar bodega" />
              </SelectTrigger>
              <SelectContent className="rounded-3xl">
                {activeWarehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="font-medium text-camouflage-green-700">
              Cantidad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              placeholder="Ingresa la cantidad"
              value={formData.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
              className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            />
          </div>

          {/* Observación */}
          <div className="space-y-2">
            <Label htmlFor="observation" className="font-medium text-camouflage-green-700">
              Observación
            </Label>
            <Textarea
              id="observation"
              placeholder="Observaciones adicionales (opcional)"
              value={formData.observation}
              onChange={(e) => handleInputChange("observation", e.target.value)}
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

          {/* Advertencia para ventas */}
          {movementType === "sale" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Advertencia</p>
                  <p className="mt-1">Asegúrate de que hay suficiente stock disponible antes de registrar la venta.</p>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`${
                movementType === "purchase"
                  ? "bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
