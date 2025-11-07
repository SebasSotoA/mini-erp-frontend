"use client"

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts"

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

interface ChartProps {
  data: any[]
  height?: number
}

export function ProfitabilityChart({ data, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => `€${Number(value).toLocaleString()}`} />
        <Legend />
        <Bar dataKey="revenue" fill="#3B82F6" name="Ingresos" />
        <Bar dataKey="cost" fill="#EF4444" name="Costos" />
        <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} name="Ganancia" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function CategoryDistributionChart({ data, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `€${Number(value).toLocaleString()}`} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function InventoryTrendChart({ data, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function PerformanceGaugeChart({ data, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={data}>
        <RadialBar dataKey="value" cornerRadius={10} fill="#3B82F6" />
        <Tooltip />
      </RadialBarChart>
    </ResponsiveContainer>
  )
}
