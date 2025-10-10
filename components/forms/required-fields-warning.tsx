"use client"

import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useExtraFields } from "@/contexts/extra-fields-context"

interface RequiredFieldsWarningProps {
  onFieldChange: (fieldId: string, value: string) => void
  fieldValues: Record<string, string>
}

export function RequiredFieldsWarning({ onFieldChange, fieldValues }: RequiredFieldsWarningProps) {
  const { getRequiredFields } = useExtraFields()
  const [isExpanded, setIsExpanded] = useState(false)
  
  const requiredFields = getRequiredFields()
  
  if (requiredFields.length === 0) {
    return null
  }

  // Función para obtener el valor actual del campo
  const getFieldValue = (field: any) => {
    // Si el usuario ya ingresó un valor, usar ese
    if (fieldValues[field.id] !== undefined) {
      return fieldValues[field.id]
    }
    // Si no, usar el valor por defecto del campo
    return field.defaultValue || ""
  }

  const renderFieldInput = (field: any) => {
    const value = getFieldValue(field)
    
    switch (field.type) {
      case "texto":
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
      
      case "número":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
      
      case "número decimal":
        return (
          <Input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
      
      case "fecha":
        return (
          <DatePicker
            value={value ? new Date(value) : null}
            onChange={(date) => onFieldChange(field.id, date ? date.toISOString().split('T')[0] : "")}
            placeholder="Seleccionar fecha"
            className="border-camouflage-green-300 bg-white focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
      
      case "si/no":
        return (
          <Select value={value} onValueChange={(val) => onFieldChange(field.id, val)}>
            <SelectTrigger className="border-camouflage-green-300 bg-white focus:border-camouflage-green-500 focus:ring-camouflage-green-500">
              <SelectValue placeholder="Selecciona una opción" />
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
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            className="border-camouflage-green-300 bg-white placeholder:text-gray-400 focus:border-camouflage-green-500 focus:ring-camouflage-green-500"
          />
        )
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
              <span className="text-sm font-bold text-orange-700">
                {requiredFields.length}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-900">
                Campos adicionales obligatorios
              </h3>
              <p className="text-sm text-orange-700">
                Completa tus campos obligatorios antes de crear el producto.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-orange-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-orange-600" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-1">
          <div className="space-y-4">
            {requiredFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={`required-field-${field.id}`} className="text-sm font-medium text-orange-800">
                  {field.name} <span className="text-red-500">*</span>
                </Label>
                {renderFieldInput(field)}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
