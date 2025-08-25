"use client"

import type React from "react"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { useInventory } from "@/contexts/inventory-context"
import { Tags, Plus, Edit, Trash2, Package } from "lucide-react"

export default function Categories() {
  const { products, getStockByCategory } = useInventory()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")

  const stockByCategory = getStockByCategory()

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí agregarías la lógica para crear una nueva categoría
    console.log("Nueva categoría:", { name: newCategoryName, description: newCategoryDescription })
    setNewCategoryName("")
    setNewCategoryDescription("")
    setIsModalOpen(false)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Tags className="h-8 w-8 mr-3 text-purple-600" />
              Categorías
            </h1>
            <p className="text-gray-600 mt-1">Organiza tus productos por categorías</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>

        {/* Resumen de Categorías */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-purple-100 rounded-full">
                <Tags className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Categorías</p>
                <p className="text-2xl font-bold text-gray-900">{stockByCategory.length}</p>
                <p className="text-xs text-purple-600">Activas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Productos Totales</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-xs text-blue-600">En todas las categorías</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-green-100 rounded-full">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio por Categoría</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(products.length / stockByCategory.length)}
                </p>
                <p className="text-xs text-green-600">Productos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Categorías */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stockByCategory.map((category, index) => {
            const categoryProducts = products.filter((p) => p.category === category.category)
            const colors = [
              "bg-blue-500",
              "bg-green-500",
              "bg-purple-500",
              "bg-orange-500",
              "bg-red-500",
              "bg-indigo-500",
            ]

            return (
              <Card key={category.category} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-3 ${colors[index % colors.length]}`} />
                      {category.category}
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
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{categoryProducts.length}</p>
                      <p className="text-xs text-gray-600">Productos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{category.stock}</p>
                      <p className="text-xs text-gray-600">Unidades</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                    <p className="text-lg font-semibold text-green-600">
                      {new Intl.NumberFormat("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      }).format(category.value)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Productos principales:</p>
                    <div className="space-y-1">
                      {categoryProducts.slice(0, 3).map((product) => (
                        <div key={product.id} className="flex justify-between text-xs">
                          <span className="truncate">{product.name}</span>
                          <span className="text-gray-500">{product.stock}</span>
                        </div>
                      ))}
                      {categoryProducts.length > 3 && (
                        <p className="text-xs text-gray-500">+{categoryProducts.length - 3} más...</p>
                      )}
                    </div>
                  </div>

                  <Button size="sm" variant="outline" className="w-full bg-transparent">
                    Ver Todos los Productos
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Modal para Nueva Categoría */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Categoría">
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Categoría *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Electrónicos, Ropa, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Descripción opcional de la categoría..."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Categoría</Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  )
}
