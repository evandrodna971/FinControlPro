import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Hash, ChevronRight, ChevronLeft, Check, Target, BarChart3, Wallet, Search } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'

interface TransactionItem {
    id: string
    date: string
    quantity: string
    price: string
    broker: string
    fees: string
}

interface AddAssetDialogProps {
    onAssetAdded: () => void
}

export function AddAssetDialog({ onAssetAdded }: AddAssetDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)

    const [assetData, setAssetData] = useState({
        symbol: '',
        name: '',
        asset_type: 'stock',
        market: 'BR',
        sector: '',
        dividend_yield: '0',
    })

    const [transactions, setTransactions] = useState<TransactionItem[]>([
        { id: Math.random().toString(), date: format(new Date(), 'yyyy-MM-dd'), quantity: '', price: '', broker: '', fees: '0' }
    ])
    const [searchResults, setSearchResults] = useState<any[]>([])


    const nextStep = () => {
        if (step === 1 && (!assetData.symbol || !assetData.name)) {
            toast.error('Preencha o símbolo e nome do ativo.')
            return
        }
        setStep(step + 1)
    }

    const prevStep = () => setStep(step - 1)

    const addTransactionRow = () => {
        setTransactions([
            ...transactions,
            { id: Math.random().toString(), date: format(new Date(), 'yyyy-MM-dd'), quantity: '', price: '', broker: transactions[transactions.length - 1]?.broker || '', fees: '0' }
        ])
    }

    const removeTransactionRow = (id: string) => {
        if (transactions.length > 1) {
            setTransactions(transactions.filter(t => t.id !== id))
        }
    }

    const updateTransaction = (id: string, field: keyof TransactionItem, value: string) => {
        setTransactions(transactions.map(t => t.id === id ? { ...t, [field]: value } : t))
    }



    const handleSubmit = async () => {
        for (const tx of transactions) {
            if (!tx.quantity || !tx.price || parseFloat(tx.quantity) <= 0 || parseFloat(tx.price) <= 0) {
                toast.error('Quantidade e preço devem ser maiores que zero.')
                return
            }
        }

        setLoading(true)
        try {
            const assetResponse = await api.post('/investments/assets', {
                symbol: assetData.symbol,
                name: assetData.name,
                asset_type: assetData.asset_type,
                market: assetData.market,
                sector: assetData.sector || null,
                dividend_yield: parseFloat(assetData.dividend_yield || '0'),
            })

            const assetId = assetResponse.data.id

            for (const tx of transactions) {
                const qty = parseFloat(tx.quantity)
                const price = parseFloat(tx.price)
                await api.post(`/investments/transactions?asset_id=${assetId}`, {
                    transaction_type: 'buy',
                    quantity: qty,
                    price: price,
                    total_value: qty * price,
                    fees: parseFloat(tx.fees || '0'),
                    date: new Date(tx.date).toISOString(),
                    broker: tx.broker || null,
                    notes: 'Compra registrada no cadastro do ativo.'
                })
            }

            toast.success(`${assetData.symbol} adicionado com sucesso!`)
            setOpen(false)
            resetForm()

            // Adiciona à watchlist (quantity=0) para acompanhar cotações
            try {
                await api.post('/investments/assets', {
                    symbol: assetData.symbol,
                    name: assetData.name,
                    asset_type: assetData.asset_type,
                    market: assetData.market,
                    sector: assetData.sector || null,
                    dividend_yield: 0,
                })
            } catch {
                // Silencioso — ativo pode já existir na watchlist
            }

            // Refresh após tudo estar persistido
            onAssetAdded()

        } catch (error) {
            console.error(error)
            toast.error('Erro ao salvar investimento.')
        } finally {
            setLoading(false)
        }
    }


    const resetForm = () => {
        setAssetData({
            symbol: '',
            name: '',
            asset_type: 'stock',
            market: 'BR',
            sector: '',
            dividend_yield: '0',
        })
        setTransactions([
            { id: Math.random().toString(), date: format(new Date(), 'yyyy-MM-dd'), quantity: '', price: '', broker: '', fees: '0' }
        ])
        setSearchResults([])
        setStep(1)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 px-6 font-bold tracking-tight">
                    <Plus className="mr-2 h-4 w-4" /> Novo Ativo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] w-[95%] p-0 overflow-hidden border-none shadow-2xl bg-slate-50 dark:bg-slate-950 max-h-[95vh] flex flex-col">
                {/* Header with Step Indicator */}
                <div className="bg-white dark:bg-slate-900 border-b p-4">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                    <Target className="h-5 w-5" />
                                </div>
                                Cadastro de Ativo
                            </h2>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold opacity-70">
                                Etapa {step} de 3
                            </p>
                        </div>
                        <div className="flex gap-1.5">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 dark:bg-slate-800'}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-around items-center relative">
                        <div className="absolute h-px bg-slate-100 dark:bg-slate-800 w-[80%] -z-10" />
                        <div className={`flex flex-col items-center gap-2 transition-all ${step === 1 ? 'scale-110' : 'opacity-40 grayscale'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                                <Hash className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Ticker</span>
                        </div>
                        <div className={`flex flex-col items-center gap-2 transition-all ${step === 2 ? 'scale-110' : 'opacity-40 grayscale'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Métricas</span>
                        </div>
                        <div className={`flex flex-col items-center gap-2 transition-all ${step === 3 ? 'scale-110' : 'opacity-40 grayscale'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                                <Wallet className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Ordens</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 min-h-[350px] flex flex-col items-center justify-center overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full space-y-6"
                            >
                                <div className="text-center space-y-2 mb-4">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Qual o seu novo ativo?</h3>
                                    <p className="text-slate-500 text-sm">Busque pelo ticker ou nome para preencher automaticamente.</p>
                                </div>

                                <div className="relative">
                                    <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1 mb-1 block">Buscar Ativo Auto-Preenchimento</Label>
                                    <div className="relative z-50">
                                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Digite para buscar (ex: LEVE3, AAPL, BTC)..."
                                            className="pl-9 h-12 text-lg"
                                            onChange={async (e) => {
                                                const query = e.target.value;
                                                setAssetData({ ...assetData, symbol: query.toUpperCase() }) // Keep manual override possible

                                                if (query.length > 2) {
                                                    try {
                                                        // Import marketService dynamically if needed or assume it's available in scope
                                                        // We will assume marketService is imported from '@/services/marketService'
                                                        const { marketService } = await import('@/services/marketService');
                                                        const results = await marketService.searchAssets(query);
                                                        // Show results in a dropdown (needs state)
                                                        // For this quick fix, I will use a simple suggestion list below
                                                        setSearchResults(results);
                                                    } catch (err) {
                                                        console.error(err);
                                                    }
                                                } else {
                                                    setSearchResults([]);
                                                }
                                            }}
                                            value={assetData.symbol}
                                        />
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                {searchResults.map((result) => (
                                                    <div
                                                        key={result.symbol}
                                                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center transition-colors"
                                                        onClick={() => {
                                                            setAssetData({
                                                                ...assetData,
                                                                symbol: result.symbol,
                                                                name: result.name,
                                                                asset_type: result.type || 'stock',
                                                                market: result.market || 'BR'
                                                            });
                                                            setSearchResults([]);
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                                                                {result.symbol.substring(0, 2)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-slate-900 dark:text-white">{result.symbol}</p>
                                                                <p className="text-[10px] text-slate-500">{result.name}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary" className="text-[10px]">{result.market}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                        * Selecione um ativo da lista para preencher os dados automaticamente (Mercado, Tipo, Nome).
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5 text-left w-full">
                                        <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Símbolo (Ticker)</Label>
                                        <Input
                                            placeholder="PETR4, AAPL, BTC..."
                                            value={assetData.symbol}
                                            onChange={(e) => setAssetData({ ...assetData, symbol: e.target.value.toUpperCase() })}
                                            className="h-12 text-lg font-black border-none bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/5 ring-1 ring-slate-200 dark:ring-slate-800 transition-all focus:ring-2 focus:ring-blue-500 placeholder:font-normal placeholder:text-slate-400 placeholder:text-sm px-4"
                                        />
                                    </div>
                                    <div className="space-y-1.5 text-left w-full">
                                        <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Nome Completo</Label>
                                        <Input
                                            placeholder="Ex: Petrobras PN"
                                            value={assetData.name}
                                            onChange={(e) => setAssetData({ ...assetData, name: e.target.value })}
                                            className="h-12 text-base font-bold border-none bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/5 ring-1 ring-slate-200 dark:ring-slate-800 transition-all focus:ring-2 focus:ring-blue-500 placeholder:font-normal placeholder:text-slate-400 placeholder:text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 pt-2">
                                    <div className="space-y-1.5 text-left">
                                        <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Tipo de Ativo</Label>
                                        <Select value={assetData.asset_type} onValueChange={(v) => setAssetData({ ...assetData, asset_type: v })}>
                                            <SelectTrigger className="h-12 text-sm font-bold border-none bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl shadow-blue-500/5"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="stock" className="font-bold">Ação</SelectItem>
                                                <SelectItem value="reit" className="font-bold">FII / REIT</SelectItem>
                                                <SelectItem value="crypto" className="font-bold">Criptomoeda</SelectItem>
                                                <SelectItem value="bond" className="font-bold">Renda Fixa</SelectItem>
                                                <SelectItem value="fund" className="font-bold">Fundo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                        <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Mercado Base</Label>
                                        <Select value={assetData.market} onValueChange={(v) => setAssetData({ ...assetData, market: v })}>
                                            <SelectTrigger className="h-12 text-sm font-bold border-none bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl shadow-blue-500/5"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BR" className="font-bold">Brasil (B3)</SelectItem>
                                                <SelectItem value="US" className="font-bold">EUA (US Dollar)</SelectItem>
                                                <SelectItem value="CRYPTO" className="font-bold">Cripto World</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full space-y-12"
                            >
                                <div className="text-center space-y-1 mb-4">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 px-3 py-1 mb-1 text-[10px]">Dados Técnicos</Badge>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Onde ele se encaixa?</h3>
                                    <p className="text-slate-500 text-xs">Estas informações ajudam a classificar sua carteira.</p>
                                </div>

                                <div className="space-y-8 max-w-sm mx-auto">
                                    <div className="space-y-1.5 text-left">
                                        <div className="flex items-center justify-between ml-1">
                                            <Label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Setor / Segmento</Label>
                                            <span className="text-[10px] text-slate-400 italic">Ex: Tecnologia, Financeiro, Saúde</span>
                                        </div>
                                        <Input
                                            placeholder="Qual o setor deste ativo?"
                                            value={assetData.sector}
                                            onChange={(e) => setAssetData({ ...assetData, sector: e.target.value })}
                                            className="h-12 text-sm font-bold border-none bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl shadow-blue-500/5 focus:ring-2 focus:ring-blue-500 placeholder:font-normal placeholder:text-slate-400 px-4"
                                        />
                                    </div>

                                    <div className="space-y-1.5 text-left">
                                        <div className="flex items-center justify-between ml-1">
                                            <Label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Dividend Yield Esperado (%)</Label>
                                            <span className="text-[10px] text-slate-400 italic">Retorno anual projetado</span>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={assetData.dividend_yield}
                                                onChange={(e) => setAssetData({ ...assetData, dividend_yield: e.target.value })}
                                                className="h-12 font-black border-none bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl shadow-blue-500/5 focus:ring-2 focus:ring-blue-500 text-lg pr-12 placeholder:font-normal placeholder:text-slate-400 px-4"
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-blue-600">%</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full mt-[-20px]"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Suas Compras</h3>
                                        <p className="text-xs text-slate-500">Registre cada ordem de compra separadamente.</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addTransactionRow}
                                        className="rounded-full bg-white font-bold text-xs ring-1 ring-slate-200 border-none shadow-sm hover:bg-slate-50 text-blue-600"
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Nova Linha
                                    </Button>
                                </div>

                                <ScrollArea className="h-[280px] pr-4 -mr-4">
                                    <div className="space-y-4 pb-2 text-slate-900 dark:text-white">
                                        {transactions.map((tx) => (
                                            <div key={tx.id} className="relative group p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/50 transition-all">
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-semibold text-slate-400 ml-1">Data da Compra</Label>
                                                        <Input
                                                            type="date"
                                                            value={tx.date}
                                                            onChange={(e) => updateTransaction(tx.id, 'date', e.target.value)}
                                                            className="h-10 text-xs font-bold border-none bg-slate-50/50 dark:bg-slate-800/30 text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-semibold text-slate-400 ml-1">Corretora</Label>
                                                        <Input
                                                            placeholder="XP, Clear, BTG..."
                                                            value={tx.broker}
                                                            onChange={(e) => updateTransaction(tx.id, 'broker', e.target.value)}
                                                            className="h-10 text-xs font-bold border-none bg-slate-50/50 dark:bg-slate-800/30 text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-semibold text-slate-400 ml-1">Quantidade</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={tx.quantity}
                                                            onChange={(e) => updateTransaction(tx.id, 'quantity', e.target.value)}
                                                            className="h-10 text-xs font-black border-none bg-slate-50/50 dark:bg-slate-800/30 text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-semibold text-slate-400 ml-1">Preço Unitário</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={tx.price}
                                                            onChange={(e) => updateTransaction(tx.id, 'price', e.target.value)}
                                                            className="h-10 text-xs font-black border-none bg-slate-50/50 dark:bg-slate-800/30 text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                                {transactions.length > 1 && (
                                                    <button
                                                        onClick={() => removeTransactionRow(tx.id)}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-100 dark:bg-rose-900/50 text-rose-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ring-4 ring-white dark:ring-slate-950"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center px-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Total Estimado</span>
                                                    <span className="text-xs font-black text-blue-600">
                                                        {parseFloat(tx.quantity || '0') > 0 && parseFloat(tx.price || '0') > 0
                                                            ? (parseFloat(tx.quantity) * parseFloat(tx.price)).toLocaleString(
                                                                (assetData.market === 'US' || assetData.market === 'CRYPTO' || assetData.asset_type === 'crypto') ? 'en-US' : 'pt-BR',
                                                                { style: 'currency', currency: (assetData.market === 'US' || assetData.market === 'CRYPTO' || assetData.asset_type === 'crypto') ? 'USD' : 'BRL' }
                                                            )
                                                            : '---'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation Footer */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t flex items-center justify-between">
                    <div className="flex gap-2 text-slate-900 dark:text-white">
                        {step > 1 ? (
                            <Button variant="ghost" onClick={prevStep} className="rounded-full font-bold px-4 hover:bg-slate-50">
                                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                            </Button>
                        ) : (
                            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full font-bold px-4">
                                Cancelar
                            </Button>
                        )}
                    </div>

                    {step < 3 ? (
                        <Button
                            onClick={nextStep}
                            className="bg-slate-900 hover:bg-black text-white rounded-full px-8 font-bold shadow-xl shadow-black/10 flex items-center group"
                        >
                            Próximo Passo
                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 font-black shadow-xl shadow-blue-500/30 flex items-center"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                                    Finalizando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Check className="h-4 w-4" /> Concluir Ativo
                                </span>
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
