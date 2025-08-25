"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useInventory } from "@/contexts/inventory-context"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertCircle,
  Target,
  BarChart3,
  PieChartIcon,
} from "lucide-react"

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

export default function Analytics() {
  const { getFinancialMetrics, getSalesAnalytics, getProfitabilityAnalysis } = useInventory()

  const financialMetrics = getFinancialMetrics()
  const salesAnalytics = getSalesAnalytics()
  const profitabilityAnalysis = getProfitabilityAnalysis()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Análisis Financiero</h1>
          <div className="flex space-x-2">
            <select className="px-4 py-2 border border-gray-300 rounded-md">
              <option>Último mes</option>
              <option>Últimos 3 meses</option>
              <option>Último año</option>
            </select>
          </div>
        </div>

        {/* Métricas Financieras Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valor Total Inventario</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(financialMetrics.totalInventoryValue)}
                </p>
                <p className="text-xs text-green-600">+12.5% vs mes anterior</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Costo Total Inventario</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(financialMetrics.totalInventoryCost)}
                </p>
                <p className="text-xs text-blue-600">Margen: {formatPercentage(financialMetrics.grossMargin)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rotación de Inventario</p>
                <p className="text-2xl font-bold text-gray-900">{financialMetrics.inventoryTurnover.toFixed(1)}x</p>
                <p className="text-xs text-purple-600">
                  {financialMetrics.daysInventoryOutstanding.toFixed(0)} días promedio
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock Muerto</p>
                <p className="text-2xl font-bold text-gray-900">{financialMetrics.deadStock.length}</p>
                <p className="text-xs text-orange-600">Productos sin movimiento</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Análisis Mejorados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendencias de Ventas Diarias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Ventas y Ganancias Diarias (Últimos 30 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={salesAnalytics.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("es-ES", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(value) => new Date(value).toLocaleDateString("es-ES")}
                  />
                  <Bar dataKey="sales" fill="#3B82F6" name="Ventas" />
                  <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} name="Ganancia" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tendencias Mensuales de Rentabilidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Tendencias Mensuales de Rentabilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={profitabilityAnalysis.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Ingresos" />
                  <Bar dataKey="cost" fill="#EF4444" name="Costos" />
                  <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} name="Ganancia" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Productos por Ingresos */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Productos por Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salesAnalytics.topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="product" type="category" width={150} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" fill="#3B82F6" name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Análisis ABC */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2" />
              Análisis ABC de Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="text-3xl font-bold text-blue-600">{financialMetrics.abcAnalysis.A.length}</div>
                  <div className="text-sm font-semibold text-blue-600">Categoría A</div>
                  <div className="text-xs text-gray-500">80% del valor</div>
                  <div className="text-xs text-blue-500 mt-1">Alta prioridad</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="text-3xl font-bold text-green-600">{financialMetrics.abcAnalysis.B.length}</div>
                  <div className="text-sm font-semibold text-green-600">Categoría B</div>
                  <div className="text-xs text-gray-500">15% del valor</div>
                  <div className="text-xs text-green-500 mt-1">Prioridad media</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <div className="text-3xl font-bold text-orange-600">{financialMetrics.abcAnalysis.C.length}</div>
                  <div className="text-sm font-semibold text-orange-600">Categoría C</div>
                  <div className="text-xs text-gray-500">5% del valor</div>
                  <div className="text-xs text-orange-500 mt-1">Baja prioridad</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-blue-600">Productos Categoría A:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {financialMetrics.abcAnalysis.A.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex justify-between text-sm bg-blue-50 p-2 rounded">
                        <span className="truncate">{product.name}</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(product.price * product.stock)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-green-600">Productos Categoría B:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {financialMetrics.abcAnalysis.B.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex justify-between text-sm bg-green-50 p-2 rounded">
                        <span className="truncate">{product.name}</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(product.price * product.stock)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-orange-600">Productos Categoría C:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {financialMetrics.abcAnalysis.C.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex justify-between text-sm bg-orange-50 p-2 rounded">
                        <span className="truncate">{product.name}</span>
                        <span className="font-medium text-orange-600">
                          {formatCurrency(product.price * product.stock)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Análisis de Rentabilidad por Producto */}
        <Card>
          <CardHeader>
            <CardTitle>Rentabilidad por Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={profitabilityAnalysis.productProfitability.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" fill="#3B82F6" name="Ingresos" />
                <Bar dataKey="cost" fill="#EF4444" name="Costos" />
                <Bar dataKey="profit" fill="#10B981" name="Ganancia" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ganancia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tendencia</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesAnalytics.categoryPerformance.map((category, index) => (
                    <tr key={category.category}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{category.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{formatCurrency(category.revenue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{formatCurrency(category.profit)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            category.margin > 30
                              ? "bg-green-100 text-green-800"
                              : category.margin > 20
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {formatPercentage(category.margin)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {index % 2 === 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Productos de Movimiento Rápido y Lento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Productos de Movimiento Rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {financialMetrics.fastMovingItems.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">Stock: {product.stock} unidades</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{product.totalSold} vendidos</p>
                      <p className="text-xs text-gray-500">Rotación alta</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Productos de Movimiento Lento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {financialMetrics.slowMovingItems.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">Stock: {product.stock} unidades</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-600">{product.totalSold} vendidos</p>
                      <p className="text-xs text-gray-500">Considerar promoción</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recomendaciones Estratégicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Recomendaciones Estratégicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Optimización de Stock</h4>
                <p className="text-sm text-blue-700">
                  Reducir inventario de productos categoría C y aumentar stock de categoría A para mejorar rotación.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Oportunidades de Margen</h4>
                <p className="text-sm text-green-700">
                  Los productos electrónicos muestran el mejor margen. Considerar expandir esta categoría.
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">Gestión de Stock Lento</h4>
                <p className="text-sm text-orange-700">
                  Implementar estrategias de liquidación para productos de movimiento lento para liberar capital.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
