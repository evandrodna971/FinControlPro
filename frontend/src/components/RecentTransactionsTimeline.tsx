import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Transaction {
    id: number;
    amount: number;
    description: string;
    category_name: string;
    category_icon?: string;
    category_color?: string;
    type: string;
    date: string;
    status: string;
    total_value?: number;
    installment_number?: number;
    installment_count?: number;
    is_recurring?: boolean;
}

interface RecentTransactionsTimelineProps {
    transactions: Transaction[];
}

// Helper to get icon component from lucide-react by name
const getIconComponent = (iconName?: string): React.ComponentType<any> => {
    console.log('Icon name from backend:', iconName); // DEBUG
    if (!iconName) return Icons.HelpCircle;
    // @ts-ignore - Dynamic icon access
    const IconComponent = Icons[iconName as keyof typeof Icons];
    console.log('Icon component found:', !!IconComponent, 'Type:', typeof IconComponent); // DEBUG
    // Lucide icons are objects (React components), not functions
    return (IconComponent || Icons.HelpCircle) as React.ComponentType<any>;
};

export function RecentTransactionsTimeline({ transactions }: RecentTransactionsTimelineProps) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                <p>Nenhuma transação recente encontrada.</p>
            </div>
        );
    }

    return (
        <div className="relative pl-4 space-y-6">
            {/* Continuous Vertical Line */}
            <div className="absolute left-[9px] top-2 bottom-4 w-[2px] bg-gradient-to-b from-border/80 via-border/40 to-transparent" />

            {transactions.slice(0, 5).map((t, i) => {
                const isExpense = t.type === 'expense';
                const IconComponent = getIconComponent(t.category_icon);
                return (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative pl-8 group"
                    >


                        {/* Timeline Node - Centered Vertically */}
                        <div className={cn(
                            "absolute left-[2px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background shadow-sm z-10",
                            isExpense ? "bg-rose-500 ring-4 ring-rose-500/10" : "bg-emerald-500 ring-4 ring-emerald-500/10"
                        )} />

                        {/* Card Content */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300">

                            {/* Left Side: Category Badge & Description */}
                            <div className="flex items-center gap-4 overflow-hidden">
                                {/* Category Icon */}
                                <div
                                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-inner text-white"
                                    style={{ backgroundColor: t.category_color || '#64748b' }}
                                >
                                    {React.createElement(IconComponent, { className: "w-6 h-6" })}
                                </div>

                                <div className="min-w-0 space-y-1">
                                    <h4 className="font-semibold text-sm truncate text-foreground" title={t.description}>
                                        {t.description}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md">
                                            <Calendar className="w-3 h-3" />
                                            {(() => {
                                                try {
                                                    const d = new Date(t.date);
                                                    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                                                } catch (e) { return '-'; }
                                            })()}
                                        </span>
                                        {(t.installment_count ?? 0) > 1 && (
                                            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium border border-border">
                                                {t.installment_count}x
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Amount */}
                            <div className="text-right pl-4 shrink-0">
                                <span className={cn(
                                    "font-bold text-base block whitespace-nowrap",
                                    isExpense ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                                )}>
                                    {isExpense ? '-' : '+'}
                                    {(t.total_value || t.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                                <span className={cn(
                                    "text-[10px] uppercase font-bold tracking-wide block mt-0.5",
                                    isExpense ? "text-rose-600/60" : "text-emerald-600/60"
                                )}>
                                    {isExpense ? 'Despesa' : 'Receita'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
