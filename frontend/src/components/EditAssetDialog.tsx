import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface EditAssetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    asset: {
        id: number
        symbol: string
        name: string
        asset_type: string
        market: string
        sector?: string
        dividend_yield?: number
    } | null
    onAssetUpdated: () => void
}

export function EditAssetDialog({
    open,
    onOpenChange,
    asset,
    onAssetUpdated
}: EditAssetDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        symbol: '',
        name: '',
        asset_type: 'stock',
        market: 'BR',
        sector: '',
        dividend_yield: '0'
    })

    useEffect(() => {
        if (asset) {
            setFormData({
                symbol: asset.symbol,
                name: asset.name,
                asset_type: asset.asset_type,
                market: asset.market,
                sector: asset.sector || '',
                dividend_yield: asset.dividend_yield?.toString() || '0'
            })
        }
    }, [asset])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!asset) return

        setLoading(true)
        try {
            await api.put(`/investments/assets/${asset.id}`, {
                ...formData,
                dividend_yield: parseFloat(formData.dividend_yield || '0')
            })
            toast.success('Ativo atualizado com sucesso!')
            onOpenChange(false)
            onAssetUpdated()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao atualizar ativo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Ativo - {asset?.symbol}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-symbol">Símbolo (Ticker)</Label>
                        <Input
                            id="edit-symbol"
                            value={formData.symbol}
                            onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Nome</Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-type">Tipo</Label>
                            <Select
                                value={formData.asset_type}
                                onValueChange={(v) => setFormData({ ...formData, asset_type: v })}
                            >
                                <SelectTrigger id="edit-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stock">Ação</SelectItem>
                                    <SelectItem value="crypto">Criptomoeda</SelectItem>
                                    <SelectItem value="fund">Fundo (FII/FIA)</SelectItem>
                                    <SelectItem value="bond">Renda Fixa</SelectItem>
                                    <SelectItem value="reit">REIT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-market">Mercado</Label>
                            <Select
                                value={formData.market}
                                onValueChange={(v) => setFormData({ ...formData, market: v })}
                            >
                                <SelectTrigger id="edit-market">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BR">Brasil</SelectItem>
                                    <SelectItem value="US">EUA</SelectItem>
                                    <SelectItem value="CRYPTO">Cripto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-sector">Setor / Segmento</Label>
                            <Input
                                id="edit-sector"
                                placeholder="Ex: Tecnologia, Energia"
                                value={formData.sector}
                                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-dy">Dividend Yield (%)</Label>
                            <Input
                                id="edit-dy"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.dividend_yield}
                                onChange={(e) => setFormData({ ...formData, dividend_yield: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
