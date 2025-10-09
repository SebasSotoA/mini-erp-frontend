"use client"

import { useState } from "react"
import { Plus, Search, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useInventory } from "@/contexts/inventory-context"

export default function PurchaseInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const { purchaseInvoices } = useInventory()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Borrador</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturas de Compra</h1>
          <p className="text-gray-600">Gestiona las facturas de compra a proveedores</p>
        </div>
        <Button className="bg-camouflage-green-600 hover:bg-camouflage-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Factura
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por número de factura o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros Avanzados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Facturas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Facturas de Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-medium text-gray-700">Número</th>
                  <th className="p-3 text-left font-medium text-gray-700">Fecha</th>
                  <th className="p-3 text-left font-medium text-gray-700">Bodega</th>
                  <th className="p-3 text-left font-medium text-gray-700">Proveedor</th>
                  <th className="p-3 text-left font-medium text-gray-700">Total</th>
                  <th className="p-3 text-left font-medium text-gray-700">Estado</th>
                  <th className="p-3 text-left font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {purchaseInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{invoice.invoiceNumber}</td>
                    <td className="p-3 text-gray-600">
                      {new Date(invoice.date).toLocaleDateString("es-ES")}
                    </td>
                    <td className="p-3 text-gray-600">{invoice.warehouseName}</td>
                    <td className="p-3 text-gray-600">{invoice.supplierName}</td>
                    <td className="p-3 font-medium">
                      ${invoice.totalAmount.toLocaleString("es-ES")}
                    </td>
                    <td className="p-3">{getStatusBadge(invoice.status)}</td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Ver
                        </Button>
                        <Button size="sm" variant="outline">
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Información de desarrollo */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-sm text-blue-800">
            <strong>Estado del desarrollo:</strong> Esta página está en construcción. 
            Próximamente se implementarán las funcionalidades completas de gestión de facturas de compra.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
