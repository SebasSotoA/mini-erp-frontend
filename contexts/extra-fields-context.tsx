"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

export interface ExtraField {
  id: string
  name: string
  type: "texto" | "número" | "número decimal" | "fecha" | "si/no"
  description: string
  defaultValue: string
  isRequired: boolean
  isActive: boolean
}

interface ExtraFieldsContextType {
  extraFields: ExtraField[]
  addExtraField: (field: Omit<ExtraField, "id">) => void
  updateExtraField: (id: string, field: Partial<ExtraField>) => void
  deleteExtraField: (id: string) => void
  getRequiredFields: () => ExtraField[]
}

const ExtraFieldsContext = createContext<ExtraFieldsContextType | undefined>(undefined)

// Datos iniciales de campos extra (similares a los del módulo de campos extra)
const initialExtraFields: ExtraField[] = [
  {
    id: "1",
    name: "Color",
    type: "texto",
    description: "Color principal del producto",
    defaultValue: "Blanco",
    isRequired: true,
    isActive: true,
  },
  {
    id: "2",
    name: "Peso",
    type: "número decimal",
    description: "Peso del producto en kilogramos",
    defaultValue: "0.00",
    isRequired: false,
    isActive: true,
  },
  {
    id: "3",
    name: "Fecha de Vencimiento",
    type: "fecha",
    description: "Fecha de vencimiento del producto",
    defaultValue: "",
    isRequired: false,
    isActive: true,
  },
  {
    id: "4",
    name: "Es Importado",
    type: "si/no",
    description: "Indica si el producto es importado",
    defaultValue: "No",
    isRequired: true,
    isActive: false,
  },
]

export function ExtraFieldsProvider({ children }: { children: React.ReactNode }) {
  const [extraFields, setExtraFields] = useState<ExtraField[]>(initialExtraFields)

  const addExtraField = (field: Omit<ExtraField, "id">) => {
    const newField: ExtraField = {
      id: String(extraFields.length + 1),
      ...field,
    }
    setExtraFields([...extraFields, newField])
  }

  const updateExtraField = (id: string, field: Partial<ExtraField>) => {
    setExtraFields(extraFields.map((f) => (f.id === id ? { ...f, ...field } : f)))
  }

  const deleteExtraField = (id: string) => {
    setExtraFields(extraFields.filter((f) => f.id !== id))
  }

  const getRequiredFields = () => {
    return extraFields.filter((field) => field.isRequired && field.isActive)
  }

  return (
    <ExtraFieldsContext.Provider
      value={{
        extraFields,
        addExtraField,
        updateExtraField,
        deleteExtraField,
        getRequiredFields,
      }}
    >
      {children}
    </ExtraFieldsContext.Provider>
  )
}

export function useExtraFields() {
  const context = useContext(ExtraFieldsContext)
  if (context === undefined) {
    throw new Error("useExtraFields must be used within an ExtraFieldsProvider")
  }
  return context
}
