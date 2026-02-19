import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as Icons from 'lucide-react'

interface CategoryData {
    name: string
    value: number
    percentage: number
    limit?: number
    icon?: string
}

interface CategoryPieChartProps {
    expenseData?: CategoryData[]
    incomeData?: CategoryData[]
}

const EXPENSE_COLORS = [
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#eab308', // Yellow
    '#22c55e', // Green
    '#a855f7', // Purple
    '#f97316', // Orange
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f43f5e', // Rose
]

const INCOME_COLORS = [
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#eab308', // Yellow
    '#a855f7', // Purple
    '#f97316', // Orange
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#ef4444', // Red
    '#14b8a6', // Teal
    '#8b5cf6', // Violet
]

const RADIAN = Math.PI / 180

const renderOuterLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, icon } = props
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    const IconComponent = (Icons as any)[icon || "Circle"] || Icons.Circle

    return (
        <foreignObject x={x - 12} y={y - 12} width={24} height={24}>
            <div className="flex items-center justify-center w-full h-full">
                <IconComponent size={16} className="text-white drop-shadow-md" strokeWidth={2.5} />
            </div>
        </foreignObject>
    )
}

const renderInnerLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent } = props
    const radius = outerRadius * 0.6
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null

    const fontSize = Math.max(12, Math.min(24, 10 + (percent * 40)))

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            className="font-bold drop-shadow-md"
            style={{ fontSize: `${fontSize}px` }}
        >
            {((percent || 0) * 100).toFixed(0)}%
        </text>
    )
}

const PieChartContent = ({ data, colors, idPrefix }: { data: CategoryData[], colors: string[], idPrefix: string }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0)

    if (!data || data.length === 0 || total === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] w-full bg-muted/20 rounded-lg">
                <Icons.PieChart className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-muted-foreground text-sm">Sem dados</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            {data.map((_, index) => {
                                const color = colors[index % colors.length];
                                return (
                                    <linearGradient key={`gradient-${idPrefix}-${index}`} id={`gradient-${idPrefix}-${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity={1} />
                                        <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                                    </linearGradient>
                                )
                            })}
                            <filter id="shadow" height="200%">
                                <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.3" />
                            </filter>
                        </defs>
                        {/* Outer Ring - Colors */}
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderOuterLabel}
                            outerRadius="95%"
                            innerRadius="75%"
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={0}
                            startAngle={90}
                            endAngle={-270}
                            filter="url(#shadow)"
                        >
                            {data.map((entry, index) => {
                                return (
                                    <Cell
                                        key={`cell-${entry.name}-${index}`}
                                        fill={`url(#gradient-${idPrefix}-${index})`}
                                        stroke="none"
                                        className="hover:opacity-90 transition-opacity cursor-pointer"
                                    />
                                )
                            })}
                        </Pie>

                        {/* Shadow Ring */}
                        <Pie
                            data={[{ value: 1 }]}
                            cx="50%"
                            cy="50%"
                            outerRadius="75%"
                            innerRadius="65%"
                            dataKey="value"
                            stroke="none"
                            fill="black"
                            fillOpacity={0.1}
                            isAnimationActive={false}
                        >
                            <Cell key="shadow-cell" style={{ pointerEvents: 'none' }} />
                        </Pie>

                        {/* Inner Circle - Divider Lines & Percentages */}
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderInnerLabel}
                            outerRadius="75%"
                            innerRadius={0}
                            dataKey="value"
                            stroke="#fff"
                            strokeWidth={0.5}
                            startAngle={90}
                            endAngle={-270}
                            isAnimationActive={false}
                        >
                            {data.map((_, index) => (
                                <Cell key={`inner-cell-${index}`} fill="transparent" />
                            ))}
                        </Pie>

                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload
                                    const Icon = (Icons as any)[data.icon || 'Circle'] || Icons.Circle
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-xl z-50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="p-1 rounded-full bg-muted">
                                                    <Icon className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="font-semibold text-foreground">{data.name}</span>
                                            </div>
                                            <div className="flex flex-col gap-0.5 ml-1">
                                                <span className="text-lg font-bold text-foreground">
                                                    R$ {(data.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                {(data.limit || 0) > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Meta: R$ {(data.limit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {data.percentage || 0}% do total
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />

                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export function CategoryPieChart({ expenseData = [], incomeData = [] }: CategoryPieChartProps) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle>Análise por Categoria</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                    <PieChartContent
                        data={expenseData}
                        colors={EXPENSE_COLORS}
                        idPrefix="expense"
                    />
                    <PieChartContent
                        data={incomeData}
                        colors={INCOME_COLORS}
                        idPrefix="income"
                    />
                </div>
            </CardContent>
        </Card>
    )
}
