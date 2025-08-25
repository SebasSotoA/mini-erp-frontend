"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useInventory } from "@/contexts/inventory-context"
import { Download, FileText, TrendingUp, Package, DollarSign, AlertTriangle } from "lucide-react"

export default function Reports() {
  const { products, stockMovements, sales, getFinancialMetrics } = useInventory()
  const [selectedReport, setSelectedReport] = useState("inventory")
  const [dateRange, setDateRange] = useState("30")

  const financialMetrics = getFinancialMetrics()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value)
  }

  const generateInventoryReport = () => {
    return products.map((product) => ({
      SKU: product.sku,
      Nombre: product.name,
      Categoría: product.category,
      "Stock Actual": product.stock,
      "Stock Mínimo": product.minStock,
      "Precio Venta": formatCurrency(product.price),
      "Costo Unitario": formatCurrency(product.cost),
      "Valor Total": formatCurrency(product.price * product.stock),
      "Margen %": (((product.price - product.cost) / product.price) * 100).toFixed(1) + "%",
      Proveedor: product.supplier,
      "Última Venta": product.lastSold || "N/A",
      "Total Vendido": product.totalSold,
    }))
  }

  const generateFinancialReport = () => {
    return [
      {
        Métrica: "Valor Total del Inventario",
        Valor: formatCurrency(financialMetrics.totalInventoryValue),
        Descripción: "Valor total de todos los productos en stock",
      },
      {
        Métrica: "Costo Total del Inventario",
        Valor: formatCurrency(financialMetrics.totalInventoryCost),
        Descripción: "Costo total de adquisición del inventario actual",
      },
      {
        Métrica: "Margen Bruto Global",
        Valor: financialMetrics.grossMargin.toFixed(1) + "%",
        Descripción: "Margen de ganancia promedio del inventario",
      },
      {
        Métrica: "Rotación de Inventario",
        Valor: financialMetrics.inventoryTurnover.toFixed(2) + "x",
        Descripción: "Número de veces que se renueva el inventario por año",
      },
      {
        Métrica: "Días de Inventario Pendiente",
        Valor: financialMetrics.daysInventoryOutstanding.toFixed(0) + " días",
        Descripción: "Tiempo promedio para vender el inventario actual",
      },
    ]
  }

  const generateMovementReport = () => {
    return stockMovements.map((movement) => ({
      Fecha: movement.date,
      Producto: movement.productName,
      Tipo: movement.type === "in" ? "Entrada" : "Salida",
      Cantidad: movement.quantity,
      Motivo: movement.reason,
      "Costo Unitario": movement.cost ? formatCurrency(movement.cost) : "N/A",
      Referencia: movement.reference || "N/A",
    }))
  }

  const generateSalesReport = () => {
    return sales.map((sale) => ({
      Fecha: sale.date,
      Producto: sale.productName,
      Cantidad: sale.quantity,
      "Precio Unitario": formatCurrency(sale.unitPrice),
      "Total Venta": formatCurrency(sale.totalAmount),
      Cliente: sale.customer || "N/A",
    }))
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => `"${row[header]}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const reportTypes = [
    {
      id: "inventory",
      name: "Reporte de Inventario",
      description: "Estado actual del inventario con valorización",
      icon: Package,
      data: generateInventoryReport(),
    },
    {
      id: "financial",
      name: "Reporte Financiero",
      description: "Métricas financieras y de rentabilidad",
      icon: DollarSign,
      data: generateFinancialReport(),
    },
    {
      id: "movements",
      name: "Movimientos de Stock",
      description: "Historial de entradas y salidas de inventario",
      icon: TrendingUp,
      data: generateMovementReport(),
    },
    {
      id: "sales",
      name: "Reporte de Ventas",
      description: "Detalle de todas las transacciones de venta",
      icon: FileText,
      data: generateSalesReport(),
    },
  ]

  const selectedReportData = reportTypes.find((report) => report.id === selectedReport)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
          <div className="flex space-x-4">
            <select
              className="px-4 py-2 border border-gray-300 rounded-md"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 3 meses</option>
              <option value="365">Último año</option>
            </select>
            <Button onClick={() => exportToCSV(selectedReportData?.data || [], selectedReportData?.name || "reporte")}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Selector de Reportes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all ${
                selectedReport === report.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <report.icon
                    className={`h-8 w-8 ${selectedReport === report.id ? "text-blue-600" : "text-gray-600"}`}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{report.name}</h3>
                    <p className="text-sm text-gray-600">{report.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumen Ejecutivo */}
        {selectedReport === "inventory" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-sm text-gray-600">Total Productos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(financialMetrics.totalInventoryValue)}
                </p>
                <p className="text-sm text-gray-600">Valor Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{financialMetrics.inventoryTurnover.toFixed(1)}x</p>
                <p className="text-sm text-gray-600">Rotación</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{financialMetrics.deadStock.length}</p>
                <p className="text-sm text-gray-600">Stock Muerto</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabla de Datos del Reporte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {selectedReportData?.icon && <selectedReportData.icon className="h-5 w-5 mr-2" />}
              {selectedReportData?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedReportData?.data.length > 0 &&
                      Object.keys(selectedReportData.data[0]).map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedReportData?.data.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Insights y Recomendaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Insights y Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Productos Estrella</h4>
                <p className="text-sm text-green-700">
                  Los productos de categoría A representan el 80% del valor del inventario. Mantener stock adecuado.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Atención Requerida</h4>
                <p className="text-sm text-yellow-700">
                  {financialMetrics.slowMovingItems.length} productos con movimiento lento requieren estrategia de
                  liquidación.
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Oportunidad de Mejora</h4>
                <p className="text-sm text-blue-700">
                  La rotación actual de {financialMetrics.inventoryTurnover.toFixed(1)}x puede mejorarse optimizando el
                  stock.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
