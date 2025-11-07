"use client"

import { useState, useEffect, useMemo } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface WarehouseData {
  name: string
  location: string
  observations: string
}

interface EditWarehouseModalProps {
  isOpen: boolean
  onClose: () => void
  warehouse: {
    id: string
    name: string
    location: string
    observations?: string
  }
  onSave: (data: WarehouseData) => void
  isLoading?: boolean
}

export function EditWarehouseModal({ isOpen, onClose, warehouse, onSave, isLoading = false }: EditWarehouseModalProps) {
  const { toast } = useToast()
  const [editData, setEditData] = useState<WarehouseData>({
    name: "",
    location: "",
    observations: "",
  })

  // Sincronizar datos cuando cambie la bodega o se abra el modal
  useEffect(() => {
    if (isOpen && warehouse) {
      setEditData({
        name: warehouse.name || "",
        location: warehouse.location || "",
        observations: warehouse.observations || "",
      })
    }
  }, [isOpen, warehouse])

  const handleInputChange = (field: keyof WarehouseData, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (!editData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      })
      return
    }

    onSave(editData)
  }

  const handleCancel = () => {
    // Restaurar datos originales
    setEditData({
      name: warehouse.name || "",
      location: warehouse.location || "",
      observations: warehouse.observations || "",
    })
    onClose()
  }

  // Verificar si hay cambios en los datos de edición
  const hasChanges = useMemo(() => {
    const nameChanged = editData.name.trim() !== (warehouse.name || "").trim()
    const locationChanged = editData.location.trim() !== (warehouse.location || "").trim()
    const observationsChanged = (editData.observations || "").trim() !== (warehouse.observations || "").trim()

    return nameChanged || locationChanged || observationsChanged
  }, [editData, warehouse])

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Editar Bodega" size="lg">
      <div className="space-y-4">
        <div className="space-y-1 pt-2.5">
          <Label htmlFor="edit-warehouse-name" className="font-medium text-camouflage-green-700">
            Nombre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="edit-warehouse-name"
            type="text"
            placeholder="Ingresa el nombre de la bodega"
            value={editData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-warehouse-location" className="font-medium text-camouflage-green-700">
            Dirección
          </Label>
          <Input
            id="edit-warehouse-location"
            type="text"
            placeholder="Ingresa la dirección de la bodega"
            value={editData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-warehouse-observations" className="font-medium text-camouflage-green-700">
            Observaciones
          </Label>
          <Textarea
            id="edit-warehouse-observations"
            placeholder="Ingresa observaciones adicionales sobre la bodega"
            value={editData.observations}
            onChange={(e) => handleInputChange("observations", e.target.value)}
            className="scrollbar-thin scrollbar-thumb-camouflage-green-300 scrollbar-track-gray-100 min-h-[80px] resize-none border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            style={{
              outline: "none",
              boxShadow: "none",
            }}
            onFocus={(e) => {
              e.target.style.outline = "none"
              e.target.style.boxShadow = "none"
            }}
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-camouflage-green-700 text-white hover:bg-camouflage-green-800"
            disabled={isLoading || !hasChanges}
          >
            {isLoading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
