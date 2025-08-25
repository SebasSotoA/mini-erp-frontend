"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { useInventory } from "@/contexts/inventory-context"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Calendar,
  Plus,
  BarChart3,
  PieChartIcon,
  ShoppingCart,
} from "lucide-react"

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

export default function Dashboard() {
  const {
    products,
    getLowStockProducts,
    getStockByCategory,
    getRecentMovements,
    getFinancialMetrics,
    getSalesAnalytics,
  } = useInventory()
  const [selectedPeriod, setSelectedPeriod] = useState("current-month")
  const [isChartModalOpen, setIsChartModalOpen] = useState(false)
  const [selectedChartType, setSelectedChartType] = useState("")

  const totalProducts = products.length
  const lowStockProducts = getLowStockProducts()
  const stockByCategory = getStockByCategory()
  const recentMovements = getRecentMovements()
  const financialMetrics = getFinancialMetrics()
  const salesAnalytics = getSalesAnalytics()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value)
  }

  const periodOptions = [
    { value: "current-month", label: "Mes Actual" },
    { value: "last-month", label: "Mes Anterior" },
    { value: "current-quarter", label: "Trimestre Actual" },
    { value: "last-quarter", label: "Trimestre Anterior" },
    { value: "current-year", label: "Año Actual" },
    { value: "last-year", label: "Año Anterior" },
  ]

  const chartOptions = [
    {
      id: "top-products",
      name: "Productos más vendidos",
      description: "Top 10 productos por ventas",
      icon: ShoppingCart,
    },
    {
      id: "expense-distribution",
      name: "Distribución de gastos",
      description: "Gastos por categoría",
      icon: PieChartIcon,
    },
    {
      id: "sales-trend",
      name: "Tendencia de ventas",
      description: "Ventas en el tiempo",
      icon: TrendingUp,
    },
    {
      id: "inventory-value",
      name: "Valor de inventario",
      description: "Valor por categoría",
      icon: Package,
    },
  ]

  const addChart = (chartType: string) => {
    setSelectedChartType(chartType)
    setIsChartModalOpen(false)
    // Aquí podrías agregar la lógica para añadir el gráfico al dashboard
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header de Bienvenida */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">¡Bienvenido de vuelta!</h1>
              <p className="text-blue-100 text-lg">Aquí tienes un resumen de tu inventario y ventas</p>
              <p className="text-blue-200 text-sm mt-1">Última actualización: {new Date().toLocaleString("es-ES")}</p>
            </div>
            <div className="flex space-x-3">
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  {periodOptions.map((option) => (
                    <option key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
                <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 pointer-events-none" />
              </div>
              <Button
                onClick={() => setIsChartModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Gráfica
              </Button>
            </div>
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                <p className="text-xs text-blue-600">Valor: {formatCurrency(financialMetrics.totalInventoryValue)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ventas del Mes</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(45230)}</p>
                <p className="text-xs text-green-600">+12.5% vs mes anterior</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
                <p className="text-xs text-red-600">Requiere atención</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Margen Bruto</p>
                <p className="text-2xl font-bold text-gray-900">{(financialMetrics.grossMargin * 100).toFixed(1)}%</p>
                <p className="text-xs text-purple-600">Rentabilidad global</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Productos más vendidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                Productos más vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesAnalytics.topProducts.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribución por categoría */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2 text-green-600" />
                Distribución de inventario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tendencia de movimientos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
              Movimientos de Stock (Últimos 30 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recentMovements}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("es-ES", { month: "short", day: "numeric" })
                  }
                />
                <YAxis />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("es-ES")} />
                <Line type="monotone" dataKey="in" stroke="#10B981" strokeWidth={2} name="Entradas" />
                <Line type="monotone" dataKey="out" stroke="#EF4444" strokeWidth={2} name="Salidas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alertas de Stock Bajo */}
        {lowStockProducts.length > 0 && (
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Alertas de Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockProducts.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600 font-semibold">Stock: {product.stock}</p>
                      <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal para Agregar Gráfica */}
        <Modal isOpen={isChartModalOpen} onClose={() => setIsChartModalOpen(false)} title="Agregar Nueva Gráfica">
          <div className="space-y-4">
            <p className="text-gray-600">Selecciona el tipo de gráfica que deseas agregar al dashboard:</p>
            <div className="grid grid-cols-1 gap-3">
              {chartOptions.map((chart) => (
                <button
                  key={chart.id}
                  onClick={() => addChart(chart.id)}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors text-left"
                >
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <chart.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{chart.name}</h4>
                    <p className="text-sm text-gray-600">{chart.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  )
}
