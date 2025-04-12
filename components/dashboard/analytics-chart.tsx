"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Chart, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AnalyticsChartProps {
  title: string
  description?: string
  data: any[]
  dataKey: string
  xAxisKey?: string
  chartType?: "line" | "area" | "bar"
}

export function AnalyticsChart({
  title,
  description,
  data,
  dataKey,
  xAxisKey = "date",
  chartType = "line",
}: AnalyticsChartProps) {
  const [selectedChartType, setSelectedChartType] = useState(chartType)

  const formatXAxis = (tickItem: string) => {
    if (xAxisKey === "date") {
      try {
        return format(new Date(tickItem), "MMM dd")
      } catch (e) {
        return tickItem
      }
    }
    return tickItem
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    }

    switch (selectedChartType) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorData" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey={xAxisKey} tickFormatter={formatXAxis} />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="var(--color-primary)"
              fillOpacity={1}
              fill="url(#colorData)"
            />
          </AreaChart>
        )
      case "bar":
        return (
          <BarChart {...commonProps}>
            <XAxis dataKey={xAxisKey} tickFormatter={formatXAxis} />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip content={<ChartTooltipContent />} />
            <Bar dataKey={dataKey} fill="var(--color-primary)" />
          </BarChart>
        )
      case "line":
      default:
        return (
          <LineChart {...commonProps}>
            <XAxis dataKey={xAxisKey} tickFormatter={formatXAxis} />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Select
          value={selectedChartType}
          onValueChange={(value: "line" | "area" | "bar") => setSelectedChartType(value)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Chart Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Line</SelectItem>
            <SelectItem value="area">Area</SelectItem>
            <SelectItem value="bar">Bar</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Chart
          config={{
            [dataKey]: {
              label: title,
              color: "hsl(var(--primary))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </Chart>
      </CardContent>
    </Card>
  )
}
