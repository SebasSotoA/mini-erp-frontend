"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useInventory } from "@/contexts/inventory-context"
import { ShoppingCart, Plus, Search, Filter } from "lucide-react"

export default function SalesItems() {
  const { products } = useInventory()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-8 w-8 mr-3 text-blue-600" />
              Items de Venta
            </h1>
            <p className="text-gray-600 mt-1">Gestiona los productos disponibles para la venta</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Item
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar items de venta..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items Disponibles ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.slice(0, 9).map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <span className="text-lg font-bold text-green-600">${product.price}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                  <p className="text-sm text-gray-500 mb-3">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        product.stock > product.minStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      Stock: {product.stock}
                    </span>
                    <Button size="sm" variant="outline">
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
