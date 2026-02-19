import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, TrendingUp, TrendingDown, CircleDollarSign } from 'lucide-react'

interface Transaction {
    id: number
    transaction_type: 'buy' | 'sell' | 'dividend'
    quantity: number
    price: number
    total_value: number
    fees: number
    date: string
    notes: string | null
}

interface AssetTransactionsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    assetId: number | null
    assetSymbol: string | null
    onTransactionDeleted: () => void
}

export function AssetTransactionsModal({
    open,
    onOpenChange,
    assetId,
    assetSymbol,
    onTransactionDeleted
}: AssetTransactionsModalProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(false)

    const fetchTransactions = async () => {
        if (!assetId) return
        setLoading(true)
        try {
            const response = await api.get<Transaction[]>(`/investments/assets/${assetId}/transactions`)
            setTransactions(response.data)
        } catch (error) {
            console.error(error)
            toast.error('Erro ao carregar histórico de transações.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open && assetId) {
            fetchTransactions()
        }
    }, [open, assetId])

    const handleDeleteTransaction = async (id: number) => {
        try {
            await api.delete(`/investments/transactions/${id}`)
            toast.success('Transação removida com sucesso!')
            fetchTransactions()
            onTransactionDeleted()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao remover transação.')
        }
    }

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'buy': return <TrendingUp className="h-4 w-4 text-green-600" />
            case 'sell': return <TrendingDown className="h-4 w-4 text-red-600" />
            case 'dividend': return <CircleDollarSign className="h-4 w-4 text-blue-600" />
            default: return null
        }
    }

    const getTransactionLabel = (type: string) => {
        switch (type) {
            case 'buy': return 'Compra'
            case 'sell': return 'Venda'
            case 'dividend': return 'Provento'
            default: return type
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Histórico de Transações - {assetSymbol}</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            Carregando transações...
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            Nenhuma transação encontrada.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">Quantidade</TableHead>
                                    <TableHead className="text-right">Preço</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-xs">
                                            {format(new Date(tx.date), 'dd/MM/yyyy', { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getTransactionIcon(tx.transaction_type)}
                                                <span className="text-xs font-medium">{getTransactionLabel(tx.transaction_type)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs">
                                            {(tx.quantity || 0).toLocaleString('pt-BR')}
                                        </TableCell>
                                        <TableCell className="text-right text-xs">
                                            {(tx.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-medium">
                                            {(tx.total_value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDeleteTransaction(tx.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
