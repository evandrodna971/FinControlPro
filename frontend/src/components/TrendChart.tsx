import { ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Area, AreaChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TrendData {
    name: string
    value: number
}

interface TrendChartProps {
    incomeData: TrendData[]
    expenseData: TrendData[]
}

export function TrendChart({ incomeData, expenseData }: TrendChartProps) {
    // Merge income and expense data for the chart
    const mergedData = incomeData.map((income, index) => ({
        name: income.name,
        Receitas: income.value,
        Despesas: expenseData[index]?.value || 0
    }))

    return (
        <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
                <CardTitle>Tendências Mensais</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={mergedData}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `R$${value}`}
                        />
                        <Tooltip
                            cursor={{ stroke: '#ccc', strokeWidth: 1 }}
                            contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)'
                            }}
                            formatter={(value: number) => `R$${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="Receitas"
                            stroke="#22c55e"
                            strokeWidth={2}
                            fill="url(#colorIncome)"
                            dot={{ fill: '#22c55e', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="Despesas"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#colorExpense)"
                            dot={{ fill: '#ef4444', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

