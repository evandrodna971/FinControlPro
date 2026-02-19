import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface EvolutionData {
    date: string;
    value: number;
}

interface PortfolioEvolutionChartProps {
    className?: string;
}

export function PortfolioEvolutionChart({ className }: PortfolioEvolutionChartProps) {
    const [data, setData] = useState<EvolutionData[]>([]);
    const [days, setDays] = useState(30);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEvolution = async () => {
        setIsLoading(true);
        try {
            const response = await api.get<EvolutionData[]>(`/investments/evolution?days=${days}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching evolution data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvolution();
    }, [days]);

    const formatDate = (dateStr: string) => {
        try {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        } catch (e) {
            return '-';
        }
    };

    const formatCurrency = (value: number) => {
        return (value || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Evolução do Patrimônio
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant={days === 7 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDays(7)}
                        >
                            7d
                        </Button>
                        <Button
                            variant={days === 30 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDays(30)}
                        >
                            30d
                        </Button>
                        <Button
                            variant={days === 90 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDays(90)}
                        >
                            90d
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">
                            Carregando dados...
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Sem dados de evolução disponíveis
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                className="text-xs"
                                stroke="hsl(var(--muted-foreground))"
                            />
                            <YAxis
                                tickFormatter={formatCurrency}
                                className="text-xs"
                                stroke="hsl(var(--muted-foreground))"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    padding: '8px 12px'
                                }}
                                labelFormatter={(label) => {
                                    try {
                                        const date = new Date(label);
                                        if (isNaN(date.getTime())) return 'Data inválida';
                                        return date.toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric'
                                        });
                                    } catch (e) {
                                        return 'Data inválida';
                                    }
                                }}
                                formatter={(value: number) => [formatCurrency(value), 'Patrimônio']}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
