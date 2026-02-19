import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface PerformanceData {
    portfolio_return: number;
    cdi_return: number;
    ibov_return: number;
    vs_cdi: number;
    vs_ibov: number;
}

export function PerformanceIndicator() {
    const [data, setData] = useState<PerformanceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                const response = await api.get<PerformanceData>('/investments/performance-comparison');
                setData(response.data);
            } catch (error) {
                console.error('Error fetching performance data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPerformance();
    }, []);

    const getIndicatorColor = (value: number) => {
        if (value > 0) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
        if (value < 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
        return 'text-muted-foreground bg-muted/50 border-border';
    };

    const getIcon = (value: number) => {
        if (value > 0) return <TrendingUp className="w-4 h-4" />;
        if (value < 0) return <TrendingDown className="w-4 h-4" />;
        return <Activity className="w-4 h-4" />;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Performance vs Mercado
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[100px] flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">
                            Carregando...
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Performance vs Mercado
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CDI Comparison */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`p-4 rounded-lg border ${getIndicatorColor(data.vs_cdi)}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">vs CDI</span>
                            {getIcon(data.vs_cdi)}
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-bold">
                                {data.vs_cdi > 0 && '+'}
                                {(data.vs_cdi || 0).toFixed(2)}%
                            </div>
                            <div className="text-xs opacity-70">
                                Carteira: {(data.portfolio_return || 0).toFixed(2)}% | CDI: {(data.cdi_return || 0).toFixed(2)}%
                            </div>
                        </div>
                    </motion.div>

                    {/* IBOVESPA Comparison */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className={`p-4 rounded-lg border ${getIndicatorColor(data.vs_ibov)}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">vs IBOVESPA</span>
                            {getIcon(data.vs_ibov)}
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-bold">
                                {data.vs_ibov > 0 && '+'}
                                {(data.vs_ibov || 0).toFixed(2)}%
                            </div>
                            <div className="text-xs opacity-70">
                                Carteira: {(data.portfolio_return || 0).toFixed(2)}% | IBOV: {(data.ibov_return || 0).toFixed(2)}%
                            </div>
                        </div>
                    </motion.div>
                </div>
            </CardContent>
        </Card>
    );
}
