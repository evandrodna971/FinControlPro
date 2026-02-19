import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import { RankItem, parseAssetValue } from '@/data/market-ranks'
import { marketService } from '@/services/marketService'
import { ArrowUp, ArrowDown, ExternalLink, Loader2 } from 'lucide-react'

interface AssetDetailsModalProps {
    asset: RankItem | null
    isOpen: boolean
    onClose: () => void
    currency: 'BRL' | 'USD' | 'EUR'
    rates: { USDBRL: number, EURBRL: number }
}

export function AssetDetailsModal({ asset, isOpen, onClose, currency, rates }: AssetDetailsModalProps) {
    // Fixed timeframe to 3M as requested
    const timeframe = '3M'
    const [historyData, setHistoryData] = useState<{ date: string, value: number }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentPrice, setCurrentPrice] = useState<number | null>(null)

    // Helper to convert value based on asset source and target currency
    const convert = (val: number, source: 'BRL' | 'USD') => {
        if (currency === source) return val

        // BRL -> USD: val / rate
        // BRL -> EUR: val / rateEUR
        // USD -> BRL: val * rate
        // USD -> EUR: val * rateUSD / rateEUR (approx)

        let valInBrl = source === 'BRL' ? val : val * rates.USDBRL

        if (currency === 'BRL') return valInBrl
        if (currency === 'USD') return valInBrl / rates.USDBRL
        if (currency === 'EUR') return valInBrl / rates.EURBRL
        return val
    }

    useEffect(() => {
        if (!asset || !isOpen) return

        // Reset state on open/asset change
        setHistoryData([])

        // Initial price from asset prop (already converted in parent? OR raw?)
        // The asset prop comes from parent's stats. 
        // IF parent passed 'displayStats', then asset.price is ALREADY converted?
        // Wait, MarketOverview passes `selectedAsset` which is set from `handleAssetClick`.
        // `handleAssetClick` receives item from `RankCard`. 
        // `RankCard` receives data from `displayStats` (converted) OR `stats` (raw)?
        // In MarketOverview, we passed `displayStats` to RankCards. 
        // So `asset` here HAS converted values in `value` string, but `price` might be original or converted?
        // In `processList` inside MarketOverview, we updated `value` string but we did NOT update `price` number.
        // So `asset.price` is likely still the RAW original price.
        // AND `asset.currency` tells us the source.
        // So we should convert `asset.price` here.

        // However, if we want consistency, we should trust `asset.currency` as source.

        const sourceCurrency = asset.currency || 'BRL'
        if (asset.price) {
            setCurrentPrice(convert(asset.price, sourceCurrency))
        } else {
            setCurrentPrice(parseAssetValue(asset.value) || null) // Fallback
        }

        const fetchHistory = async () => {
            setIsLoading(true)
            try {
                // Determine type based on asset.type if available, or infer
                // RankItem interface doesn't have type, so we guess.

                let type: 'stock' | 'crypto' | 'fii' = 'stock'

                // Heuristics:
                // Crypto: Usually symbol has no numbers and is short (BTC) or explicit match in list
                // FII: Ends in 11 (mostly)
                // Stock: Ends in 3, 4, 11 (unit), etc.

                const symbol = asset.symbol.toUpperCase()

                // Known crypto symbols check (simple list)
                const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX']

                if (cryptoSymbols.includes(symbol) || (symbol.length <= 4 && !/\d/.test(symbol))) {
                    type = 'crypto'
                } else if (symbol.endsWith('11')) {
                    // Could be Unit or FII. Brapi handles both as same endpoint mostly so 'stock' works, 
                    // but let's be explicit if needed. For now 'stock' covers FIIs in Brapi usually.
                    // But we can check if it's in our FII list.
                    const fiiSymbols = ['HGLG11', 'KNRI11', 'MXRF11', 'XPLG11', 'BCFF11', 'VISC11', 'HGRU11', 'BRCR11']
                    if (fiiSymbols.includes(symbol)) {
                        type = 'fii'
                    }
                }

                console.log(`Fetching history for ${symbol} as ${type} (${timeframe})`)

                // Cast timeframe to any to avoid type error since 3M is custom here
                const data = await marketService.getAssetHistory(symbol, type, timeframe as any, asset.market)

                if (!data || data.length === 0) {
                    console.warn(`No history data returned for ${symbol}`)
                } else {
                    // Update current price with the LATEST data point from history for accuracy
                    const lastPoint = data[data.length - 1]
                    if (lastPoint && lastPoint.value) {
                        // History data value is in Source Currency (BRL for stocks, USD for Crypto)
                        // We need to convert it.
                        // But wait, getAssetHistory for Crypto returns USD. For Stocks returns BRL.
                        // So we use 'type' to know source currency of history? 
                        // Yes. Crypto -> USD. Stock/FII -> BRL.
                        const histSource = type === 'crypto' ? 'USD' : 'BRL'
                        setCurrentPrice(convert(lastPoint.value, histSource))
                    }
                }

                // Convert all history points
                const histSource = type === 'crypto' ? 'USD' : 'BRL'
                // Ensure data is array
                const safeData = Array.isArray(data) ? data : []
                const convertedData = safeData.map(p => ({
                    ...p,
                    value: convert(p.value, histSource)
                }))

                setHistoryData(convertedData)
            } catch (error) {
                console.error("Failed to fetch history:", error)
                setHistoryData([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchHistory()
    }, [asset, isOpen, currency, rates])

    if (!asset) return null

    // Calculate change for the current timeframe based on REAL data if available
    const startPrice = historyData[0]?.value || 0
    const endPrice = historyData[historyData.length - 1]?.value || 0

    // If we have history, use it for change. Else fallback to asset's daily change prop or 0
    // Note: asset.value is "formatted string", parse it for display consistency if needed
    // But history is accurate.

    // Fallback logic: if history is empty (API fail), show 0 change or static
    let changeValue = historyData.length > 0 ? (endPrice - startPrice) : 0
    let changePercent = startPrice > 0 ? (changeValue / startPrice) * 100 : 0

    // For 1D view, TRUST the daily change from the asset list (API quote) over the calculated history slice
    // because history might be missing the exact open/close of the day or be delayed.
    // 3M VIEW: Always use calculated change from history

    // Format display price
    const locale = currency === 'BRL' ? 'pt-BR' : 'en-US'
    const symbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€'

    // Check if it is a very small number (crypto decimals)
    const digits = currentPrice && currentPrice < 1 ? 4 : 2

    const displayPrice = currentPrice
        ? `${symbol} ${currentPrice.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
        : asset.value // Fallback

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] bg-[#0A0B0E] border-slate-800 text-slate-200 p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-gradient-to-r from-slate-900 to-slate-900/50 border-b border-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                {asset.symbol}
                                <span className="text-sm font-normal text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700">
                                    #{asset.rank}
                                </span>
                            </DialogTitle>
                            <div className="text-slate-400 text-sm mt-1">{asset.name}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">
                                {displayPrice}
                            </div>
                            <div className={`flex items-center justify-end text-sm font-medium ${changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {changePercent >= 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                                {Math.abs(changePercent).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6">
                    {/* Timeframe Selectors REMOVED */}
                    <div className="flex items-center justify-end gap-2 mb-6">
                        <span className="text-xs font-bold text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                            Últimos 3 Meses
                        </span>
                    </div>

                    {/* Chart */}
                    <div className="h-[300px] w-full flex items-center justify-center">
                        {isLoading ? (
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        ) : historyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#64748b"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={['auto', 'auto']}
                                        tickFormatter={(val) =>
                                            val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(2)
                                        }
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                        labelStyle={{ color: '#94a3b8' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-slate-500 text-sm">Dados históricos indisponíveis</div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 flex justify-end">
                        <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors">
                            Ver detalhes completos
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
