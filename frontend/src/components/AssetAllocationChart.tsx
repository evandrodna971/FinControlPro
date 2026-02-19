import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, Label } from 'recharts'

interface AssetAllocationChartProps {
    data: { name: string, value: number }[]
}

const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#f97316'  // orange
]

export function AssetAllocationChart({ data }: AssetAllocationChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Sem dados de alocação
            </div>
        )
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);

    const CustomLabel = ({ viewBox }: any) => {
        const { cx, cy } = viewBox || { cx: 0, cy: 0 };
        return (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                <tspan x={cx} y={cy - 10} className="fill-foreground text-2xl font-bold">
                    {(total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
                </tspan>
                <tspan x={cx} y={cy + 15} className="fill-muted-foreground text-sm">
                    Total
                </tspan>
            </text>
        );
    };

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        <Label content={CustomLabel} position="center" />
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            padding: '8px 12px'
                        }}
                        formatter={(value: number) => {
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                            return [
                                `${(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${percentage}%)`,
                                ''
                            ];
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry: any) => {
                            const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                            return `${value} (${percentage}%)`;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}

