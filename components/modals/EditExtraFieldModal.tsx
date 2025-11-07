"use client"

import { useState, useEffect, useMemo } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { mapTipoDatoFrontendToBackend, mapTipoDatoBackendToFrontend } from "@/hooks/api/use-campos-extra"

interface ExtraFieldData {
  name: string
  type: string
  description: string
  defaultValue: string
  isRequired: boolean
}

interface EditExtraFieldModalProps {
  isOpen: boolean
  onClose: () => void
  field: {
    id: string
    name: string
    type: string
    description?: string
    defaultValue?: string
    isRequired: boolean
  }
  onSave: (data: { nombre: string; tipoDato: string; descripcion: string | null; valorPorDefecto: string | null; esRequerido: boolean }) => Promise<void>
  isLoading?: boolean
}

export function EditExtraFieldModal({ isOpen, onClose, field, onSave, isLoading = false }: EditExtraFieldModalProps) {
  const { toast } = useToast()
  const [editData, setEditData] = useState<ExtraFieldData>({
    name: "",
    type: "texto",
    description: "",
    defaultValue: "",
    isRequired: false,
  })

  // Sincronizar datos cuando cambie el campo o se abra el modal
  useEffect(() => {
    if (isOpen && field) {
      setEditData({
        name: field.name || "",
        type: mapTipoDatoBackendToFrontend(field.type) || "texto",
        description: field.description || "",
        defaultValue: field.defaultValue || "",
        isRequired: field.isRequired || false,
      })
    }
  }, [isOpen, field])

  const handleInputChange = (field: keyof ExtraFieldData, value: string | boolean) => {
    setEditData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!editData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      })
      return
    }

    await onSave({
      nombre: editData.name.trim(),
      tipoDato: mapTipoDatoFrontendToBackend(editData.type),
      descripcion: editData.description.trim() || null,
      valorPorDefecto: editData.defaultValue.trim() || null,
      esRequerido: editData.isRequired,
    })
  }

  const handleCancel = () => {
    // Restaurar datos originales
    if (field) {
      setEditData({
        name: field.name || "",
        type: mapTipoDatoBackendToFrontend(field.type) || "texto",
        description: field.description || "",
        defaultValue: field.defaultValue || "",
        isRequired: field.isRequired || false,
      })
    }
    onClose()
  }

  // Verificar si hay cambios en los datos de edición
  const hasChanges = useMemo(() => {
    if (!field) return false

    const originalType = mapTipoDatoBackendToFrontend(field.type) || "texto"
    const nameChanged = editData.name.trim() !== (field.name || "").trim()
    const typeChanged = editData.type !== originalType
    const descriptionChanged = (editData.description || "").trim() !== (field.description || "").trim()
    const defaultValueChanged = (editData.defaultValue || "").trim() !== (field.defaultValue || "").trim()
    const isRequiredChanged = editData.isRequired !== (field.isRequired || false)

    return nameChanged || typeChanged || descriptionChanged || defaultValueChanged || isRequiredChanged
  }, [editData, field])

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
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        )
      
      case "fecha":
        return (
          <input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-camouflage-green-300 bg-white px-3 py-2 text-sm text-camouflage-green-900 placeholder-camouflage-green-400 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 focus:border-camouflage-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
        )
      
      case "si/no":
        return (
          <Select value={value} onValueChange={onChange} disabled={isLoading}>
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
            disabled={isLoading}
          />
        )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Editar Campo Extra" size="lg">
      <div className="space-y-4">
        <div className="space-y-1 pt-2.5">
          <Label htmlFor="edit-field-name" className="font-medium text-camouflage-green-700">
            Nombre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="edit-field-name"
            type="text"
            placeholder="Ej: Color, Peso, Fecha de Vencimiento..."
            value={editData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-field-type" className="font-medium text-camouflage-green-700">
            Tipo de Campo <span className="text-red-500">*</span>
          </Label>
          <Select
            value={editData.type}
            onValueChange={(value) => handleInputChange("type", value)}
            disabled={isLoading}
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
          <Label htmlFor="edit-field-default" className="font-medium text-camouflage-green-700">
            Valor por Defecto
          </Label>
          {renderDefaultValueInput(
            editData.type,
            editData.defaultValue,
            (value) => handleInputChange("defaultValue", value)
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-field-description" className="font-medium text-camouflage-green-700">
            Descripción
          </Label>
          <Textarea
            id="edit-field-description"
            placeholder="Descripción del campo adicional"
            value={editData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
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

        <div className="flex items-center space-x-2">
          <Checkbox
            id="edit-field-required"
            checked={editData.isRequired}
            onCheckedChange={(checked) => handleInputChange("isRequired", checked as boolean)}
            disabled={isLoading}
          />
          <Label htmlFor="edit-field-required" className="text-sm font-medium text-camouflage-green-700">
            Campo requerido
          </Label>
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

