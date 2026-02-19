import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTransactionStore } from '@/store/useTransactionStore'
import { motion, AnimatePresence } from 'framer-motion'

interface TransactionPreviewProps {
    isSubmitting?: boolean;
}

export const TransactionPreview: React.FC<TransactionPreviewProps> = ({ isSubmitting }) => {
    const data = useTransactionStore()

    const isEmpty = !data.amount && !data.description

    return (
        <div className="lg:sticky lg:top-6 w-full">
            <Card className="overflow-hidden border-2 border-primary/10 shadow-lg relative">
                {isSubmitting && (
                    <div className="absolute inset-0 bg-background/50 z-50 flex flex-col gap-2 items-center justify-center backdrop-blur-[2px]">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <span className="text-sm font-medium text-primary animate-pulse">Salvando...</span>
                    </div>
                )}
                <motion.div
                    initial={false}
                    animate={{ backgroundColor: data.type === 'expense' ? '#ef4444' : '#22c55e' }}
                    className="h-2 w-full transition-colors duration-300"
                />
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                        Preview da Transação
                        {!isEmpty ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            >
                                <Check className="h-4 w-4 text-green-500" />
                            </motion.div>
                        ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isEmpty ? (
                        <div className="py-8 text-center space-y-3">
                            <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto opacity-50">
                                <Loader2 className="h-6 w-6 text-muted-foreground animate-pulse" />
                            </div>
                            <p className="text-sm text-muted-foreground font-medium">Preencha os campos para ver o preview</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="content"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="space-y-1">
                                    <motion.div
                                        key={data.amount}
                                        initial={{ scale: 0.95, opacity: 0.8 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={cn(
                                            "text-3xl font-black tracking-tight transition-colors duration-300",
                                            data.type === 'expense' ? 'text-red-500' : 'text-green-500'
                                        )}>
                                        {data.amount || 'R$ --,--'}
                                    </motion.div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border transition-colors",
                                            data.type === 'expense'
                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                : 'bg-green-50 text-green-600 border-green-100'
                                        )}>
                                            {data.type === 'expense' ? 'Despesa' : 'Receita'}
                                        </span>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                            data.status === 'paid'
                                                ? (data.type === 'expense' ? "bg-green-50 text-green-600 border-green-100" : "bg-green-50 text-green-600 border-green-100") // Pago/Recebido -> Verde
                                                : "bg-yellow-50 text-yellow-600 border-yellow-100" // Pendente -> Amarelo
                                        )}>
                                            {data.status === 'paid' ? (data.type === 'expense' ? 'Pago' : 'Recebido') : 'Pendente'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 mt-6">
                                    <div>
                                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Descrição</Label>
                                        <p className="font-semibold text-sm break-words">{data.description || '--'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Categoria</Label>
                                            <p className="text-sm font-medium">{data.categoryName || 'Sem Categoria'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Data</Label>
                                            <p className="text-sm font-medium">
                                                {data.date ? new Date(data.date).toLocaleDateString('pt-BR') : '--'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Pagamento</Label>
                                            <p className="text-sm font-medium">{data.paymentMethod || '--'}</p>
                                        </div>
                                        {data.isInstallment && (
                                            <div>
                                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Parcelas</Label>
                                                <p className="text-sm font-medium text-primary">{data.installmentCount}x</p>
                                            </div>
                                        )}
                                    </div>

                                    {(data.tags.length > 0 || data.location) && (
                                        <div className="pt-2 border-t border-dashed border-border flex flex-wrap gap-2">
                                            {data.location && (
                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                                    <span className="opacity-70">📍</span> {data.location}
                                                </div>
                                            )}
                                            {data.tags.map((tag, i) => (
                                                <div key={i} className="text-[11px] text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                                                    #{tag}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </CardContent>
            </Card>
            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10 text-[11px] text-muted-foreground leading-relaxed">
                ✨ Este preview usa Zustand para garantir atualizações instantâneas e melhor performance.
            </div>
        </div>
    )
}
