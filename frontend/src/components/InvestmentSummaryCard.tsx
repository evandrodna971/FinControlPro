import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface InvestmentSummaryCardProps {
    title: string;
    value: number;
    variation?: number;
    icon?: React.ReactNode;
    colorScheme?: 'default' | 'blue' | 'indigo' | 'profit' | 'loss';
    delay?: number;
    customFormatter?: (value: number) => string;
    showVariation?: boolean; // controla se mostra a variação percentual
}

// Paletas de cores por esquema (igual ao dashboard)
const SCHEMES = {
    blue: {
        card: 'bg-gradient-to-br from-blue-950 to-cyan-950 dark:from-blue-50 dark:to-cyan-50 border-blue-800 dark:border-blue-200',
        title: 'text-blue-300 dark:text-blue-700',
        icon: 'text-blue-400 dark:text-blue-600',
        value: 'text-blue-100 dark:text-blue-900',
        sub: 'text-blue-400 dark:text-blue-600',
    },
    indigo: {
        card: 'bg-gradient-to-br from-indigo-950 to-violet-950 dark:from-indigo-50 dark:to-violet-50 border-indigo-800 dark:border-indigo-200',
        title: 'text-indigo-300 dark:text-indigo-700',
        icon: 'text-indigo-400 dark:text-indigo-600',
        value: 'text-indigo-100 dark:text-indigo-900',
        sub: 'text-indigo-400 dark:text-indigo-600',
    },
    profit: {
        card: 'bg-gradient-to-br from-green-950 to-emerald-950 dark:from-green-50 dark:to-emerald-50 border-green-800 dark:border-green-200',
        title: 'text-green-300 dark:text-green-700',
        icon: 'text-green-400 dark:text-green-600',
        value: 'text-green-400 dark:text-green-700',
        sub: 'text-green-400 dark:text-green-600',
    },
    loss: {
        card: 'bg-gradient-to-br from-red-950 to-rose-950 dark:from-red-50 dark:to-rose-50 border-red-800 dark:border-red-200',
        title: 'text-red-300 dark:text-red-700',
        icon: 'text-red-400 dark:text-red-600',
        value: 'text-red-400 dark:text-red-700',
        sub: 'text-red-400 dark:text-red-600',
    },
    default: {
        card: 'bg-gradient-to-br from-blue-950 to-cyan-950 dark:from-blue-50 dark:to-cyan-50 border-blue-800 dark:border-blue-200',
        title: 'text-blue-300 dark:text-blue-700',
        icon: 'text-blue-400 dark:text-blue-600',
        value: 'text-blue-100 dark:text-blue-900',
        sub: 'text-blue-400 dark:text-blue-600',
    },
}

export function InvestmentSummaryCard({
    title,
    value,
    variation,
    icon,
    colorScheme = 'default',
    delay = 0,
    customFormatter,
    showVariation = true,
}: InvestmentSummaryCardProps) {
    const [displayValue, setDisplayValue] = useState(0);

    // Animação de contagem
    useEffect(() => {
        const duration = 900;
        const steps = 50;
        const increment = value / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;
            if (step >= steps) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(current);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    const scheme = SCHEMES[colorScheme] || SCHEMES.default;

    const formattedValue = customFormatter
        ? customFormatter(displayValue || 0)
        : (displayValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ scale: 1.03, y: -4 }}
            className="h-full"
        >
            <Card className={`h-full transition-all duration-300 hover:shadow-xl cursor-pointer ${scheme.card}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${scheme.title}`}>
                        {title}
                    </CardTitle>
                    {icon && (
                        <span className={`h-4 w-4 ${scheme.icon}`}>
                            {icon}
                        </span>
                    )}
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${scheme.value}`}>
                        {formattedValue}
                    </div>

                    {showVariation && variation != null && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${scheme.sub}`}>
                            {variation >= 0
                                ? <TrendingUp className="w-3 h-3" />
                                : <TrendingDown className="w-3 h-3" />
                            }
                            {variation > 0 && '+'}{variation.toFixed(2)}% (30d)
                        </p>
                    )}

                    {(!showVariation || variation == null) && (
                        <p className={`text-xs mt-1 ${scheme.sub}`}>
                            {colorScheme === 'blue' || colorScheme === 'default' ? 'Valor atual da carteira' :
                                colorScheme === 'indigo' ? 'Capital aportado' :
                                    colorScheme === 'profit' ? 'Rendimento positivo' :
                                        colorScheme === 'loss' ? 'Rendimento negativo' : ''}
                        </p>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
