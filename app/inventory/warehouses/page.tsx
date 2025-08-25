"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Warehouse, Plus, MapPin, Package, Users } from "lucide-react"

const warehouses = [
  {
    id: "1",
    name: "Bodega Principal",
    location: "Madrid, España",
    capacity: 10000,
    occupied: 7500,
    manager: "Ana García",
    status: "active",
  },
  {
    id: "2",
    name: "Bodega Norte",
    location: "Barcelona, España",
    capacity: 5000,
    occupied: 3200,
    manager: "Carlos López",
    status: "active",
  },
  {
    id: "3",
    name: "Bodega Sur",
    location: "Sevilla, España",
    capacity: 3000,
    occupied: 2800,
    manager: "María Rodríguez",
    status: "maintenance",
  },
]

export default function Warehouses() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Warehouse className="h-8 w-8 mr-3 text-blue-600" />
              Bodegas
            </h1>
            <p className="text-gray-600 mt-1">Gestiona las ubicaciones de almacenamiento</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Bodega
          </Button>
        </div>

        {/* Resumen de Bodegas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <Warehouse className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bodegas</p>
                <p className="text-2xl font-bold text-gray-900">{warehouses.length}</p>
                <p className="text-xs text-blue-600">
                  Activas: {warehouses.filter((w) => w.status === "active").length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-green-100 rounded-full">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Capacidad Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {warehouses.reduce((sum, w) => sum + w.capacity, 0).toLocaleString()}
                </p>
                <p className="text-xs text-green-600">Unidades</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ocupación Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    (warehouses.reduce((sum, w) => sum + w.occupied / w.capacity, 0) / warehouses.length) * 100,
                  )}
                  %
                </p>
                <p className="text-xs text-orange-600">Del total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Bodegas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center">
                    <Warehouse className="h-5 w-5 mr-2 text-blue-600" />
                    {warehouse.name}
                  </CardTitle>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      warehouse.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {warehouse.status === "active" ? "Activa" : "Mantenimiento"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm">{warehouse.location}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ocupación</span>
                    <span className="font-medium">
                      {warehouse.occupied.toLocaleString()} / {warehouse.capacity.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (warehouse.occupied / warehouse.capacity) > 0.9
                          ? "bg-red-500"
                          : warehouse.occupied / warehouse.capacity > 0.7
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${(warehouse.occupied / warehouse.capacity) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round((warehouse.occupied / warehouse.capacity) * 100)}% ocupado
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm">Responsable: {warehouse.manager}</span>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    Ver Detalles
                  </Button>
                  <Button size="sm" variant="outline">
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
