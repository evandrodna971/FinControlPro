import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Calendar, Check } from 'lucide-react'
import { Button } from './ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface Transaction {
    id: number;
    description: string;
    amount: number;
    due_date: string;
    status: string;
    type: string;
}

export function UpcomingBills({ month, year, onUpdate }: { month: number, year: number, onUpdate?: () => void }) {
    const [bills, setBills] = useState<Transaction[]>([])

    const fetchData = () => {
        api.get('/transactions/upcoming/list', {
            params: { month, year }
        }).then(res => {
            setBills(res.data)
        })
    }

    useEffect(() => {
        fetchData()
    }, [month, year])

    const handleSettle = async (id: number) => {
        try {
            await api.post(`/transactions/${id}/pay`)
            fetchData()
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error("Erro ao dar baixa", error)
        }
    }

    if (!bills || bills.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border dark:border-border/50">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                    <Check className="w-6 h-6 text-primary" />
                </div>
                <p className="text-muted-foreground font-medium">Tudo em dia!</p>
                <p className="text-xs text-muted-foreground mt-1">Nenhuma conta pendente.</p>
            </div>
        )
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
            <AnimatePresence>
                {bills.map((bill) => {
                    const billDate = new Date(bill.due_date);
                    const isInvalidDate = isNaN(billDate.getTime());
                    const isOverdue = !isInvalidDate && billDate < new Date() && new Date().toDateString() !== billDate.toDateString()
                    const isToday = !isInvalidDate && new Date().toDateString() === billDate.toDateString()

                    return (
                        <div
                            key={bill.id}
                            className={`relative overflow-hidden rounded-xl bg-slate-950/40 backdrop-blur-md border border-white/5 shadow-lg hover:shadow-2xl hover:bg-slate-900/60 transition-all duration-300 group`}
                        >
                            {/* Accent Line */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${bill.type === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'}`} />

                            <div className="p-4 pl-5 flex flex-col justify-between h-full space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-slate-100 text-sm leading-tight line-clamp-1" title={bill.description}>
                                            {bill.description}
                                        </h3>
                                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                                            <Calendar className="w-3 h-3" />
                                            <span>{isInvalidDate ? '-' : billDate.toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    {(isOverdue || isToday) && (
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${isOverdue ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-blue-900/30 text-blue-400 border border-blue-900/50'
                                            }`}>
                                            {isOverdue ? 'Atrasado' : 'Hoje'}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-end justify-between pt-2">
                                    <div>
                                        <div className="text-slate-500 text-[10px] uppercase font-semibold">Valor</div>
                                        <div className={`text-lg font-bold ${bill.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            R$ {(bill.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                        onClick={() => handleSettle(bill.id)}
                                        title={bill.type === 'income' ? "Confirmar Recebimento" : "Dar Baixa"}
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </AnimatePresence>
        </motion.div>
    )
}
