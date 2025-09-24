"use client"

import { DollarSign, Package, TrendingUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { InventoryMetrics } from "@/lib/types/inventory-value"

interface MetricsCardsProps {
  metrics: InventoryMetrics
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Valor Total del Inventario */}
      <Card className="border-camouflage-green-200 bg-gradient-to-br from-camouflage-green-50 to-white">
        <CardContent className="flex items-center p-6">
          <div className="rounded-full bg-camouflage-green-100 p-3">
            <DollarSign className="h-6 w-6 text-camouflage-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-camouflage-green-600">Valor Total</p>
            <p className="text-2xl font-bold text-camouflage-green-900">{formatCurrency(metrics.totalValue)}</p>
            <p className="text-xs text-camouflage-green-500">Inventario actual</p>
          </div>
        </CardContent>
      </Card>

      {/* Stock Total de Unidades */}
      <Card className="border-camouflage-green-200 bg-gradient-to-br from-camouflage-green-50 to-white">
        <CardContent className="flex items-center p-6">
          <div className="rounded-full bg-camouflage-green-100 p-3">
            <Package className="h-6 w-6 text-camouflage-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-camouflage-green-600">Stock Total</p>
            <p className="text-2xl font-bold text-camouflage-green-900">{metrics.totalStock.toLocaleString()}</p>
            <p className="text-xs text-camouflage-green-500">Unidades disponibles</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
