import React, { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Edit, ArrowUp } from 'lucide-react'
import * as Icons from 'lucide-react'
import { UserBadge } from '@/components/UserBadge'
import { ImportTransactionsDialog } from '@/components/ImportTransactionsDialog'
import { Upload } from 'lucide-react'
import { SEO } from '@/components/SEO'

interface Transaction {
    id: number;
    amount: number;
    description: string;
    category_name: string;
    category_icon?: string;
    category_color?: string;
    type: string;
    date: string;
    created_at?: string;
    status: 'paid' | 'pending' | 'overdue';
    paid_at?: string;
    due_date?: string;
    total_value?: number;
    installment_number?: number;
    installment_count?: number;
    is_recurring?: boolean;
    // User identification fields
    created_by_user_id?: number;
    created_by_name?: string;
    created_by_color?: string;
    created_by_emoji?: string;
    is_joint?: boolean;
}

// Helper to get icon component from lucide-react by name
const getIconComponent = (iconName?: string): React.ComponentType<any> => {
    if (!iconName) return Icons.HelpCircle;
    // @ts-ignore - Dynamic icon access
    const IconComponent = Icons[iconName as keyof typeof Icons];
    // Lucide icons are objects (React components), not functions
    return (IconComponent || Icons.HelpCircle) as React.ComponentType<any>;
};

export default function Transactions() {
    const navigate = useNavigate()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all')
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

    const fetchTransactions = async () => {
        try {
            const { data } = await api.get('/transactions/', {
                params: {
                    summary_view: true
                }
            })
            console.log('[DEBUG] Transactions API response:', data);
            console.log('[DEBUG] Number of transactions:', data?.length);
            setTransactions(data)
        } catch (error) {
            console.error("Erro ao carregar transações", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTransactions()
    }, [])

    // --- Delete Confirmation State ---
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
    const [deleteOption, setDeleteOption] = useState<'single' | 'all'>('single')
    const [deleteMonth, setDeleteMonth] = useState<number>(new Date().getMonth() + 1)
    const [deleteYear, setDeleteYear] = useState<number>(new Date().getFullYear())

    const [importDialogOpen, setImportDialogOpen] = useState(false)

    const openDeleteModal = (transaction: Transaction) => {
        setTransactionToDelete(transaction)
        setDeleteOption('single')
        // Default to current date or transaction date if available
        const date = new Date(transaction.date)
        setDeleteMonth(date.getMonth() + 1)
        setDeleteYear(date.getFullYear())
        setDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!transactionToDelete) return

        try {
            await api.delete(`/transactions/${transactionToDelete.id}`, {
                params: {
                    delete_type: deleteOption,
                    month: deleteOption === 'single' ? deleteMonth : undefined,
                    year: deleteOption === 'single' ? deleteYear : undefined
                }
            })

            setTransactions(prev => prev.filter(t => {
                if (deleteOption === 'all') {
                    // Remove all with same parent_id (or if it's the parent)
                    // Simplified: Refresh list or aggressive filter
                    // For now, let's filter just the deleted ID and maybe others if we knew them.
                    // Safest is to refetch or just remove the one visible row for now.
                    // If 'summary_view' is on, we are seeing the parent usually.
                    return t.id !== transactionToDelete.id
                } else {
                    // Single delete
                    return t.id !== transactionToDelete.id
                }
            }))

            // Refetch to be safe about nuances (e.g. amounts updating)
            fetchTransactions()

            setSelectedIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(transactionToDelete.id)
                return newSet
            })
            setDeleteModalOpen(false)
        } catch (error: any) {
            console.error("Erro ao excluir", error)
            alert("Erro ao excluir transação: " + (error.response?.data?.detail || "Erro desconhecido"))
        }
    }

    // --- End Delete State ---

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return
        if (!confirm(`Tem certeza que deseja excluir ${selectedIds.size} transação(ões)?`)) return

        try {
            await api.post('/transactions/bulk-delete', Array.from(selectedIds))
            setTransactions(prev => prev.filter(t => !selectedIds.has(t.id)))
            setSelectedIds(new Set())
            alert("Transações excluídas com sucesso!")
        } catch (error: any) {
            console.error("Erro na exclusão em massa", error)
            alert("Erro ao excluir transações: " + (error.response?.data?.detail || "Erro desconhecido"))
        }
    }

    const toggleSelection = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const filteredAndSortedTransactions = useMemo(() => {
        let result = [...transactions];

        // Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(t =>
                t.description.toLowerCase().includes(lowerTerm) ||
                (t.category_name || "").toLowerCase().includes(lowerTerm)
            );
        }

        if (typeFilter !== 'all') {
            result = result.filter(t => t.type === typeFilter);
        }

        if (statusFilter !== 'all') {
            result = result.filter(t => t.status === statusFilter);
        }

        // Sort by date descending by default
        result.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        });

        return result;
    }, [transactions, searchTerm, typeFilter, statusFilter]);

    return (
        <div className="min-h-screen p-4 md:p-8 bg-background text-foreground pb-24 md:pb-8">
            <SEO title="Transações" description="Gerencie todas as suas receitas e despesas em um só lugar." />
            {/* Delete Modal */}
            {deleteModalOpen && transactionToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Excluir Transação</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Como deseja excluir a transação <strong>{transactionToDelete.description}</strong>?
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 cursor-pointer" onClick={() => setDeleteOption('single')}>
                                        <input
                                            type="radio"
                                            id="delete-single"
                                            name="deleteOption"
                                            value="single"
                                            checked={deleteOption === 'single'}
                                            onChange={() => setDeleteOption('single')}
                                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                        />
                                        <label htmlFor="delete-single" className="text-sm font-medium cursor-pointer flex-1">
                                            Apenas uma parcela / mês específico
                                        </label>
                                    </div>

                                    {deleteOption === 'single' && (
                                        <div className="ml-7 flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex-1">
                                                <label className="text-xs text-muted-foreground font-semibold uppercase mb-1 block">Mês</label>
                                                <select
                                                    className="w-full h-10 border rounded-xl p-2 text-sm bg-background border-input"
                                                    value={deleteMonth}
                                                    onChange={(e) => setDeleteMonth(parseInt(e.target.value))}
                                                >
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                        <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-muted-foreground font-semibold uppercase mb-1 block">Ano</label>
                                                <Input
                                                    type="number"
                                                    value={deleteYear}
                                                    onChange={(e) => setDeleteYear(parseInt(e.target.value))}
                                                    className="h-10 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 cursor-pointer" onClick={() => setDeleteOption('all')}>
                                        <input
                                            type="radio"
                                            id="delete-all"
                                            name="deleteOption"
                                            value="all"
                                            checked={deleteOption === 'all'}
                                            onChange={() => setDeleteOption('all')}
                                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                        />
                                        <label htmlFor="delete-all" className="text-sm font-medium cursor-pointer flex-1">
                                            Todas as recorrências / TUDO
                                        </label>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                                    <Button variant="outline" className="w-full sm:w-auto rounded-xl" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
                                    <Button variant="destructive" className="w-full sm:w-auto rounded-xl" onClick={confirmDelete}>Excluir Agora</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Link to="/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Minhas Transações</h1>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {selectedIds.size > 0 && (
                        <Button variant="destructive" onClick={handleBulkDelete} className="flex-1 sm:flex-none">
                            Excluir ({selectedIds.size})
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="flex-1 sm:flex-none">
                        <Upload className="w-4 h-4 mr-2" />
                        <span className="hidden xs:inline text-xs sm:text-sm">Importar CSV</span>
                    </Button>
                    <Link to="/add-transaction" className="flex-1 sm:flex-none">
                        <Button className="w-full rounded-xl">Nova</Button>
                    </Link>
                </div>
            </div>

            <ImportTransactionsDialog
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
                onImportSuccess={() => {
                    fetchTransactions()
                    setImportDialogOpen(false)
                }}
            />

            <Card className="mb-8 border-none bg-muted/20">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1">
                            <Input
                                placeholder="Filtrar por descrição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-10 rounded-xl bg-background border-none shadow-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="h-10 flex-1 md:w-[150px] rounded-xl border-none bg-background px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-primary"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                            >
                                <option value="all">Tipos</option>
                                <option value="income">Receitas</option>
                                <option value="expense">Despesas</option>
                            </select>
                            <select
                                className="h-10 flex-1 md:w-[150px] rounded-xl border-none bg-background px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-primary"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">Status</option>
                                <option value="paid">Pago</option>
                                <option value="pending">Pendente</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 sm:px-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <CardTitle className="text-xl">Histórico Detalhado</CardTitle>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="text-xs text-muted-foreground mr-auto">
                                <strong>{filteredAndSortedTransactions.length}</strong> itens
                            </div>
                            {filteredAndSortedTransactions.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-8 px-2 hover:bg-primary/5 text-primary"
                                    onClick={() => {
                                        if (selectedIds.size === filteredAndSortedTransactions.length) {
                                            setSelectedIds(new Set());
                                        } else {
                                            setSelectedIds(new Set(filteredAndSortedTransactions.map(t => t.id)));
                                        }
                                    }}
                                >
                                    {selectedIds.size === filteredAndSortedTransactions.length ? 'Desmarcar' : 'Ver Tudo'}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground animate-pulse">Carregando dados...</div>
                    ) : filteredAndSortedTransactions.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                            Nenhuma transação encontrada para este filtro.
                        </div>
                    ) : (
                        <div className="relative pl-0 sm:pl-4 space-y-3">
                            {/* Desktop-only Vertical Line */}
                            <div className="hidden sm:block absolute left-[9px] top-2 bottom-4 w-[2px] bg-gradient-to-b from-border via-border/40 to-transparent" />

                            {filteredAndSortedTransactions.map((t) => {
                                const isExpense = t.type === 'expense';
                                const IconComponent = getIconComponent(t.category_icon);
                                const dateObj = new Date(t.date);

                                return (
                                    <div
                                        key={t.id}
                                        className="relative sm:pl-8 group"
                                    >
                                        {/* Timeline Node - Desktop only */}
                                        <div className={`hidden sm:block absolute left-[2px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background shadow-sm z-10 ${isExpense ? "bg-rose-500 ring-4 ring-rose-500/10" : "bg-emerald-500 ring-4 ring-emerald-500/10"
                                            }`} />

                                        {/* Responsive Card Item */}
                                        <div className={`p-4 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 ${selectedIds.has(t.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                                            }`}>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                                {/* Left Section: Checkbox + Icon + Info */}
                                                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(t.id)}
                                                        onChange={() => toggleSelection(t.id)}
                                                        className="h-5 w-5 sm:h-4 sm:w-4 rounded-lg border-gray-300 text-primary focus:ring-primary"
                                                    />

                                                    <div
                                                        className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-inner text-white"
                                                        style={{ backgroundColor: t.category_color || '#64748b' }}
                                                    >
                                                        {React.createElement(IconComponent, { className: "w-5 h-5 sm:w-6 sm:h-6" })}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h4 className="font-bold text-sm sm:text-base truncate text-foreground leading-tight" title={t.description}>
                                                                {t.description}
                                                            </h4>
                                                            {(t.created_by_user_id || t.is_joint) && (
                                                                <div className="hidden xs:block">
                                                                    <UserBadge
                                                                        userName={t.created_by_name || 'Usuário'}
                                                                        color={t.created_by_color || '#3b82f6'}
                                                                        emoji={t.created_by_emoji || '👤'}
                                                                        isJoint={t.is_joint}
                                                                        size="sm"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                                            <span>{dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                                            <span className="w-1 h-1 rounded-full bg-border" />
                                                            <span className="truncate">{t.category_name || "Sem categoria"}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Middle Section: Status & Meta (Responsive position) */}
                                                <div className="flex items-center justify-between sm:justify-start gap-4">
                                                    <div className="flex flex-wrap gap-1.5 sm:hidden">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${t.status === 'paid' ? 'bg-emerald-100/50 text-emerald-700' : 'bg-amber-100/50 text-amber-700'}`}>
                                                            {t.status === 'paid' ? 'Pago' : 'Pendente'}
                                                        </span>
                                                        {t.installment_count && (
                                                            <span className="bg-muted px-2 py-0.5 rounded-full text-[9px] font-bold text-muted-foreground uppercase">
                                                                {t.installment_count}x
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Right Section: Price & Actions */}
                                                    <div className="flex items-center gap-4 ml-auto sm:ml-0">
                                                        <div className="text-right">
                                                            <div className={`font-black text-sm sm:text-base ${isExpense ? "text-rose-500" : "text-emerald-500"}`}>
                                                                {isExpense ? '-' : '+'}
                                                                {(t.total_value || t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                            </div>
                                                            <div className="hidden sm:flex items-center justify-end gap-2 mt-0.5">
                                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${t.status === 'paid' ? 'text-emerald-500/60' : 'text-amber-500/60'}`}>
                                                                    {t.status === 'paid' ? 'Concluído' : 'Pendente'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Actions Container - Fixed to Right */}
                                                        <div className="flex items-center gap-1">
                                                            {t.status === 'pending' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-9 w-9 text-emerald-500 bg-emerald-50 sm:bg-transparent"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await api.post(`/transactions/${t.id}/pay`);
                                                                            setTransactions(prev => prev.map(tr => tr.id === t.id ? { ...tr, status: 'paid' } : tr));
                                                                        } catch (e) {
                                                                            alert("Erro ao pagar");
                                                                        }
                                                                    }}
                                                                >
                                                                    <ArrowUp className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-blue-500 bg-blue-50 sm:bg-transparent"
                                                                onClick={() => navigate(`/add-transaction?id=${t.id}`)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-rose-500 bg-rose-50 sm:bg-transparent"
                                                                onClick={() => openDeleteModal(t)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
