import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
// Card imports removed as charts are not used in this view
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// Charts and Table removed in favor of Grid view
import { InvestmentSummaryCard } from '@/components/InvestmentSummaryCard'
import { AddAssetDialog } from '@/components/AddAssetDialog'
import { AddTransactionDialog } from '@/components/AddTransactionDialog'
import { EditAssetDialog } from '@/components/EditAssetDialog'
import { DeleteAssetDialog } from '@/components/DeleteAssetDialog'
import { AssetTransactionsModal } from '@/components/AssetTransactionsModal'
import { AssetLogo } from '@/components/AssetLogo'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    MoreHorizontal, Pencil, Plus, History, Trash2, Wallet,
    TrendingUp, TrendingDown, PiggyBank, Search, Filter,
    ArrowUp, ArrowDown
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { marketService } from '@/services/marketService'
import { AssetHistoryChart } from '@/components/market/AssetHistoryChart'
import { toast } from 'sonner'
import { SEO } from '@/components/SEO'


interface Asset {
    id: number
    symbol: string
    name: string
    asset_type: string
    market: string
    sector?: string
    dividend_yield?: number
    quantity: number
    average_price: number
    current_price: number | null
    total_value?: number // computed
    profit?: number // computed
    profit_pct?: number // computed
    // Multi-currency support
    source_currency?: 'BRL' | 'USD'
    original_price?: number
    original_average_price?: number
}

interface PortfolioSummary {
    total_balance: number
    total_invested: number
    total_profit: number
    profit_percentage: number
    balance_variation_30d: number
    invested_variation_30d: number
    profit_variation_30d: number
    performance_vs_cdi: number
    performance_vs_ibov: number
    asset_allocation: { name: string, value: number }[]
    performance_history: any[]
}

export default function Investments() {
    const [summary, setSummary] = useState<PortfolioSummary | null>(null)
    const [assets, setAssets] = useState<Asset[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Modal states
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
    const [isEditAssetOpen, setIsEditAssetOpen] = useState(false)
    const [isDeleteAssetOpen, setIsDeleteAssetOpen] = useState(false)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)

    // Filter & Sort states
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [sortConfig] = useState<{ key: keyof Asset | 'portfolio_pct', direction: 'asc' | 'desc' } | null>({
        key: 'total_value',
        direction: 'desc'
    })

    // Watchlist State - Integrating new requirements
    const [assetSearchQuery, setAssetSearchQuery] = useState('')
    const [assetSearchResults, setAssetSearchResults] = useState<any[]>([])
    const [isSearchingAsset, setIsSearchingAsset] = useState(false)
    const [watchlist, setWatchlist] = useState<any[]>([]) // In real app, load from DB
    const [selectedWatchlistAsset, setSelectedWatchlistAsset] = useState<any | null>(null)
    const [rates, setRates] = useState({ USDBRL: 5.0, EURBRL: 5.5 })
    const [portfolioCurrency, setPortfolioCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL')

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [summaryRes, assetsRes] = await Promise.all([
                api.get<PortfolioSummary>('/investments/summary'),
                api.get<Asset[]>('/investments/assets')
            ])
            setSummary(summaryRes.data)

            const allAssets = assetsRes.data

            // 1. Process Portfolio Assets (Quantity > 0)
            let portfolioAssets = allAssets.filter(a => a.quantity > 0).map(asset => {
                // Determine source currency
                // US stocks -> USD
                // Crypto -> USD (usually)
                // B3 -> BRL
                let sourceCurrency: 'BRL' | 'USD' = 'BRL'
                if (asset.market === 'US' || asset.asset_type === 'crypto' || asset.market === 'CRYPTO') {
                    sourceCurrency = 'USD'
                }

                // Initial mapping with stored data
                return {
                    ...asset,
                    // Ensure numbers
                    quantity: Number(asset.quantity),
                    average_price: Number(asset.average_price || 0),
                    current_price: Number(asset.current_price || asset.average_price || 0),
                    total_value: Number(asset.quantity) * Number(asset.current_price || asset.average_price || 0),

                    // Store original info for conversion
                    source_currency: sourceCurrency,
                    original_average_price: Number(asset.average_price || 0),
                    original_price: Number(asset.current_price || asset.average_price || 0)
                }
            })

            // Fetch REAL-TIME quotes for portfolio assets
            if (portfolioAssets.length > 0) {
                try {
                    const portfolioQuotes = await marketService.getWatchlistQuotes(
                        portfolioAssets.map(a => ({ symbol: a.symbol, type: a.asset_type, market: a.market }))
                    )

                    // Update assets with real-time prices
                    const assetsWithUpdatedPrices: Array<{ id: number; price: number }> = []

                    portfolioAssets = portfolioAssets.map(asset => {
                        // Case-insensitive match para suportar símbolos como BITCOIN, bitcoin, BTC
                        const quote = portfolioQuotes.find(q =>
                            q.symbol.toUpperCase() === asset.symbol.toUpperCase()
                        )

                        let realCurrentPrice: number
                        if (quote?.price && quote.price > 0) {
                            // Temos cotação em tempo real — usa ela e agenda persistência
                            realCurrentPrice = quote.price
                            assetsWithUpdatedPrices.push({ id: asset.id, price: realCurrentPrice })
                        } else {
                            // Sem cotação: usa current_price do banco se parecer válido,
                            // senão usa average_price como fallback seguro
                            const storedPrice = asset.current_price || 0
                            const avgPrice = asset.average_price || 0
                            // Se current_price for 0 ou for muito menor que average_price (>90% abaixo), usa average_price
                            const isSuspect = storedPrice <= 0 || (avgPrice > 0 && storedPrice < avgPrice * 0.1)
                            realCurrentPrice = isSuspect ? avgPrice : storedPrice
                        }

                        return {
                            ...asset,
                            current_price: realCurrentPrice,
                            original_price: realCurrentPrice
                        }
                    })

                    // Persiste current_price no banco de forma silenciosa (fire-and-forget)
                    // Isso garante que ao recarregar a tela, o valor do banco é válido como fallback
                    if (assetsWithUpdatedPrices.length > 0) {
                        Promise.all(
                            assetsWithUpdatedPrices.map(({ id, price }) =>
                                api.put(`/investments/assets/${id}`, { current_price: price })
                                    .catch(err => console.warn(`Falha ao persistir preço do ativo ${id}:`, err))
                            )
                        )
                    }

                } catch (err) {
                    console.error("Failed to fetch real-time portfolio quotes", err)
                    // Fallback to existing logic if fetch fails is already handled by initial mapping
                }
            }

            setAssets(portfolioAssets)

            // 2. Process Watchlist Assets (Quantity === 0)
            const watchlistItems = allAssets.filter(a => a.quantity === 0)

            if (watchlistItems.length > 0) {
                // Fetch live data for watchlist — passa market para identificar criptos corretamente
                const quotes = await marketService.getWatchlistQuotes(
                    watchlistItems.map(w => ({ symbol: w.symbol, type: w.asset_type, market: w.market }))
                )

                const enrichedWatchlist = watchlistItems.map(item => {
                    // Case-insensitive para evitar mismatch (ex: BTC vs btc, BITCOIN vs bitcoin)
                    const quote = quotes.find(q => q.symbol.toUpperCase() === item.symbol.toUpperCase())
                    return {
                        id: item.id,
                        symbol: item.symbol,
                        name: item.name,
                        type: item.asset_type,
                        market: item.market,
                        value: quote?.value || '-',
                        change: quote?.change || 0,
                        price: quote?.price || 0,
                        currency: quote?.currency
                    }
                })
                setWatchlist(enrichedWatchlist)
            } else {
                setWatchlist([])
            }

        } catch (error) {
            console.error("Error fetching investments:", error)
            toast.error("Erro ao carregar investimentos")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const fetchRates = async () => {
            const r = await marketService.getExchangeRates()
            setRates(r)
        }
        fetchRates()
        fetchData()
    }, [])

    const handleAssetSearch = async (query: string) => {
        setAssetSearchQuery(query)
        if (query.length > 2) {
            setIsSearchingAsset(true)
            try {
                const results = await marketService.searchAssets(query)
                setAssetSearchResults(results)
            } catch (error) {
                console.error("Search error", error)
            } finally {
                setIsSearchingAsset(false)
            }
        } else {
            setAssetSearchResults([])
        }
    }

    const addToWatchlist = async (item: any) => {
        // Optimistic check
        if (watchlist.some(w => w.symbol === item.symbol) || assets.some(a => a.symbol === item.symbol)) {
            toast.warning("Ativo já está na sua lista ou carteira")
            return
        }

        try {
            // Create asset with quantity 0 (handled by backend default or explicit logic if needed, but schema allows omit)
            // We map the search result item to the expected backend payload
            const payload = {
                symbol: item.symbol,
                name: item.name,
                asset_type: item.type || 'stock', // Default to stock if missing
                market: item.market || 'BR', // Use market from search result or default to BR
                sector: null, // We might not have this from search
            }

            await api.post('/investments/assets', payload)

            toast.success(`${item.symbol} adicionado à watchlist!`)
            setAssetSearchQuery('')
            setAssetSearchResults([])
            fetchData() // Refresh to get the new ID and data
        } catch (error) {
            console.error("Error adding to watchlist:", error)
            toast.error("Erro ao adicionar ativo")
        }
    }

    const removeFromWatchlist = async (symbol: string) => {
        // We need the ID to delete from backend. 
        // The watchlist state now includes the ID (mapped in fetchData).
        const item = watchlist.find(w => w.symbol === symbol)
        if (!item?.id) return

        try {
            await api.delete(`/investments/assets/${item.id}`)
            toast.success("Ativo removido")
            fetchData() // Refresh
        } catch (error) {
            console.error("Error removing from watchlist:", error)
            toast.error("Erro ao remover ativo")
        }
    }

    // useEffect(() => {
    //     fetchData()
    // }, []) REMOVED DUPLICATE EFFECT

    // Currency Conversion Helper
    const convert = (val: number, source: 'BRL' | 'USD' | 'EUR', target: 'BRL' | 'USD' | 'EUR') => {
        if (!val) return 0
        if (source === target) return val

        // Normalize to BRL first
        let valInBrl = val
        if (source === 'USD') valInBrl = val * rates.USDBRL
        if (source === 'EUR') valInBrl = val * rates.EURBRL

        // Convert to target
        if (target === 'BRL') return valInBrl
        if (target === 'USD') return valInBrl / rates.USDBRL
        if (target === 'EUR') return valInBrl / rates.EURBRL

        return val
    }

    // Derived state for display
    const displayAssets = assets.map(asset => {
        const source = asset.source_currency || 'BRL'
        const target = portfolioCurrency

        // Use original values for conversion to avoid double conversion drift
        const avgPrice = convert(asset.original_average_price || asset.average_price, source, target)
        const currPrice = convert(asset.original_price || asset.current_price || 0, source, target)

        const totalVal = asset.quantity * currPrice
        const invested = asset.quantity * avgPrice
        const profit = totalVal - invested
        const profitPct = invested > 0 ? (profit / invested) * 100 : 0

        return {
            ...asset,
            display_average_price: avgPrice,
            display_current_price: currPrice,
            display_total_value: totalVal,
            display_profit: profit,
            display_profit_pct: profitPct
        }
    })

    // Derived watchlist for display
    const displayWatchlist = watchlist.map(item => {
        let source: 'BRL' | 'USD' = 'BRL'
        let type = item.type
        let market = item.market

        // Infer type/market if missing
        if (!type || !market) {
            if (/^(BTC|ETH|SOL|XRP|BNB|DOGE|ADA|AVAX)$/i.test(item.symbol)) {
                type = 'crypto'
                market = 'CRYPTO'
            } else if (/^[A-Z]{1,5}$/.test(item.symbol)) {
                // Heuristic: 1-5 letters without numbers -> likely US stock (e.g. AAPL, MCD, KO, T, F)
                // BR stocks usually have numbers (PETR4, VALE3) or 11 (XPLG11)
                // Exception: some ETFs or indices? But good enough heuristic for now.
                type = 'stock'
                market = 'US'
            }
        }

        // Determine source currency
        if (market === 'US' || type === 'crypto' || market === 'CRYPTO') {
            source = 'USD'
        }

        const displayPrice = convert(item.price, source, portfolioCurrency)

        return {
            ...item,
            type,
            market,
            display_price: displayPrice,
            source_currency: source // Pass source for chart debugging if needed
        }
    })

    // Derived summary
    const displaySummary = (() => {
        if (!summary) return null

        const totalBalance = displayAssets.reduce((acc, curr) => acc + curr.display_total_value, 0)
        const totalInvested = displayAssets.reduce((acc, curr) => acc + (curr.quantity * curr.display_average_price), 0)
        const totalProfit = totalBalance - totalInvested
        const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0

        return {
            ...summary,
            total_balance: totalBalance,
            total_invested: totalInvested,
            total_profit: totalProfit,
            profit_percentage: profitPercentage
        }
    })()


    const filteredAssets = displayAssets
        .filter(asset => {
            const matchesSearch = asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                asset.sector?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesType = filterType === 'all' || asset.asset_type === filterType
            return matchesSearch && matchesType
        })
        .sort((a, b) => {
            if (!sortConfig) return 0
            const { key, direction } = sortConfig

            let aVal: any = a[key as keyof Asset]
            let bVal: any = b[key as keyof Asset]

            // Override keys for display values
            if (key === 'total_value') {
                aVal = a.display_total_value
                bVal = b.display_total_value
            }
            if (key === 'average_price') {
                aVal = a.display_average_price
                bVal = b.display_average_price
            }
            if (key === 'current_price') {
                aVal = a.display_current_price
                bVal = b.display_current_price
            }

            if (key === 'portfolio_pct') {
                aVal = (a.display_total_value || 0)
                bVal = (b.display_total_value || 0)
            }

            if (aVal == null) return direction === 'asc' ? -1 : 1
            if (bVal == null) return direction === 'asc' ? 1 : -1

            if (aVal < bVal) return direction === 'asc' ? -1 : 1
            if (aVal > bVal) return direction === 'asc' ? 1 : -1
            return 0
        })



    // Helper for formatting currency
    const formatCurrency = (value: number | undefined | null) => {
        if (value == null) return portfolioCurrency === 'BRL' ? 'R$ 0,00' : portfolioCurrency === 'USD' ? '$ 0.00' : '€ 0.00'
        return value.toLocaleString(portfolioCurrency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency: portfolioCurrency })
    }


    return (
        <div className="p-6 space-y-6">
            <SEO title="Investimentos" description="Acompanhe sua carteira de investimentos, cotações em tempo real e watchlist." />
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-between items-center"
            >
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        Meus Investimentos
                    </h1>
                    <p className="text-slate-500 font-medium">Gerencie sua carteira e acompanhe o mercado.</p>
                </div>
                {/* Currency Selector */}
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 h-fit">
                    {(['BRL', 'USD', 'EUR'] as const).map((curr) => (
                        <button
                            key={curr}
                            onClick={() => setPortfolioCurrency(curr)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${portfolioCurrency === curr
                                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            {curr}
                        </button>
                    ))}
                </div>
            </motion.div>

            <Tabs defaultValue="my-assets" className="space-y-8">
                <TabsList className="bg-slate-100 dark:bg-slate-900/50 p-1.5 h-auto rounded-full border border-slate-200 dark:border-slate-800 w-fit shadow-inner">
                    <TabsTrigger
                        value="my-assets"
                        className="rounded-full px-6 py-2.5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-blue-400 transition-all"
                    >
                        <Wallet className="w-4 h-4 mr-2" /> Minha Carteira
                    </TabsTrigger>
                    <TabsTrigger
                        value="watchlist"
                        className="rounded-full px-6 py-2.5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-blue-400 transition-all"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" /> Watchlist
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="my-assets" className="space-y-8 focus-visible:outline-none">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InvestmentSummaryCard
                            title="Patrimônio Total"
                            value={displaySummary?.total_balance || 0}
                            icon={<Wallet className="w-5 h-5" />}
                            colorScheme="blue"
                            delay={0}
                            customFormatter={formatCurrency}
                            showVariation={false}
                        />
                        <InvestmentSummaryCard
                            title="Total Investido"
                            value={displaySummary?.total_invested || 0}
                            variation={displaySummary?.profit_percentage}
                            icon={<PiggyBank className="w-5 h-5" />}
                            colorScheme="indigo"
                            delay={0.1}
                            customFormatter={formatCurrency}
                            showVariation={true}
                        />
                        <InvestmentSummaryCard
                            title="Lucro/Prejuízo"
                            value={displaySummary?.total_profit || 0}
                            variation={displaySummary?.profit_percentage}
                            icon={(displaySummary?.total_profit || 0) >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            colorScheme={(displaySummary?.total_profit || 0) >= 0 ? 'profit' : 'loss'}
                            delay={0.2}
                            customFormatter={formatCurrency}
                            showVariation={true}
                        />
                    </div>

                    {/* Filters & Actions */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Filtrar meus ativos..."
                                    className="pl-10 bg-slate-50 dark:bg-slate-800 border-none font-medium h-12 rounded-xl text-base"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[160px] h-12 bg-slate-50 dark:bg-slate-800 border-none font-bold rounded-xl">
                                    <Filter className="w-4 h-4 mr-2 text-slate-500" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Tipos</SelectItem>
                                    <SelectItem value="stock">Ações</SelectItem>
                                    <SelectItem value="reit">FIIs</SelectItem>
                                    <SelectItem value="crypto">Cripto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <AddAssetDialog onAssetAdded={fetchData} />
                        </div>
                    </div>

                    {/* Assets List */}
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-slate-500 font-medium">Nenhum ativo encontrado com estes filtros.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            {/* Header */}
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ativo</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Qtd / P. Médio</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Retorno</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Posição</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-8"></p>
                            </div>

                            {/* Rows */}
                            {filteredAssets.map((asset, idx) => {
                                const isProfit = (asset.display_profit || 0) >= 0

                                return (
                                    <motion.div
                                        key={asset.id}
                                        layout
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className={`grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group
                                            ${idx < filteredAssets.length - 1 ? 'border-b border-slate-50 dark:border-slate-800/80' : ''}`}
                                    >
                                        {/* Logo + Nome */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <AssetLogo
                                                symbol={asset.symbol}
                                                name={asset.name}
                                                assetType={asset.asset_type}
                                                market={asset.market}
                                                size="md"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white leading-none">{asset.symbol}</p>
                                                <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5" title={asset.name}>{asset.name}</p>
                                            </div>
                                        </div>

                                        {/* Qtd / Preço Médio */}
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none">{asset.quantity}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{formatCurrency(asset.display_average_price)}</p>
                                        </div>

                                        {/* Retorno % */}
                                        <div className="text-right">
                                            <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-lg
                                                ${isProfit
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                    : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                                                {isProfit ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                                {asset.display_profit_pct?.toFixed(1)}%
                                            </span>
                                        </div>

                                        {/* Posição Atual */}
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {formatCurrency(asset.display_total_value || 0)}
                                            </p>
                                            {asset.dividend_yield != null && asset.dividend_yield > 0 && (
                                                <p className="text-[11px] text-blue-500 font-medium mt-0.5">DY {asset.dividend_yield.toFixed(1)}%</p>
                                            )}
                                        </div>

                                        {/* Menu */}
                                        <div className="w-8 flex justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"
                                                        className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-700">
                                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52 p-2 rounded-xl">
                                                    <DropdownMenuItem className="rounded-lg font-medium cursor-pointer" onClick={() => { setSelectedAsset(asset); setIsAddTransactionOpen(true) }}>
                                                        <Plus className="h-4 w-4 mr-2 text-blue-500" /> Nova Transação
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="rounded-lg font-medium cursor-pointer" onClick={() => { setSelectedAsset(asset); setIsHistoryOpen(true) }}>
                                                        <History className="h-4 w-4 mr-2 text-slate-500" /> Histórico
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="rounded-lg font-medium cursor-pointer" onClick={() => { setSelectedAsset(asset); setIsEditAssetOpen(true) }}>
                                                        <Pencil className="h-4 w-4 mr-2 text-slate-500" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="rounded-lg font-medium cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/20"
                                                        onClick={() => { setSelectedAsset(asset); setIsDeleteAssetOpen(true) }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir Ativo
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="watchlist" className="space-y-6 focus-visible:outline-none">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
                        <div className="flex flex-col md:flex-row gap-10">
                            {/* Search Section */}
                            <div className="w-full md:w-1/3 space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                            <Search className="h-5 w-5" />
                                        </div>
                                        Adicionar Ativo
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Busque ações, fundos ou criptos para acompanhar a cotação em tempo real.
                                    </p>
                                </div>

                                <div className="relative z-20">
                                    <Input
                                        placeholder="Digite o ticker (ex: AAPL)..."
                                        className="h-14 pl-12 text-lg bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-xl transition-all shadow-sm"
                                        value={assetSearchQuery}
                                        onChange={(e) => handleAssetSearch(e.target.value)}
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />

                                    {/* Search Results Dropdown */}
                                    {isSearchingAsset && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800 p-4 z-50">
                                            <div className="flex items-center justify-center p-4 text-slate-500 text-sm font-medium">
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mr-3"></div>
                                                Buscando no mercado...
                                            </div>
                                        </div>
                                    )}

                                    {!isSearchingAsset && assetSearchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800 p-2 z-50 max-h-[350px] overflow-y-auto custom-scrollbar">
                                            {assetSearchResults.map((result) => (
                                                <div
                                                    key={result.symbol}
                                                    onClick={() => addToWatchlist(result)}
                                                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                            {result.symbol.substring(0, 2)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white">{result.symbol}</p>
                                                            <p className="text-xs text-slate-500 font-medium">{result.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{result.value}</p>
                                                        <Badge variant={result.change >= 0 ? 'default' : 'destructive'} className="text-[10px] px-1.5 h-5 ml-auto">
                                                            {result.change >= 0 ? '+' : ''}{result.change?.toFixed(2)}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Asset History Chart Area */}
                                <div className="h-[320px] w-full">
                                    {selectedWatchlistAsset ? (
                                        (() => {
                                            // Find the up-to-date asset in displayWatchlist to get the live converted price
                                            const liveAsset = displayWatchlist.find(a => a.symbol === selectedWatchlistAsset.symbol) || selectedWatchlistAsset
                                            return (
                                                <AssetHistoryChart
                                                    symbol={liveAsset.symbol}
                                                    name={liveAsset.name}
                                                    type={liveAsset.asset_type || liveAsset.type}
                                                    market={liveAsset.market}
                                                    currentPrice={liveAsset.display_price}
                                                    sourceCurrency={portfolioCurrency}
                                                    targetCurrency={portfolioCurrency}
                                                    rates={rates}
                                                />
                                            )
                                        })()
                                    ) : (
                                        <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                                                <TrendingUp className="h-8 w-8" />
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white mb-1">Histórico de Preços</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px]">
                                                Clique em um ativo da sua Watchlist para ver o gráfico de 3 meses aqui.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="hidden md:block w-[1px] bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

                            {/* Watchlist Grid */}
                            <div className="flex-[2] space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        Minha Watchlist
                                    </h3>
                                    <Badge variant="outline" className="font-bold">{displayWatchlist.length} ativos</Badge>
                                </div>

                                {displayWatchlist.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                                            <Search className="h-8 w-8" />
                                        </div>
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Sua watchlist está vazia</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                            Use o campo de busca ao lado para encontrar ativos e acompanhar suas cotações aqui.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {displayWatchlist.map((item) => (
                                            <div
                                                key={item.symbol}
                                                onClick={() => setSelectedWatchlistAsset(item)}
                                                className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-pointer
                                                ${selectedWatchlistAsset?.symbol === item.symbol
                                                        ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-500'
                                                        : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800'}`}
                                            >
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-50 to-transparent dark:from-slate-800/50 rounded-bl-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="flex items-center gap-3 relative z-10">
                                                    <AssetLogo
                                                        symbol={item.symbol}
                                                        name={item.name}
                                                        assetType={item.type || item.asset_type || 'stock'}
                                                        market={item.market || 'BR'}
                                                        size="lg"
                                                    />
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-white">{item.symbol}</h4>
                                                        <p className="text-xs font-medium text-slate-400 truncate max-w-[100px]">{item.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-slate-900 dark:text-white">
                                                            {formatCurrency(item.display_price)}
                                                        </p>
                                                        <div className={`flex items-center justify-end text-xs font-bold ${item.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {item.change >= 0 ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                                                            {item.change?.toFixed(2)}%
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation() // Prevent selecting when clicking remove
                                                            removeFromWatchlist(item.symbol)
                                                        }}
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                                        title="Remover da watchlist"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            {
                selectedAsset && (
                    <>
                        <AddTransactionDialog
                            open={isAddTransactionOpen}
                            onOpenChange={setIsAddTransactionOpen}
                            assetId={selectedAsset.id}
                            assetSymbol={selectedAsset.symbol}
                            onTransactionAdded={fetchData}
                        />
                        <EditAssetDialog
                            open={isEditAssetOpen}
                            onOpenChange={setIsEditAssetOpen}
                            asset={selectedAsset}
                            onAssetUpdated={fetchData}
                        />
                        <DeleteAssetDialog
                            open={isDeleteAssetOpen}
                            onOpenChange={setIsDeleteAssetOpen}
                            assetId={selectedAsset.id}
                            assetSymbol={selectedAsset.symbol}
                            onAssetDeleted={() => {
                                fetchData();
                                setSelectedAsset(null);
                            }}
                        />
                        <AssetTransactionsModal
                            open={isHistoryOpen}
                            onOpenChange={setIsHistoryOpen}
                            assetId={selectedAsset.id}
                            assetSymbol={selectedAsset.symbol}
                            onTransactionDeleted={fetchData}
                        />
                    </>
                )
            }
        </div >
    )
}
