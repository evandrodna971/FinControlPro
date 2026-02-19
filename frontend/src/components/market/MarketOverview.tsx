import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Building2, Coins, RefreshCw, TrendingDown } from 'lucide-react'
import { RankCard } from '@/components/market/RankCard'
import { AssetDetailsModal } from '@/components/market/AssetDetailsModal'
import { marketService } from '@/services/marketService'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { dividendYield as mockYield, marketCap as mockCap, revenue as mockRev, crypto as mockCrypto, fiis as mockFiis, topGainers as mockGainers, RankItem } from '@/data/market-ranks'

type Currency = 'BRL' | 'USD' | 'EUR'

export function MarketOverview() {
    // Data State
    const [stats, setStats] = useState({
        dividendYield: mockYield,
        marketCap: mockCap,
        revenue: mockRev,
        topGainers: mockGainers,
        fiis: mockFiis,
        crypto: mockCrypto
    })

    const [currency, setCurrency] = useState<Currency>('BRL')
    const [rates, setRates] = useState({ USDBRL: 5.0, EURBRL: 5.5 })


    const [isLoading, setIsLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    const [selectedAsset, setSelectedAsset] = useState<RankItem | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [stocksData, cryptoData, ratesData] = await Promise.all([
                marketService.getStocksAndFIIs(),
                marketService.getCrypto(),
                marketService.getExchangeRates()
            ])

            setStats({
                ...stocksData,
                crypto: cryptoData
            })
            setRates(ratesData)
            setLastUpdate(new Date())

            // --- CHECK ALERTS ---
            try {
                // 1. Get active alerts
                const alertsRes = await api.get('/investments/alerts')
                const alerts = alertsRes.data.filter((a: any) => a.is_active)

                if (alerts.length > 0) {
                    // 2. Get unique symbols to fetch current prices
                    const symbolsToFetch = Array.from(new Set(alerts.map((a: any) => a.symbol))).filter(Boolean) as string[]

                    if (symbolsToFetch.length > 0) {
                        // 3. Fetch current prices
                        const quotes = await marketService.getQuotes(symbolsToFetch)
                        const quoteMap = new Map(quotes.map(q => [q.symbol, q.price]))

                        // 4. Check conditions
                        for (const alert of alerts) {
                            const currentPrice = quoteMap.get(alert.symbol)
                            if (currentPrice !== undefined) {
                                let triggered = false
                                if (alert.condition === 'above' && currentPrice > (alert.target_value ?? 0)) triggered = true
                                if (alert.condition === 'below' && currentPrice < (alert.target_value ?? 0)) triggered = true

                                if (triggered) {
                                    // 5. Notify and Update
                                    toast.error(`Alerta Disparado: ${alert.symbol}`, {
                                        description: `Preço atingiu R$ ${currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${alert.condition === 'above' ? 'Acima de' : 'Abaixo de'} R$ ${alert.target_value})`,
                                        duration: 8000
                                    } as any) // Type assertion to bypass signature if needed, sonner toast is (message, options)

                                    // Mark as triggered in backend
                                    await api.patch(`/investments/alerts/${alert.id}`, {
                                        is_active: false,
                                        triggered_at: new Date().toISOString()
                                    })
                                }
                            }
                        }
                    }
                }
            } catch (alertError) {
                console.error("Error checking alerts:", alertError)
            }

        } catch (error) {
            console.error("Failed to load market data", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        // Refresh every 5 minutes (300s) to respect API limits
        const interval = setInterval(fetchData, 300000)
        return () => clearInterval(interval)
    }, [])

    const displayStats = useMemo(() => {
        const convert = (value: number, source: 'BRL' | 'USD') => {
            if (currency === source) return value

            // BRL -> USD: val / rate
            // BRL -> EUR: val / rateEUR
            // USD -> BRL: val * rate
            // USD -> EUR: val * rateUSD / rateEUR (approx)

            let valInBrl = source === 'BRL' ? value : value * rates.USDBRL

            if (currency === 'BRL') return valInBrl
            if (currency === 'USD') return valInBrl / rates.USDBRL
            if (currency === 'EUR') return valInBrl / rates.EURBRL
            return value
        }

        const format = (val: number) => {
            const locale = currency === 'BRL' ? 'pt-BR' : 'en-US'
            const symbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€'

            // For large numbers (Market Cap/Revenue)
            if (val > 1000000) {
                if (val > 1000000000) return `${symbol} ${(val / 1000000000).toLocaleString(locale, { maximumFractionDigits: 2 })}B`
                return `${symbol} ${(val / 1000000).toLocaleString(locale, { maximumFractionDigits: 2 })}M`
            }

            return `${symbol} ${val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }

        const processList = (list: RankItem[]) => {
            return list.map(item => {
                const sourceCurrency = item.currency || 'BRL' // Default to BRL for now if missing

                // If item has no price (e.g. Percentage only), we keep value as is usually, 
                // but if it's Value/Revenue/MarketCap card, we need to convert.
                // We use 'price' field for conversion if available. 
                // Market Cap is usually in 'value' string, we might need to parse or use raw number if available. 
                // Currently 'value' is pre-formatted string. 
                // For optimal conversion, we should have raw values. 
                // Hack: Parse number from string if price is missing? 
                // Better: 'price' field covers Price cards. 
                // Market Cap card uses 'value'. We need raw market cap.
                // Re-parsing is fragile. 
                // Let's rely on 'price' where possible. 

                // For Market Cap / Revenue, we don't have raw number easily available in RankItem unless we add it. 
                // Let's try to parse 'value' if it contains B/M.

                let displayValue = item.value

                // If it's a Price (starts with R$ or $)
                if (item.value.includes('R$') || item.value.includes('$') || item.value.includes('€')) {
                    // Use item.price if available for accuracy
                    if (item.price) {
                        const converted = convert(item.price, sourceCurrency)
                        displayValue = format(converted)
                    }
                }
                // If it's Market Cap (ends with B or M)
                else if (item.value.includes('B') || item.value.includes('M')) {
                    // We assume Market Cap items are already formatted strings.
                    // If we wanted to convert them, we'd need raw values or parsing.
                    // For now, we skip conversion for Market Cap unless 'price' is available.
                }

                return {
                    ...item,
                    value: displayValue
                }
            })
        }

        return {
            dividendYield: stats.dividendYield, // Percentages don't change
            marketCap: processList(stats.marketCap), // Might need better handling later
            revenue: processList(stats.revenue),
            topGainers: processList(stats.topGainers),
            fiis: processList(stats.fiis),
            crypto: processList(stats.crypto)
        }
    }, [stats, currency, rates])

    const handleAssetClick = (asset: RankItem) => {
        setSelectedAsset(asset)
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        Market Rank Pro
                    </h2>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span>Rankings em tempo real</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {import.meta.env.VITE_BRAPI_TOKEN ? 'Live Data 🟢' : 'Demo Mode 🟡'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Currency Selector */}
                    <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
                        {(['BRL', 'USD', 'EUR'] as Currency[]).map((cur) => (
                            <button
                                key={cur}
                                onClick={() => setCurrency(cur)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${currency === cur
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                {cur}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                        title="Atualizar dados"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="text-xs text-right hidden sm:block">
                        <div className="text-slate-500">Última atualização</div>
                        <div className="text-slate-300 font-mono">{lastUpdate.toLocaleTimeString()}</div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Single Row: Market Cap, FIIs, Crypto */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <RankCard
                            title="Menor P/L (Preço/Lucro)"
                            icon={TrendingDown}
                            data={displayStats.topGainers.slice(0, 5)}
                            type="value"
                            className="bg-emerald-950/10 border-emerald-900/30"
                            onItemClick={handleAssetClick}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <RankCard
                            title="Top FIIs Brasileiros"
                            icon={Building2}
                            data={displayStats.fiis.slice(0, 5)}
                            type="yield"
                            className="bg-blue-950/10 border-blue-900/30"
                            onItemClick={handleAssetClick}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <RankCard
                            title="Top Criptomoedas"
                            icon={Coins}
                            data={displayStats.crypto.slice(0, 5)}
                            type="crypto"
                            className="bg-indigo-950/10 border-indigo-900/30"
                            onItemClick={handleAssetClick}
                        />
                    </motion.div>
                </div>
            </div>

            <AssetDetailsModal
                asset={selectedAsset}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currency={currency}
                rates={rates}
            />
        </div >
    )
}
