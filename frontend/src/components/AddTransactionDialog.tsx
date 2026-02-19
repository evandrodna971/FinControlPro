import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface AddTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    assetId: number
    assetSymbol: string
    onTransactionAdded: () => void
}

export function AddTransactionDialog({
    open,
    onOpenChange,
    assetId,
    assetSymbol,
    onTransactionAdded
}: AddTransactionDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        transaction_type: 'buy',
        quantity: '',
        price: '',
        fees: '0',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const qty = parseFloat(formData.quantity)
        const prc = parseFloat(formData.price)
        const fee = parseFloat(formData.fees || '0')

        try {
            await api.post(`/investments/transactions?asset_id=${assetId}`, {
                transaction_type: formData.transaction_type,
                quantity: qty,
                price: prc,
                total_value: (qty * prc) + (formData.transaction_type === 'buy' ? fee : -fee),
                fees: fee,
                date: new Date(formData.date).toISOString(),
                notes: formData.notes
            })

            toast.success('Transação registrada com sucesso!')
            onOpenChange(false)
            setFormData({
                transaction_type: 'buy',
                quantity: '',
                price: '',
                fees: '0',
                date: format(new Date(), 'yyyy-MM-dd'),
                notes: ''
            })
            onTransactionAdded()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao registrar transação.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Transação - {assetSymbol}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Tipo de Transação</Label>
                        <Select
                            value={formData.transaction_type}
                            onValueChange={(v) => setFormData({ ...formData, transaction_type: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="buy">Compra</SelectItem>
                                <SelectItem value="sell">Venda</SelectItem>
                                <SelectItem value="dividend">Provento / Dividendo</SelectItem>
                                <SelectItem value="split">Desdobramento (Split)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantidade</Label>
                            <Input
                                id="quantity"
                                type="number"
                                step="any"
                                placeholder="0.00"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">
                                {formData.transaction_type === 'dividend' ? 'Valor por Ação' :
                                    formData.transaction_type === 'split' ? 'Multiplicador (Ex: 10)' : 'Preço Unitário'}
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                step="any"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fees">Taxas / Corretagem</Label>
                            <Input
                                id="fees"
                                type="number"
                                step="any"
                                placeholder="0.00"
                                value={formData.fees}
                                onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Data</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas (Opcional)</Label>
                        <Input
                            id="notes"
                            placeholder="Ex: Nota de corretagem #123"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {formData.quantity && formData.price && (
                        <div className="p-3 bg-muted rounded-md text-sm">
                            <div className="flex justify-between font-medium">
                                <span>Valor Total:</span>
                                <span>
                                    {((parseFloat(formData.quantity) * parseFloat(formData.price)) +
                                        (formData.transaction_type === 'buy' ? parseFloat(formData.fees || '0') : -parseFloat(formData.fees || '0')))
                                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Registrando...' :
                                formData.transaction_type === 'split' ? 'Registrar Desdobramento' : 'Registrar Transação'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
