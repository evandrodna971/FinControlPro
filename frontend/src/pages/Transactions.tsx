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
        <div className="min-h-screen p-8 bg-background text-foreground">
            <SEO title="Transações" description="Gerencie todas as suas receitas e despesas em um só lugar." />
            {/* Delete Modal */}
            {deleteModalOpen && transactionToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-[400px]">
                        <CardHeader>
                            <CardTitle>Excluir Transação</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Como deseja excluir a transação <strong>{transactionToDelete.description}</strong>?
                                </p>

                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="delete-single"
                                            name="deleteOption"
                                            value="single"
                                            checked={deleteOption === 'single'}
                                            onChange={() => setDeleteOption('single')}
                                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                        />
                                        <label htmlFor="delete-single" className="text-sm font-medium">
                                            Apenas uma parcela / mês específico
                                        </label>
                                    </div>

                                    {deleteOption === 'single' && (
                                        <div className="ml-6 flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-xs text-muted-foreground">Mês</label>
                                                <select
                                                    className="w-full border rounded p-1 text-sm bg-background"
                                                    value={deleteMonth}
                                                    onChange={(e) => setDeleteMonth(parseInt(e.target.value))}
                                                >
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                        <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-muted-foreground">Ano</label>
                                                <Input
                                                    type="number"
                                                    value={deleteYear}
                                                    onChange={(e) => setDeleteYear(parseInt(e.target.value))}
                                                    className="h-[28px]"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="delete-all"
                                            name="deleteOption"
                                            value="all"
                                            checked={deleteOption === 'all'}
                                            onChange={() => setDeleteOption('all')}
                                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                        />
                                        <label htmlFor="delete-all" className="text-sm font-medium">
                                            Todas as recorrências / TUDO
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
                                    <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Todas as Transações</h1>
                </div>
                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <Button variant="destructive" onClick={handleBulkDelete}>
                            Excluir ({selectedIds.size})
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Importar CSV (Nubank)
                    </Button>
                    <Link to="/add-transaction">
                        <Button>Nova Transação</Button>
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

            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Buscar por descrição ou categoria..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-[200px]">
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                            >
                                <option value="all">Todos os Tipos</option>
                                <option value="income">Receitas</option>
                                <option value="expense">Despesas</option>
                            </select>
                        </div>
                        <div className="w-full md:w-[200px]">
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">Todos os Status</option>
                                <option value="paid">Pago</option>
                                <option value="pending">Pendente</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Histórico Completo</CardTitle>
                        <div className="flex items-center gap-3">
                            <div className="text-sm text-muted-foreground">
                                {filteredAndSortedTransactions.length} registros encontrados
                            </div>
                            {filteredAndSortedTransactions.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (selectedIds.size === filteredAndSortedTransactions.length) {
                                            setSelectedIds(new Set());
                                        } else {
                                            setSelectedIds(new Set(filteredAndSortedTransactions.map(t => t.id)));
                                        }
                                    }}
                                >
                                    {selectedIds.size === filteredAndSortedTransactions.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
                    ) : filteredAndSortedTransactions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Nenhuma transação encontrada</div>
                    ) : (
                        <div className="relative pl-4 space-y-4">
                            {/* Continuous Vertical Line */}
                            <div className="absolute left-[9px] top-2 bottom-4 w-[2px] bg-gradient-to-b from-border/80 via-border/40 to-transparent" />

                            {filteredAndSortedTransactions.map((t) => {
                                const isExpense = t.type === 'expense';
                                const IconComponent = getIconComponent(t.category_icon);
                                const dateObj = new Date(t.date);

                                return (
                                    <div
                                        key={t.id}
                                        className="relative pl-8 group"
                                    >
                                        {/* Timeline Node - Centered Vertically */}
                                        <div className={`absolute left-[2px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background shadow-sm z-10 ${isExpense ? "bg-rose-500 ring-4 ring-rose-500/10" : "bg-emerald-500 ring-4 ring-emerald-500/10"
                                            }`} />

                                        {/* Card Content */}
                                        <div className={`flex items-center justify-between p-4 rounded-xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 ${selectedIds.has(t.id) ? 'ring-2 ring-primary/50 bg-primary/5' : ''
                                            }`}>

                                            {/* Left Side: Checkbox + Category Badge & Description */}
                                            <div className="flex items-center gap-4 overflow-hidden flex-1">
                                                {/* Checkbox */}
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(t.id)}
                                                    onChange={() => toggleSelection(t.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                                                />

                                                {/* Category Icon */}
                                                <div
                                                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-inner text-white"
                                                    style={{ backgroundColor: t.category_color || '#64748b' }}
                                                >
                                                    {React.createElement(IconComponent, { className: "w-6 h-6" })}
                                                </div>

                                                <div className="min-w-0 space-y-1 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-sm truncate text-foreground" title={t.description}>
                                                            {t.description}
                                                        </h4>
                                                        {(t.created_by_user_id || t.is_joint) && (
                                                            <UserBadge
                                                                userName={t.created_by_name || 'Usuário'}
                                                                color={t.created_by_color || '#3b82f6'}
                                                                emoji={t.created_by_emoji || '👤'}
                                                                isJoint={t.is_joint}
                                                                size="sm"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                                        <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md">
                                                            {dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="bg-muted/50 px-2 py-0.5 rounded-md">
                                                            {t.category_name || "Sem Categoria"}
                                                        </span>
                                                        {t.installment_count && t.installment_count > 1 && (
                                                            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium border border-border">
                                                                {t.installment_count}x
                                                            </span>
                                                        )}
                                                        {t.is_recurring && (
                                                            <span className="bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                                                Recorrente
                                                            </span>
                                                        )}
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                            t.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            }`}>
                                                            {t.status === 'paid' ? 'Pago' : t.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Side: Amount + Actions */}
                                            <div className="flex items-center gap-4 shrink-0">
                                                {/* Amount */}
                                                <div className="text-right">
                                                    <span className={`font-bold text-base block whitespace-nowrap ${isExpense ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                                                        }`}>
                                                        {isExpense ? '-' : '+'}
                                                        {(t.total_value || t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                    <span className={`text-[10px] uppercase font-bold tracking-wide block mt-0.5 ${isExpense ? "text-rose-600/60" : "text-emerald-600/60"
                                                        }`}>
                                                        {isExpense ? 'Despesa' : 'Receita'}
                                                    </span>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {t.status === 'pending' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-green-500 hover:bg-green-100 hover:text-green-700"
                                                            onClick={async () => {
                                                                try {
                                                                    await api.post(`/transactions/${t.id}/pay`);
                                                                    setTransactions(prev => prev.map(tr => tr.id === t.id ? { ...tr, status: 'paid' } : tr));
                                                                } catch (e) {
                                                                    alert("Erro ao pagar transação");
                                                                }
                                                            }}
                                                            title="Marcar como Pago"
                                                        >
                                                            <ArrowUp className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                                                        onClick={() => navigate(`/add-transaction?id=${t.id}`)}
                                                        title="Editar"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-700"
                                                        onClick={() => openDeleteModal(t)}
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
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
