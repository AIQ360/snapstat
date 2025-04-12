import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {trend && (
          <div className={`mt-2 flex items-center text-xs ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            <span className="ml-1 text-muted-foreground">from previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
