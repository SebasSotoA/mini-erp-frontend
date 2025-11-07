"use client"

import { useState, useEffect, useMemo } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, X } from "lucide-react"

interface ProviderData {
  name: string
  identificacion: string
  correo: string
  observaciones: string
}

interface EditProviderModalProps {
  isOpen: boolean
  onClose: () => void
  provider: {
    id: string
    name: string
    identificacion: string
    correo?: string | null
    observaciones?: string | null
  }
  onSave: (data: ProviderData) => void
  isLoading?: boolean
}

export function EditProviderModal({ isOpen, onClose, provider, onSave, isLoading = false }: EditProviderModalProps) {
  const { toast } = useToast()
  const [editData, setEditData] = useState<ProviderData>({
    name: "",
    identificacion: "",
    correo: "",
    observaciones: "",
  })
  const [hasInvalidTaxIdError, setHasInvalidTaxIdError] = useState(false)
  const [showInvalidTaxIdToast, setShowInvalidTaxIdToast] = useState(false)

  // Sincronizar datos cuando cambie el proveedor o se abra el modal
  useEffect(() => {
    if (isOpen && provider) {
      setEditData({
        name: provider.name || "",
        identificacion: provider.identificacion || "",
        correo: provider.correo || "",
        observaciones: provider.observaciones || "",
      })
    }
  }, [isOpen, provider])

  const handleInputChange = (field: keyof ProviderData, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }))
    // Si se está editando la identificación y hay un error, limpiarlo cuando el usuario empiece a escribir
    if (field === "identificacion" && hasInvalidTaxIdError) {
      setHasInvalidTaxIdError(false)
    }
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

    if (!editData.identificacion.trim()) {
      toast({
        title: "Error",
        description: "La identificación es obligatoria",
        variant: "destructive",
      })
      return
    }

    // Validar formato de identificación antes de enviar
    const taxIdRegex = /^[0-9-]+$/
    if (!taxIdRegex.test(editData.identificacion.trim())) {
      setHasInvalidTaxIdError(true)
      setShowInvalidTaxIdToast(true)
      setTimeout(() => setShowInvalidTaxIdToast(false), 5000)
      return
    }

    // Si llegamos aquí, la validación pasó
    setHasInvalidTaxIdError(false)

    // Llamar a onSave
    onSave(editData)
  }

  const handleCancel = () => {
    // Restaurar datos originales
    setEditData({
      name: provider.name || "",
      identificacion: provider.identificacion || "",
      correo: provider.correo || "",
      observaciones: provider.observaciones || "",
    })
    setHasInvalidTaxIdError(false)
    setShowInvalidTaxIdToast(false)
    onClose()
  }

  // Verificar si hay cambios en los datos de edición
  const hasChanges = useMemo(() => {
    const nameChanged = editData.name.trim() !== (provider.name || "").trim()
    const identificacionChanged = editData.identificacion.trim() !== (provider.identificacion || "").trim()
    const correoChanged = (editData.correo || "").trim() !== (provider.correo || "").trim()
    const observacionesChanged = (editData.observaciones || "").trim() !== (provider.observaciones || "").trim()

    return nameChanged || identificacionChanged || correoChanged || observacionesChanged
  }, [editData, provider])

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Editar Proveedor" size="lg">
      <div className="space-y-4">
        <div className="space-y-1 pt-2.5">
          <Label htmlFor="edit-provider-name" className="font-medium text-camouflage-green-700">
            Nombre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="edit-provider-name"
            type="text"
            placeholder="Ingresa el nombre del proveedor"
            value={editData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-provider-identificacion" className="font-medium text-camouflage-green-700">
            Identificación <span className="text-red-500">*</span>
          </Label>
          <Input
            id="edit-provider-identificacion"
            type="text"
            placeholder="Ingresa la identificación del proveedor"
            value={editData.identificacion}
            onChange={(e) => handleInputChange("identificacion", e.target.value)}
            className={`bg-white placeholder:text-gray-400 ${
              hasInvalidTaxIdError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-camouflage-green-300 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            }`}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-provider-correo" className="font-medium text-camouflage-green-700">
            Correo
          </Label>
          <Input
            id="edit-provider-correo"
            type="email"
            placeholder="Ingresa el correo del proveedor"
            value={editData.correo}
            onChange={(e) => handleInputChange("correo", e.target.value)}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-provider-observaciones" className="font-medium text-camouflage-green-700">
            Observaciones
          </Label>
          <Textarea
            id="edit-provider-observaciones"
            placeholder="Ingresa observaciones adicionales sobre el proveedor"
            value={editData.observaciones}
            onChange={(e) => handleInputChange("observaciones", e.target.value)}
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

      {/* Toast específico para identificación inválida (solo números y guiones) */}
      {showInvalidTaxIdToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              La identificación solo puede contener números y guiones.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInvalidTaxIdToast(false)}
              className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}




