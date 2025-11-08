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
  Loader2,
  Warehouse,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { useState, useMemo } from "react"
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
  Legend,
  Area,
  AreaChart,
} from "recharts"

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { useCurrentTime } from "@/hooks/use-hydrated"
import {
  useDashboardMetrics,
  useTopProductosVendidos,
  useTendenciaVentas,
  useDistribucionCategorias,
  useMovimientosStock,
  useStockPorBodega,
  useSaludStock,
  useProductosStockBajo,
} from "@/hooks/api/use-dashboard"

const CHART_COLORS = {
  primary: "#5b7554",
  secondary: "#455b40",
  accent: "#364933",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  purple: "#8B5CF6",
  cyan: "#06B6D4",
}

const PIE_COLORS = [
  "#5b7554",
  "#455b40",
  "#364933",
  "#2d3b2a",
  "#253123",
  "#6f8568",
  "#8B5CF6",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
]

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month")
  const [selectedDays, setSelectedDays] = useState(30)
  const [isChartModalOpen, setIsChartModalOpen] = useState(false)
  const [visibleCharts, setVisibleCharts] = useState({
    topProducts: true,
    salesTrend: true,
    inventoryDistribution: true,
    stockMovements: true,
    stockGauge: true,
    warehouseComparison: true,
  })

  const currentTime = useCurrentTime()

  // Hooks del dashboard
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardMetrics()
  const { data: topProductos, isLoading: isLoadingTopProductos } = useTopProductosVendidos(10)
  const { data: tendenciaVentas, isLoading: isLoadingTendenciaVentas } = useTendenciaVentas(selectedDays)
  const { data: distribucionCategorias, isLoading: isLoadingDistribucionCategorias } = useDistribucionCategorias()
  const { data: movimientosStock, isLoading: isLoadingMovimientosStock } = useMovimientosStock(selectedDays)
  const { data: stockPorBodega, isLoading: isLoadingStockPorBodega } = useStockPorBodega()
  const { data: saludStock, isLoading: isLoadingSaludStock } = useSaludStock()
  const { data: productosStockBajo, isLoading: isLoadingProductosStockBajo } = useProductosStockBajo(20)

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "$0"
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null) return "0"
    return new Intl.NumberFormat("es-CO").format(value)
  }

  const formatDate = (value: string) => {
    try {
      const date = new Date(value)
      return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
    } catch {
      return value
    }
  }

  const formatDateLong = (value: string) => {
    try {
      return new Date(value).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return value
    }
  }

  const periodOptions = [
    { value: "current-month", label: "Últimos 30 días" },
    { value: "last-month", label: "Últimos 60 días" },
    { value: "current-quarter", label: "Últimos 90 días" },
    { value: "last-quarter", label: "Últimos 180 días" },
    { value: "current-year", label: "Último año" },
  ]

  const chartOptions = [
    {
      id: "topProducts",
      name: "Top 10 Productos más vendidos",
      description: "Productos con mayor valor de ventas",
      icon: ShoppingCart,
    },
    {
      id: "salesTrend",
      name: "Tendencia de Ventas",
      description: "Evolución de ventas en el tiempo",
      icon: TrendingUp,
    },
    {
      id: "inventoryDistribution",
      name: "Distribución por Categoría",
      description: "Valor del inventario por categoría",
      icon: PieChartIcon,
    },
    {
      id: "stockGauge",
      name: "Salud del Stock",
      description: "Estado general del inventario",
      icon: Gauge,
    },
    {
      id: "warehouseComparison",
      name: "Stock por Bodega",
      description: "Comparación entre bodegas",
      icon: Building2,
    },
    {
      id: "stockMovements",
      name: "Movimientos de Stock",
      description: "Entradas y salidas de inventario",
      icon: BarChart3,
    },
  ]

  const toggleChart = (chartType: string) => {
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

  // Mapear datos para las gráficas
  const topProductosData = useMemo(() => {
    if (!topProductos) return []
    return topProductos.map((p) => ({
      name: p.productoNombre.length > 20 ? p.productoNombre.substring(0, 20) + "..." : p.productoNombre,
      fullName: p.productoNombre,
      valor: p.valorTotal,
      cantidad: p.cantidadVendida,
    }))
  }, [topProductos])

  // Función helper para normalizar texto y corregir problemas de codificación
  const normalizeText = (text: string | null | undefined): string => {
    if (!text || text.trim() === "") return "Sin categoría"
    
    // Mapeo manual de textos comúnmente mal codificados del backend
    // Estos son casos conocidos donde el backend devuelve texto con codificación incorrecta
    const textCorrections: Record<string, string> = {
      "Sin Categora": "Sin categoría",
      "Sin categora": "Sin categoría",
      "sin categora": "Sin categoría",
      "SIN CATEGORA": "Sin categoría",
      "Sin Categoria": "Sin categoría",
      "Sin CategorÃa": "Sin categoría", // UTF-8 interpretado como Latin-1
    }
    
    // Verificar si el texto necesita corrección
    let normalizedText = text.trim()
    if (textCorrections[normalizedText]) {
      return textCorrections[normalizedText]
    }
    
    // Detectar el patrón "Sin Categor" - caso más común del problema
    if (normalizedText.match(/^Sin\s+Categor/i)) {
      // Verificar si termina correctamente con "categoría" o "categoria"
      const endsCorrectly = normalizedText.match(/Sin\s+Categor[iíía]\w*$/i)
      if (!endsCorrectly) {
        // No termina correctamente, reemplazar todo por "Sin categoría"
        return "Sin categoría"
      }
    }
    
    // Detectar el carácter de reemplazo Unicode (U+FFFD, código 65533) que aparece cuando hay problemas de codificación
    // Este carácter aparece como "" en el navegador cuando UTF-8 se interpreta incorrectamente
    if (normalizedText.includes(String.fromCharCode(65533))) {
      // Si contiene el carácter de reemplazo, intentar corregir el texto completo
      normalizedText = normalizedText.replace(/Categor[^\s]*/gi, "Categoría")
    }
    
    // Detectar caracteres mal codificados después de "Categor"
    // Buscar cualquier carácter que no sea una letra válida después de "Categor"
    const categorPattern = /Categor(.)/i
    const categorMatch = normalizedText.match(categorPattern)
    if (categorMatch && categorMatch[1]) {
      const charAfterCategor = categorMatch[1]
      const charCode = charAfterCategor.charCodeAt(0)
      
      // Caracteres válidos después de "Categor": í (237), i, a, y otras letras
      // El código 237 es 'í' en Latin-1, que debería ser 'í' en UTF-8
      const isValidChar = /[iaíáéóúñIAÍÁÉÓÚÑ]/.test(charAfterCategor)
      
      // Si NO es una letra válida O es el carácter de reemplazo (65533)
      if (charCode === 65533 || (!isValidChar && (charCode < 65 || charCode > 122 || (charCode > 90 && charCode < 97)))) {
        // Reemplazar "Categor" + carácter inválido por "Categoría"
        normalizedText = normalizedText.replace(/Categor./i, "Categoría")
      }
    }
    
    // Reemplazar "Categora" (sin tilde) por "Categoría" en cualquier contexto
    normalizedText = normalizedText.replace(/Categora\b/gi, "Categoría")
    
    // Última verificación: si contiene "Sin" y "Categor" pero no termina en "categoría", corregirlo
    if (normalizedText.match(/Sin\s+Categor/i) && !normalizedText.match(/Sin\s+Categor[iíía]/i)) {
      normalizedText = "Sin categoría"
    }
    
    return normalizedText
  }

  const distribucionCategoriasData = useMemo(() => {
    if (!distribucionCategorias) return []
    return distribucionCategorias.map((c) => ({
      name: normalizeText(c.categoriaNombre),
      value: c.valorTotal,
      stock: c.stockTotal,
      productos: c.cantidadProductos,
    }))
  }, [distribucionCategorias])

  const stockPorBodegaData = useMemo(() => {
    if (!stockPorBodega) return []
    return stockPorBodega.map((b) => ({
      name: b.bodegaNombre,
      stock: b.stockTotal,
      valor: b.valorTotal,
      productos: b.cantidadProductos,
    }))
  }, [stockPorBodega])

  const movimientosStockData = useMemo(() => {
    if (!movimientosStock) return []
    return movimientosStock.map((m) => ({
      fecha: m.fecha,
      entradas: m.entradas,
      salidas: m.salidas,
      neto: m.neto,
    }))
  }, [movimientosStock])

  const tendenciaVentasData = useMemo(() => {
    if (!tendenciaVentas) return []
    return tendenciaVentas.map((t) => ({
      fecha: t.fecha,
      ventas: t.totalVentas,
      facturas: t.cantidadFacturas,
    }))
  }, [tendenciaVentas])

  // Actualizar días según período seleccionado
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    switch (period) {
      case "current-month":
        setSelectedDays(30)
        break
      case "last-month":
        setSelectedDays(60)
        break
      case "current-quarter":
        setSelectedDays(90)
        break
      case "last-quarter":
        setSelectedDays(180)
        break
      case "current-year":
        setSelectedDays(365)
        break
      default:
        setSelectedDays(30)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-camouflage-green-900">Dashboard</h1>
            <p className="mt-1 text-sm text-camouflage-green-600">
              Resumen general de inventario y ventas • Actualizado: {currentTime || "Cargando..."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="h-10 rounded-lg border border-camouflage-green-300 bg-white px-4 pr-10 text-sm font-medium text-camouflage-green-900 shadow-sm transition-colors hover:border-camouflage-green-400 focus:border-camouflage-green-500 focus:outline-none focus:ring-2 focus:ring-camouflage-green-500 focus:ring-offset-2"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-camouflage-green-500" />
            </div>
            <Button
              onClick={() => setIsChartModalOpen(true)}
              variant="outline"
              className="h-10 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Personalizar
            </Button>
          </div>
        </div>

        {/* Métricas Principales - Diseño Mejorado */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Productos */}
          <Card className="overflow-hidden border-camouflage-green-200 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-camouflage-green-600">Total Productos</p>
                  {isLoadingMetrics ? (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-camouflage-green-600" />
                      <span className="text-xs text-camouflage-green-500">Cargando...</span>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-3xl font-bold text-camouflage-green-900">
                        {formatNumber(metrics?.totalProductos)}
                      </p>
                      <p className="mt-1 text-xs text-camouflage-green-500">
                        Valor: {formatCurrency(metrics?.valorTotalInventario)}
                      </p>
                    </>
                  )}
                </div>
                <div className="rounded-lg bg-camouflage-green-100 p-3">
                  <Package className="h-6 w-6 text-camouflage-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ventas del Mes */}
          <Card className="overflow-hidden border-camouflage-green-200 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-camouflage-green-600">Ventas del Mes</p>
                  {isLoadingMetrics ? (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-camouflage-green-600" />
                      <span className="text-xs text-camouflage-green-500">Cargando...</span>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-3xl font-bold text-camouflage-green-900">
                        {formatCurrency(metrics?.ventasDelMes)}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-xs">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Margen: {formatCurrency(metrics?.margenBruto)}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="rounded-lg bg-green-100 p-3">
                  <TrendingUp className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Bajo */}
          <Card className="overflow-hidden border-red-200 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-600">Stock Bajo</p>
                  {isLoadingMetrics ? (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                      <span className="text-xs text-red-500">Cargando...</span>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-3xl font-bold text-red-700">
                        {formatNumber(metrics?.productosStockBajo)}
                      </p>
                      <p className="mt-1 text-xs text-red-500">Requiere atención inmediata</p>
                    </>
                  )}
                </div>
                <div className="rounded-lg bg-red-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Margen Bruto */}
          <Card className="overflow-hidden border-camouflage-green-200 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-camouflage-green-600">Margen Bruto</p>
                  {isLoadingMetrics ? (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-camouflage-green-600" />
                      <span className="text-xs text-camouflage-green-500">Cargando...</span>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-3xl font-bold text-camouflage-green-900">
                        {metrics?.porcentajeMargen?.toFixed(1) || "0.0"}%
                      </p>
                      <p className="mt-1 text-xs text-camouflage-green-500">Rentabilidad</p>
                    </>
                  )}
                </div>
                <div className="rounded-lg bg-blue-100 p-3">
                  <DollarSign className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Adicionales */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-camouflage-green-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-camouflage-green-600">Total Bodegas</p>
                  {isLoadingMetrics ? (
                    <Loader2 className="mt-1 h-4 w-4 animate-spin text-camouflage-green-600" />
                  ) : (
                    <p className="mt-1 text-xl font-bold text-camouflage-green-900">
                      {formatNumber(metrics?.totalBodegas)}
                    </p>
                  )}
                </div>
                <Warehouse className="h-5 w-5 text-camouflage-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-camouflage-green-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-camouflage-green-600">Compras del Mes</p>
                  {isLoadingMetrics ? (
                    <Loader2 className="mt-1 h-4 w-4 animate-spin text-camouflage-green-600" />
                  ) : (
                    <p className="mt-1 text-xl font-bold text-camouflage-green-900">
                      {formatCurrency(metrics?.comprasDelMes)}
                    </p>
                  )}
                </div>
                <ShoppingCart className="h-5 w-5 text-camouflage-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-camouflage-green-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-camouflage-green-600">Valor Inventario</p>
                  {isLoadingMetrics ? (
                    <Loader2 className="mt-1 h-4 w-4 animate-spin text-camouflage-green-600" />
                  ) : (
                    <p className="mt-1 text-xl font-bold text-camouflage-green-900">
                      {formatCurrency(metrics?.valorTotalInventario)}
                    </p>
                  )}
                </div>
                <Package className="h-5 w-5 text-camouflage-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficas Principales */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Tendencia de Ventas */}
          {visibleCharts.salesTrend && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-camouflage-green-900">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Tendencia de Ventas
                  </CardTitle>
                  <button
                    onClick={() => removeChart("salesTrend")}
                    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTendenciaVentas ? (
                  <div className="flex h-[350px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-camouflage-green-600" />
                  </div>
                ) : tendenciaVentasData.length === 0 ? (
                  <div className="flex h-[350px] items-center justify-center text-gray-500">
                    No hay datos disponibles
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={tendenciaVentasData}>
                      <defs>
                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={formatDate}
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        labelFormatter={formatDateLong}
                        formatter={(value: any) => [formatCurrency(Number(value)), "Ventas"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="ventas"
                        stroke={CHART_COLORS.success}
                        strokeWidth={3}
                        fill="url(#colorVentas)"
                        name="Ventas"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top Productos */}
          {visibleCharts.topProducts && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-camouflage-green-900">
                    <ShoppingCart className="h-5 w-5 text-camouflage-green-700" />
                    Top 10 Productos Más Vendidos
                  </CardTitle>
                  <button
                    onClick={() => removeChart("topProducts")}
                    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTopProductos ? (
                  <div className="flex h-[350px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-camouflage-green-600" />
                  </div>
                ) : topProductosData.length === 0 ? (
                  <div className="flex h-[350px] items-center justify-center text-gray-500">
                    No hay datos disponibles
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={topProductosData} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value: any, name: string, props: any) => [
                          name === "valor" ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                          name === "valor" ? "Valor Total" : "Cantidad",
                        ]}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0] && payload[0].payload) {
                            return payload[0].payload.fullName || label
                          }
                          return label
                        }}
                      />
                      <Bar
                        dataKey="valor"
                        fill={CHART_COLORS.primary}
                        radius={[0, 8, 8, 0]}
                        name="Valor Total"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Segunda Fila de Gráficas */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Movimientos de Stock */}
          {visibleCharts.stockMovements && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-camouflage-green-900">
                    <BarChart3 className="h-5 w-5 text-camouflage-green-700" />
                    Movimientos de Stock
                  </CardTitle>
                  <button
                    onClick={() => removeChart("stockMovements")}
                    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-camouflage-green-600">Últimos {selectedDays} días</p>
              </CardHeader>
              <CardContent>
                {isLoadingMovimientosStock ? (
                  <div className="flex h-[350px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-camouflage-green-600" />
                  </div>
                ) : movimientosStockData.length === 0 ? (
                  <div className="flex h-[350px] items-center justify-center text-gray-500">
                    No hay datos disponibles
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={movimientosStockData}>
                      <defs>
                        <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.danger} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS.danger} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={formatDate}
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        labelFormatter={formatDateLong}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="entradas"
                        stackId="1"
                        stroke={CHART_COLORS.success}
                        fill="url(#colorEntradas)"
                        name="Entradas"
                      />
                      <Area
                        type="monotone"
                        dataKey="salidas"
                        stackId="2"
                        stroke={CHART_COLORS.danger}
                        fill="url(#colorSalidas)"
                        name="Salidas"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}

          {/* Distribución por Categoría */}
          {visibleCharts.inventoryDistribution && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-camouflage-green-900">
                    <PieChartIcon className="h-5 w-5 text-camouflage-green-700" />
                    Distribución por Categoría
                  </CardTitle>
                  <button
                    onClick={() => removeChart("inventoryDistribution")}
                    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingDistribucionCategorias ? (
                  <div className="flex h-[350px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-camouflage-green-600" />
                  </div>
                ) : distribucionCategoriasData.length === 0 ? (
                  <div className="flex h-[350px] items-center justify-center text-gray-500">
                    No hay datos disponibles
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={distribucionCategoriasData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {distribucionCategoriasData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value: any) => formatCurrency(Number(value))}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry: any) => (
                          <span className="text-sm text-camouflage-green-700">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tercera Fila de Gráficas */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Salud del Stock */}
          {visibleCharts.stockGauge && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-camouflage-green-900">
                    <Gauge className="h-5 w-5 text-camouflage-green-700" />
                    Salud del Stock
                  </CardTitle>
                  <button
                    onClick={() => removeChart("stockGauge")}
                    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSaludStock ? (
                  <div className="flex h-[350px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-camouflage-green-600" />
                  </div>
                ) : !saludStock ? (
                  <div className="flex h-[350px] items-center justify-center text-gray-500">
                    No hay datos disponibles
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Gauge Principal */}
                    <div className="flex items-center justify-center">
                      <div className="relative h-64 w-64">
                        {(() => {
                          // Calcular la longitud del arco semicircular (π * radio)
                          // El arco va de (20, 80) a (80, 80) con radio 30
                          const arcRadius = 30
                          const arcLength = Math.PI * arcRadius // Longitud del semicírculo ≈ 94.25
                          // Asegurar que el porcentaje esté entre 0 y 100
                          const porcentaje = Math.max(0, Math.min(100, saludStock.porcentajeStockOptimo))
                          // Calcular la longitud del trazo basado en el porcentaje
                          const strokeLength = (porcentaje / 100) * arcLength
                          // Determinar el color basado en el porcentaje
                          const strokeColor =
                            porcentaje >= 70
                              ? CHART_COLORS.success
                              : porcentaje >= 50
                                ? CHART_COLORS.warning
                                : CHART_COLORS.danger

                          return (
                            <>
                              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                                {/* Arco de fondo (gris) */}
                                <path
                                  d="M 20 80 A 30 30 0 0 1 80 80"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="10"
                                />
                                {/* Arco de porcentaje (coloreado) */}
                                <path
                                  d="M 20 80 A 30 30 0 0 1 80 80"
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth="10"
                                  strokeDasharray={`${strokeLength} ${arcLength}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold text-camouflage-green-900">
                                  {porcentaje.toFixed(1)}%
                                </span>
                                <span className="mt-1 text-sm font-medium text-camouflage-green-600">
                                  Stock Óptimo
                                </span>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-green-200 p-2">
                            <Check className="h-4 w-4 text-green-700" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-700">Óptimo</p>
                            <p className="text-xl font-bold text-green-900">
                              {formatNumber(saludStock.productosStockOptimo)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-red-200 p-2">
                            <AlertTriangle className="h-4 w-4 text-red-700" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-red-700">Bajo Stock</p>
                            <p className="text-xl font-bold text-red-900">
                              {formatNumber(
                                productosStockBajo && productosStockBajo.length > 0
                                  ? productosStockBajo.length
                                  : saludStock.productosStockBajo
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-orange-200 p-2">
                            <ArrowUp className="h-4 w-4 text-orange-700" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-orange-700">Sobre Stock</p>
                            <p className="text-xl font-bold text-orange-900">
                              {formatNumber(saludStock.productosStockAlto)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-gray-200 p-2">
                            <X className="h-4 w-4 text-gray-700" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700">Agotados</p>
                            <p className="text-xl font-bold text-gray-900">
                              {formatNumber(saludStock.productosAgotados)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stock por Bodega */}
          {visibleCharts.warehouseComparison && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-camouflage-green-900">
                    <Building2 className="h-5 w-5 text-camouflage-green-700" />
                    Stock por Bodega
                  </CardTitle>
                  <button
                    onClick={() => removeChart("warehouseComparison")}
                    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingStockPorBodega ? (
                  <div className="flex h-[350px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-camouflage-green-600" />
                  </div>
                ) : stockPorBodegaData.length === 0 ? (
                  <div className="flex h-[350px] items-center justify-center text-gray-500">
                    No hay datos disponibles
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={stockPorBodegaData} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value: any, name: string) => [
                          name === "valor" ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                          name === "valor" ? "Valor" : "Stock",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="stock"
                        fill={CHART_COLORS.purple}
                        radius={[0, 8, 8, 0]}
                        name="Stock (unidades)"
                      />
                      <Bar dataKey="valor" fill={CHART_COLORS.cyan} radius={[0, 8, 8, 0]} name="Valor Total" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Productos con Stock Bajo */}
        {productosStockBajo && productosStockBajo.length > 0 && (
          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Productos con Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProductosStockBajo ? (
                <div className="flex h-[200px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-camouflage-green-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {productosStockBajo.slice(0, 9).map((product) => (
                    <div
                      key={product.productoId}
                      className="rounded-lg border border-red-200 bg-red-50 p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{product.productoNombre}</p>
                          <p className="mt-1 text-xs text-gray-600">SKU: {product.productoSku}</p>
                          <p className="mt-1 text-xs text-gray-500">{product.bodegaPrincipal}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-red-200 pt-3">
                        <div>
                          <p className="text-xs text-gray-600">Stock Actual</p>
                          <p className="text-lg font-bold text-red-700">{formatNumber(product.stockActual)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Mínimo</p>
                          <p className="text-lg font-bold text-gray-700">{formatNumber(product.stockMinimo)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Diferencia</p>
                          <p className="text-lg font-bold text-red-600">{formatNumber(product.diferencia)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal para Personalizar Gráficas */}
        <Modal
          isOpen={isChartModalOpen}
          onClose={() => setIsChartModalOpen(false)}
          title="Personalizar Dashboard"
        >
          <div className="space-y-6">
            <p className="text-sm text-camouflage-green-700">
              Selecciona las gráficas que deseas mostrar en el dashboard:
            </p>

            <div className="flex justify-center gap-3 rounded-lg border border-camouflage-green-200 bg-camouflage-green-50 p-3">
              <Button
                onClick={showAllCharts}
                variant="outline"
                className="flex items-center gap-2 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100"
              >
                <Eye className="h-4 w-4" />
                Mostrar Todas
              </Button>
              <Button
                onClick={hideAllCharts}
                variant="outline"
                className="flex items-center gap-2 border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-100"
              >
                <EyeOff className="h-4 w-4" />
                Ocultar Todas
              </Button>
            </div>

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
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
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
                          className={`font-semibold ${
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
        </Modal>
      </div>
    </MainLayout>
  )
}
