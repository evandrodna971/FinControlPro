import { useState, useEffect } from 'react'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import { marketService } from '@/services/marketService'
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react'


export function AssetHistoryChart({ symbol, name, type = 'stock', market = 'BR', currentPrice, sourceCurrency = 'BRL', targetCurrency = 'BRL', rates }: {
    symbol: string
    name?: string
    type?: string
    market?: string
    currentPrice?: number
    sourceCurrency?: 'BRL' | 'USD' | 'EUR'
    targetCurrency?: 'BRL' | 'USD' | 'EUR'
    rates: { USDBRL: number, EURBRL: number }
}) {
    const [historyData, setHistoryData] = useState<{ date: string, value: number }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [displayPrice, setDisplayPrice] = useState<number | null>(null)

    const convert = (val: number, source: 'BRL' | 'USD' | 'EUR', target: 'BRL' | 'USD' | 'EUR') => {
        if (source === target) return val

        let valInBrl = val
        if (source === 'USD') valInBrl = val * rates.USDBRL
        if (source === 'EUR') valInBrl = val * rates.EURBRL

        if (target === 'BRL') return valInBrl
        if (target === 'USD') return valInBrl / rates.USDBRL
        if (target === 'EUR') return valInBrl / rates.EURBRL

        return val
    }

    useEffect(() => {
        if (!symbol) return

        const fetchHistory = async () => {
            setIsLoading(true)
            try {
                const data = await marketService.getAssetHistory(symbol, type as any, '3M', market)

                let historySourceCurrency: 'BRL' | 'USD' = 'BRL'
                if (market === 'US' || type === 'crypto' || market === 'CRYPTO') {
                    historySourceCurrency = 'USD'
                }

                const convertedData = (data || []).map(item => ({
                    ...item,
                    originalValue: item.value,
                    sourceCurrency: historySourceCurrency
                }))

                setHistoryData(convertedData as any)
            } catch (error) {
                console.error("Failed to fetch history:", error)
                setHistoryData([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchHistory()
    }, [symbol, type, market])

    useEffect(() => {
        if (currentPrice !== undefined) {
            setDisplayPrice(currentPrice)
        } else if (historyData.length > 0) {
            setDisplayPrice(historyData[historyData.length - 1].value)
        }
    }, [currentPrice, historyData])

    const getConvertedValue = (val: number, source: 'BRL' | 'USD' | 'EUR') => {
        return convert(val, source, targetCurrency)
    }

    const finalDisplayPrice = displayPrice !== null ? getConvertedValue(displayPrice, sourceCurrency) : 0

    const chartData = historyData.map(item => ({
        ...item,
        value: convert(item.value, (item as any).sourceCurrency || 'BRL', targetCurrency)
    }))

    const startPrice = chartData[0]?.value || 0
    const endPrice = chartData[chartData.length - 1]?.value || 0
    const changeValue = chartData.length > 0 ? (endPrice - startPrice) : 0
    const changePercent = startPrice > 0 ? (changeValue / startPrice) * 100 : 0

    const locale = targetCurrency === 'BRL' ? 'pt-BR' : 'en-US'
    const currencySymbol = targetCurrency === 'BRL' ? 'R$' : targetCurrency === 'USD' ? '$' : '€'

    const digits = finalDisplayPrice && finalDisplayPrice < 1 ? 4 : 2

    const formattedPrice = finalDisplayPrice
        ? finalDisplayPrice.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
        : '---'

    if (!symbol) return null

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {symbol}
                        </h3>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{name || 'Histórico de Preços'}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                        <span className="text-sm text-slate-400 mr-1 font-bold">{currencySymbol}</span>
                        {formattedPrice}
                    </p>
                    <div className={`flex items-center justify-end text-sm font-bold ${changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {changePercent >= 0 ? <ArrowUp className="w-4 h-4 mr-0.5" /> : <ArrowDown className="w-4 h-4 mr-0.5" />}
                        {Math.abs(changePercent).toFixed(2)}%
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`colorValue-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                domain={['auto', 'auto']}
                                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(1)}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderColor: '#e2e8f0',
                                    borderRadius: '12px',
                                    padding: '8px 12px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#colorValue-${symbol})`}
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm font-medium bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        Selecione um ativo para visualizar o gráfico
                    </div>
                )}
            </div>
        </div>
    )
}
