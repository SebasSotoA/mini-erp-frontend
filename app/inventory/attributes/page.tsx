"use client"

import type React from "react"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Layers, Plus, Edit, Trash2, Tag, Type, Palette, Ruler } from "lucide-react"

const attributes = [
  {
    id: "1",
    name: "Color",
    type: "select",
    values: ["Rojo", "Azul", "Verde", "Negro", "Blanco"],
    icon: Palette,
    productsCount: 45,
  },
  {
    id: "2",
    name: "Tamaño",
    type: "select",
    values: ["XS", "S", "M", "L", "XL", "XXL"],
    icon: Ruler,
    productsCount: 32,
  },
  {
    id: "3",
    name: "Material",
    type: "text",
    values: ["Algodón", "Poliéster", "Cuero", "Metal", "Plástico"],
    icon: Type,
    productsCount: 28,
  },
  {
    id: "4",
    name: "Marca",
    type: "select",
    values: ["Apple", "Samsung", "Sony", "Dell", "HP"],
    icon: Tag,
    productsCount: 67,
  },
]

export default function Attributes() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newAttributeName, setNewAttributeName] = useState("")
  const [newAttributeType, setNewAttributeType] = useState("select")
  const [newAttributeValues, setNewAttributeValues] = useState("")

  const handleAddAttribute = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí agregarías la lógica para crear un nuevo atributo
    console.log("Nuevo atributo:", {
      name: newAttributeName,
      type: newAttributeType,
      values: newAttributeValues.split(",").map((v) => v.trim()),
    })
    setNewAttributeName("")
    setNewAttributeType("select")
    setNewAttributeValues("")
    setIsModalOpen(false)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Layers className="h-8 w-8 mr-3 text-indigo-600" />
              Atributos
            </h1>
            <p className="text-gray-600 mt-1">Define características específicas para tus productos</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Atributo
          </Button>
        </div>

        {/* Resumen de Atributos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Layers className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Atributos</p>
                <p className="text-2xl font-bold text-gray-900">{attributes.length}</p>
                <p className="text-xs text-indigo-600">Configurados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-green-100 rounded-full">
                <Tag className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Productos con Atributos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attributes.reduce((sum, attr) => sum + attr.productsCount, 0)}
                </p>
                <p className="text-xs text-green-600">Asignaciones totales</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <Type className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tipos de Atributos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {[...new Set(attributes.map((attr) => attr.type))].length}
                </p>
                <p className="text-xs text-blue-600">Diferentes tipos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Atributos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attributes.map((attribute) => (
            <Card key={attribute.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <attribute.icon className="h-5 w-5 mr-3 text-indigo-600" />
                    {attribute.name}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tipo:</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      attribute.type === "select" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {attribute.type === "select" ? "Selección" : "Texto"}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Valores disponibles:</p>
                  <div className="flex flex-wrap gap-1">
                    {attribute.values.slice(0, 4).map((value, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {value}
                      </span>
                    ))}
                    {attribute.values.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                        +{attribute.values.length - 4} más
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Productos usando este atributo:</span>
                  <span className="font-semibold text-indigo-600">{attribute.productsCount}</span>
                </div>

                <Button size="sm" variant="outline" className="w-full bg-transparent">
                  Ver Productos
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal para Nuevo Atributo */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Atributo">
          <form onSubmit={handleAddAttribute} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Atributo *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value)}
                placeholder="Ej: Color, Tamaño, Material..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Atributo *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={newAttributeType}
                onChange={(e) => setNewAttributeType(e.target.value)}
              >
                <option value="select">Selección (lista de opciones)</option>
                <option value="text">Texto libre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valores Posibles *</label>
              <textarea
                rows={3}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={newAttributeValues}
                onChange={(e) => setNewAttributeValues(e.target.value)}
                placeholder="Separa los valores con comas. Ej: Rojo, Azul, Verde, Negro"
              />
              <p className="text-xs text-gray-500 mt-1">Separa cada valor con una coma</p>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Atributo</Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  )
}
