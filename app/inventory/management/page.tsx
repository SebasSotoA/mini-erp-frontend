"use client"

import { useState } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInventory } from "@/contexts/inventory-context"
import { Search, Plus, Edit, Trash2, Eye, Settings, Filter } from "lucide-react"

export default function ItemManagement() {
  const { products, deleteProduct } = useInventory()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  const categories = Array.from(new Set(products.map((product) => product.category)))

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      deleteProduct(id)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Settings className="h-8 w-8 mr-3 text-blue-600" />
              Gestión de Items
            </h1>
            <p className="text-gray-600 mt-1">Administra todos los productos del inventario</p>
          </div>
          <Link href="/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </Link>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas las Categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Más Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Productos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-gray-50">
                  <TableHead className="w-[250px] text-gray-500 font-medium">
                    <div className="pl-1.5">
                      Producto
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] text-gray-500 font-medium">
                    <div className="pl-1.5">
                      SKU
                    </div>
                  </TableHead>
                  <TableHead className="w-[140px] text-gray-500 font-medium">
                    <div className="pl-1.5">
                      Categoría
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px] text-gray-500 font-medium">
                    <div className="pl-1.5">
                      Precio
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] text-gray-500 font-medium">
                    <div className="pl-1.5">
                      Stock
                    </div>
                  </TableHead>
                  <TableHead className="w-[140px] text-gray-500 font-medium">
                    <div className="pl-1.5">
                      Estado
                    </div>
                  </TableHead>
                  <TableHead className="w-[160px] text-gray-500 font-medium pl-1.5">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow 
                    key={product.id}
                    className="border-gray-200 hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="w-[250px] pl-1.5">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[120px] pl-1.5">
                      <div className="text-sm text-gray-900 font-mono">{product.sku}</div>
                    </TableCell>
                    <TableCell className="w-[140px] pl-1.5">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="w-[100px] pl-1.5">
                      <div className="text-sm text-gray-900">${product.price.toFixed(2)}</div>
                    </TableCell>
                    <TableCell className="w-[120px] pl-1.5">
                      <div className="text-sm text-gray-900">{product.stock} unidades</div>
                    </TableCell>
                    <TableCell className="w-[140px] pl-1.5">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.stock < product.minStock
                            ? "bg-red-100 text-red-800"
                            : product.stock > product.maxStock
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {product.stock < product.minStock
                          ? "Stock Bajo"
                          : product.stock > product.maxStock
                            ? "Sobrestock"
                            : "Normal"}
                      </span>
                    </TableCell>
                    <TableCell className="w-[160px]">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-transparent hover:border-gray-200"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-transparent hover:border-gray-200"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-transparent hover:border-gray-200"
                          onClick={() => handleDelete(product.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
