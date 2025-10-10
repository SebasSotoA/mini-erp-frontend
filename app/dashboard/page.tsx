"use client"

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
  X,
  Gauge,
  Building2,
  Check,
  Eye,
  EyeOff,
} from "lucide-react"
import { useState, useEffect } from "react"
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

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { useInventory } from "@/contexts/inventory-context"
import { useCurrentTime } from "@/hooks/use-hydrated"

const COLORS = ["#5b7554", "#455b40", "#364933", "#2d3b2a", "#253123", "#6f8568"]

export default function Dashboard() {
  const {
    products,
    warehouses,
    getLowStockProducts,
    getStockByCategory,
    getStockByWarehouse,
    getRecentMovements,
    getFinancialMetrics,
    getSalesAnalytics,
    getStockHealthMetrics,
  } = useInventory()
  const [selectedPeriod, setSelectedPeriod] = useState("current-month")
  const [isChartModalOpen, setIsChartModalOpen] = useState(false)
  const [selectedChartType, setSelectedChartType] = useState("")
  const [visibleCharts, setVisibleCharts] = useState({
    topProducts: true,
    salesTrend: true,
    inventoryDistribution: true,
    stockMovements: true,
    stockGauge: true,
    warehouseComparison: true,
  })

  // Usar hook personalizado para obtener la fecha de manera segura
  const currentTime = useCurrentTime()

  const totalProducts = products.length
  const lowStockProducts = getLowStockProducts()
  const stockByCategory = getStockByCategory()
  const stockByWarehouse = getStockByWarehouse()
  const recentMovements = getRecentMovements()
  const financialMetrics = getFinancialMetrics()
  const salesAnalytics = getSalesAnalytics()
  const stockHealthMetrics = getStockHealthMetrics()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value)
  }

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString("es-ES", { month: "short", day: "numeric" })
    } catch {
      return value
    }
  }

  const formatDateLong = (value: string) => {
    try {
      return new Date(value).toLocaleDateString("es-ES")
    } catch {
      return value
    }
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
      id: "topProducts",
      name: "Top 10 Productos más vendidos",
      description: "Top productos por ventas",
      icon: ShoppingCart,
    },
    {
      id: "salesTrend",
      name: "Tendencia de ventas",
      description: "Ventas en el tiempo",
      icon: TrendingUp,
    },
    {
      id: "inventoryDistribution",
      name: "Distribución de inventario",
      description: "Valor por categoría",
      icon: PieChartIcon,
    },
    {
      id: "stockGauge",
      name: "Gauge de Salud del Stock",
      description: "Indicador visual de stock",
      icon: Gauge,
    },
    {
      id: "warehouseComparison",
      name: "Comparación entre Bodegas",
      description: "Stock por bodega",
      icon: Building2,
    },
    {
      id: "stockMovements",
      name: "Movimientos de Stock",
      description: "Entradas y salidas",
      icon: BarChart3,
    },
  ]

  const toggleChart = (chartType: string) => {
    setSelectedChartType(chartType)
    // Toggle gráfica seleccionada (activar/desactivar)
    setVisibleCharts((prev) => ({ ...prev, [chartType]: !prev[chartType as keyof typeof prev] }))
  }

  const removeChart = (chartType: string) => {
    setVisibleCharts((prev) => ({ ...prev, [chartType]: false }))
  }

  const showAllCharts = () => {
    setVisibleCharts({
      topProducts: true,
      salesTrend: true,
      inventoryDistribution: true,
      stockMovements: true,
      stockGauge: true,
      warehouseComparison: true,
    })
  }

  const hideAllCharts = () => {
    setVisibleCharts({
      topProducts: false,
      salesTrend: false,
      inventoryDistribution: false,
      stockMovements: false,
      stockGauge: false,
      warehouseComparison: false,
    })
  }

  // Función para filtrar datos según período seleccionado
  const getFilteredSalesData = () => {
    const now = new Date()
    const startDate = new Date()

    switch (selectedPeriod) {
      case "current-month":
        startDate.setMonth(now.getMonth())
        startDate.setDate(1)
        break
      case "last-month":
        startDate.setMonth(now.getMonth() - 1)
        startDate.setDate(1)
        break
      case "current-quarter":
        startDate.setMonth(Math.floor(now.getMonth() / 3) * 3)
        startDate.setDate(1)
        break
      case "last-quarter":
        startDate.setMonth(Math.floor(now.getMonth() / 3) * 3 - 3)
        startDate.setDate(1)
        break
      case "current-year":
        startDate.setMonth(0)
        startDate.setDate(1)
        break
      case "last-year":
        startDate.setFullYear(now.getFullYear() - 1)
        startDate.setMonth(0)
        startDate.setDate(1)
        break
      default:
        // Default to current month
        startDate.setMonth(now.getMonth())
        startDate.setDate(1)
        break
    }

    return salesAnalytics.dailySales.filter((sale) => {
      const saleDate = new Date(sale.date)
      return saleDate >= startDate
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header de Bienvenida */}
        <div className="rounded-xl bg-gradient-to-r from-camouflage-green-400 to-camouflage-green-800 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">¡Bienvenido de vuelta!</h1>
              <p className="text-lg text-white">Aquí tienes un resumen de tu inventario y ventas</p>
              <p className="mt-1 text-sm text-camouflage-green-200">
                Última actualización: {currentTime || "Cargando..."}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="h-10 rounded-lg border border-camouflage-green-500/50 bg-camouflage-green-600/50 py-2 pl-3 pr-3 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-camouflage-green-300"
                >
                  {periodOptions.map((option) => (
                    <option key={option.value} value={option.value} className="text-camouflage-green-900">
                      {option.label}
                    </option>
                  ))}
                </select>
                <Calendar className="pointer-events-none absolute right-7 top-1/2 h-4 w-4 -translate-y-1/2 transform text-camouflage-green-200" />
              </div>
              <Button
                onClick={() => setIsChartModalOpen(true)}
                variant="primary"
                className="h-10 border border-camouflage-green-500/50 bg-camouflage-green-600/50 text-base font-bold text-white hover:bg-camouflage-green-500/70"
              >
                <Plus className="mr-2 h-4 w-4" />
                Gestionar Gráficas
              </Button>
            </div>
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-camouflage-green-200 transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-camouflage-green-100 p-3">
                <Package className="h-6 w-6 text-camouflage-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-camouflage-green-600">Total Productos</p>
                <p className="text-2xl font-bold text-camouflage-green-900">{totalProducts}</p>
                <p className="text-xs text-camouflage-green-500">
                  Valor: {formatCurrency(financialMetrics.totalInventoryValue)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-camouflage-green-200 transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-camouflage-green-200 p-3">
                <TrendingUp className="h-6 w-6 text-camouflage-green-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-camouflage-green-600">Ventas del Mes</p>
                <p className="text-2xl font-bold text-camouflage-green-900">{formatCurrency(45230)}</p>
                <p className="text-xs text-camouflage-green-500">+12.5% vs mes anterior</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-camouflage-green-200 transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-camouflage-green-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-camouflage-green-900">{lowStockProducts.length}</p>
                <p className="text-xs text-red-600">Requiere atención</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-camouflage-green-200 transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-camouflage-green-300 p-3">
                <DollarSign className="h-6 w-6 text-camouflage-green-800" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-camouflage-green-600">Margen Bruto</p>
                <p className="text-2xl font-bold text-camouflage-green-900">
                  {(financialMetrics.grossMargin * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-camouflage-green-500">Rentabilidad global</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Productos más vendidos */}
          {visibleCharts.topProducts && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5 text-camouflage-green-700" />
                    Top 10 Productos más vendidos
                  </div>
                  <button
                    onClick={() => removeChart("topProducts")}
                    className="rounded-full p-1 transition-colors hover:bg-camouflage-green-100"
                  >
                    <X className="h-4 w-4 text-camouflage-green-500" />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesAnalytics.topProducts.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="revenue" fill="#5b7554" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Distribución por categoría */}
          {visibleCharts.inventoryDistribution && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <PieChartIcon className="mr-2 h-5 w-5 text-camouflage-green-700" />
                    Distribución de Inventario
                  </div>
                  <button
                    onClick={() => removeChart("inventoryDistribution")}
                    className="rounded-full p-1 transition-colors hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
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
                      label={({ category, percent }) => `${category} ${percent ? (percent * 100).toFixed(0) : 0}%`}
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
          )}
        </div>

        {/* Nueva gráfica: Tendencia de ventas en el tiempo */}
        {visibleCharts.salesTrend && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-emerald-600" />
                  Tendencia de Ventas en el Tiempo
                </div>
                <button
                  onClick={() => removeChart("salesTrend")}
                  className="rounded-full p-1 transition-colors hover:bg-gray-100"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getFilteredSalesData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={formatDateLong}
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name === "sales" ? "Ventas" : "Beneficio",
                    ]}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} name="Ventas" />
                  <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} name="Beneficio" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Nuevas gráficas en grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Gauge de salud del stock */}
          {visibleCharts.stockGauge && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Gauge className="mr-2 h-5 w-5 text-camouflage-green-700" />
                    Salud del Stock
                  </div>
                  <button
                    onClick={() => removeChart("stockGauge")}
                    className="rounded-full p-1 transition-colors hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center">
                  <div className="relative h-48 w-48">
                    {/* Semicírculo gauge */}
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      {/* Background arc */}
                      <path d="M 20 80 A 30 30 0 0 1 80 80" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      {/* Progress arc */}
                      <path
                        d="M 20 80 A 30 30 0 0 1 80 80"
                        fill="none"
                        stroke={
                          stockHealthMetrics.stockHealthPercentage >= 70
                            ? "#10B981"
                            : stockHealthMetrics.stockHealthPercentage >= 50
                              ? "#F59E0B"
                              : "#EF4444"
                        }
                        strokeWidth="8"
                        strokeDasharray={`${stockHealthMetrics.stockHealthPercentage * 1.88} 188`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{stockHealthMetrics.stockHealthPercentage}%</span>
                      <span className="text-sm text-gray-600">Stock Óptimo</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{stockHealthMetrics.optimalStock}</div>
                    <div className="text-xs text-gray-600">Óptimo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{stockHealthMetrics.lowStock}</div>
                    <div className="text-xs text-gray-600">Bajo Stock</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">{stockHealthMetrics.overStock}</div>
                    <div className="text-xs text-gray-600">Sobre Stock</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparación entre bodegas */}
          {visibleCharts.warehouseComparison && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5 text-camouflage-green-700" />
                    Comparación Stock por Bodegas
                  </div>
                  <button
                    onClick={() => removeChart("warehouseComparison")}
                    className="rounded-full p-1 transition-colors hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stockByWarehouse} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="warehouse" fontSize={12} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "stock" ? `${value} unidades` : formatCurrency(Number(value)),
                        name === "stock" ? "Stock" : "Valor",
                      ]}
                    />
                    <Bar dataKey="stock" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Stock" />
                    <Bar dataKey="value" fill="#06B6D4" radius={[0, 4, 4, 0]} name="Valor" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tendencia de movimientos */}
        {visibleCharts.stockMovements && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-camouflage-green-700" />
                  Movimientos de Stock (Últimos 30 días)
                </div>
                <button
                  onClick={() => removeChart("stockMovements")}
                  className="rounded-full p-1 transition-colors hover:bg-gray-100"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={recentMovements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip labelFormatter={formatDateLong} />
                  <Line type="monotone" dataKey="in" stroke="#10B981" strokeWidth={2} name="Entradas" />
                  <Line type="monotone" dataKey="out" stroke="#EF4444" strokeWidth={2} name="Salidas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Alertas de Stock Bajo */}
        {lowStockProducts.length > 0 && (
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Alertas de Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lowStockProducts.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">Stock: {product.stock}</p>
                      <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal para Agregar Gráfica */}
        <Modal
          isOpen={isChartModalOpen}
          onClose={() => setIsChartModalOpen(false)}
          title="Gestionar Gráficas del Dashboard"
        >
          <div className="space-y-6">
            <div>
              <p className="mb-4 text-camouflage-green-700">
                Selecciona las gráficas que deseas mostrar en el dashboard:
              </p>

              {/* Botones de control global */}
              <div className="mb-4 flex justify-center gap-3 rounded-lg border border-camouflage-green-200 bg-camouflage-green-50 p-3">
                <Button
                  onClick={showAllCharts}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-camouflage-green-600 to-camouflage-green-700 px-6 py-3 font-medium text-white shadow-md transition-all duration-200 hover:from-camouflage-green-700 hover:to-camouflage-green-800 hover:shadow-lg"
                >
                  <Eye className="h-4 w-4" />
                  Mostrar Todas
                </Button>
                <Button
                  onClick={hideAllCharts}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-camouflage-green-800 to-camouflage-green-900 px-6 py-3 font-medium text-white shadow-md transition-all duration-200 hover:from-camouflage-green-900 hover:to-camouflage-green-950 hover:shadow-lg"
                >
                  <EyeOff className="h-4 w-4" />
                  Ocultar Todas
                </Button>
              </div>

              {/* Lista de gráficas con estado */}
              <div className="grid grid-cols-1 gap-3">
                {chartOptions.map((chart) => {
                  const isVisible = visibleCharts[chart.id as keyof typeof visibleCharts]
                  return (
                    <button
                      key={chart.id}
                      onClick={() => toggleChart(chart.id)}
                      className={`flex items-center justify-between rounded-lg border p-4 text-left transition-all ${
                        isVisible
                          ? "border-camouflage-green-400 bg-camouflage-green-50 hover:bg-camouflage-green-100"
                          : "border-camouflage-green-200 bg-white hover:border-camouflage-green-400 hover:bg-camouflage-green-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`mr-4 rounded-lg p-2 ${
                            isVisible ? "bg-camouflage-green-200" : "bg-camouflage-green-100"
                          }`}
                        >
                          <chart.icon
                            className={`h-5 w-5 ${
                              isVisible ? "text-camouflage-green-700" : "text-camouflage-green-600"
                            }`}
                          />
                        </div>
                        <div>
                          <h4
                            className={`font-medium ${
                              isVisible ? "text-camouflage-green-900" : "text-camouflage-green-800"
                            }`}
                          >
                            {chart.name}
                          </h4>
                          <p
                            className={`text-sm ${
                              isVisible ? "text-camouflage-green-600" : "text-camouflage-green-500"
                            }`}
                          >
                            {chart.description}
                          </p>
                        </div>
                      </div>

                      {/* Indicador de estado */}
                      <div
                        className={`flex items-center gap-2 ${
                          isVisible ? "text-camouflage-green-600" : "text-camouflage-green-400"
                        }`}
                      >
                        {isVisible && (
                          <>
                            <Check className="h-5 w-5" />
                            <span className="text-sm font-medium">Activa</span>
                          </>
                        )}
                        {!isVisible && <span className="text-sm text-camouflage-green-500">Inactiva</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  )
}
