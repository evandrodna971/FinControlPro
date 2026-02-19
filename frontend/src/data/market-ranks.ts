export interface RankItem {
    rank: number
    symbol: string
    name: string
    value: string // Formatted value (e.g., "46,65%" or "51,3B")
    change?: number // Percentage change
    price?: number // Actual price value for synchronization
    currency?: 'BRL' | 'USD'
    highlight?: boolean // For green badges/accents
    market?: string
    type?: string
}

export const dividendYield: RankItem[] = [
    { rank: 1, symbol: 'SCAR3', name: 'São Carlos', value: '46,65%', highlight: true },
    { rank: 2, symbol: 'GRND3', name: 'Grendene', value: '34,76%', highlight: true },
    { rank: 3, symbol: 'HBR3', name: 'HBR Realty', value: '33,39%', highlight: true },
    { rank: 4, symbol: 'MELK3', name: 'Melnick', value: '32,37%', highlight: true },
    { rank: 5, symbol: 'RENT3', name: 'Localiza', value: '31,25%', highlight: true },
    { rank: 6, symbol: 'MTRE3', name: 'Mitre', value: '28,15%', highlight: true },
    { rank: 7, symbol: 'LEVE3', name: 'Mahle Metal Leve', value: '24,50%', highlight: true },
    { rank: 8, symbol: 'CMIN3', name: 'CSN Mineração', value: '22,10%', highlight: true },
    { rank: 9, symbol: 'PETR4', name: 'Petrobras', value: '21,80%', highlight: true },
    { rank: 10, symbol: 'BBAS3', name: 'Banco do Brasil', value: '19,50%', highlight: true },
]

export const marketCap: RankItem[] = [
    { rank: 1, symbol: 'ITUB4', name: 'Itaú Unibanco', value: '51,35B' },
    { rank: 2, symbol: 'PETR4', name: 'Petrobras', value: '49,97B' },
    { rank: 3, symbol: 'VALE3', name: 'Vale', value: '40,48B' },
    { rank: 4, symbol: 'BPAC11', name: 'BTG Pactual', value: '35,58B' },
    { rank: 5, symbol: 'ABEV3', name: 'Ambev', value: '26,26B' },
    { rank: 6, symbol: 'WEGE3', name: 'WEG', value: '24,15B' },
    { rank: 7, symbol: 'BBAS3', name: 'Banco do Brasil', value: '22,80B' },
    { rank: 8, symbol: 'BBDC4', name: 'Bradesco', value: '20,50B' },
    { rank: 9, symbol: 'ELET3', name: 'Eletrobras', value: '18,20B' },
    { rank: 10, symbol: 'SUZB3', name: 'Suzano', value: '15,90B' },
]

export const revenue: RankItem[] = [
    { rank: 1, symbol: 'PETR4', name: 'Petrobras', value: '491,45B' },
    { rank: 2, symbol: 'ITUB4', name: 'Itaú Unibanco', value: '387,12B' },
    { rank: 3, symbol: 'BBAS3', name: 'Banco do Brasil', value: '319,46B' },
    { rank: 4, symbol: 'BBDC3', name: 'Bradesco', value: '270,18B' },
    { rank: 5, symbol: 'RAIZ4', name: 'Raízen', value: '238,73B' },
    { rank: 6, symbol: 'VALE3', name: 'Vale', value: '220,10B' },
    { rank: 7, symbol: 'JBSS3', name: 'JBS', value: '190,50B' },
    { rank: 8, symbol: 'VIBRA', name: 'Vibra Energia', value: '160,20B' },
    { rank: 9, symbol: 'UGPA3', name: 'Ultrapar', value: '140,80B' },
    { rank: 10, symbol: 'MGLU3', name: 'Magalu', value: '120,00B' },
]

export const topGainers: RankItem[] = [
    { rank: 1, symbol: 'PETR4', name: 'Petrobras', value: '+5.2%', highlight: true },
    { rank: 2, symbol: 'VALE3', name: 'Vale', value: '+4.1%', highlight: true },
    { rank: 3, symbol: 'PRIO3', name: 'Prio', value: '+3.8%', highlight: true },
    { rank: 4, symbol: 'BBAS3', name: 'Banco do Brasil', value: '+3.2%', highlight: true },
    { rank: 5, symbol: 'ITUB4', name: 'Itaú Unibanco', value: '+2.9%', highlight: true },
]

export const crypto: RankItem[] = [
    { rank: 1, symbol: 'BTC', name: 'Bitcoin', value: '$62.450', change: 5.2 },
    { rank: 2, symbol: 'ETH', name: 'Ethereum', value: '$3.420', change: 3.8 },
    { rank: 3, symbol: 'BNB', name: 'BNB Chain', value: '$412', change: 2.1 },
    { rank: 4, symbol: 'SOL', name: 'Solana', value: '$128', change: 8.5 },
    { rank: 5, symbol: 'XRP', name: 'Ripple', value: '$0.62', change: -1.2 },
]

export const fiis: RankItem[] = [
    { rank: 1, symbol: 'HGLG11', name: 'CSHG Logística', value: '12,5%' },
    { rank: 2, symbol: 'KNRI11', name: 'Kinea Renda', value: '11,8%' },
    { rank: 3, symbol: 'XPLG11', name: 'XP Log', value: '11,2%' },
    { rank: 4, symbol: 'MXRF11', name: 'Maxi Renda', value: '10,9%' },
    { rank: 5, symbol: 'BCFF11', name: 'BTG Fundo de Fundos', value: '10,5%' },
    { rank: 6, symbol: 'VISC11', name: 'Vinci Shoppings', value: '9,8%' },
    { rank: 7, symbol: 'HGRU11', name: 'CSHG Renda Urbana', value: '9,5%' },
    { rank: 8, symbol: 'BRCR11', name: 'BC Coporate', value: '9,2%' },
]

// Mock data generator for charts
export interface ChartDataPoint {
    date: string
    value: number
}

// Helper to extract clean number from formatted value string
export const parseAssetValue = (valueStr: string): number => {
    if (!valueStr) return 0
    // Remove "R$ ", "$ ", "%", "B", "M" and trim
    let clean = valueStr.replace(/[R$\s%BM]/g, '').trim()

    // Handle brazillian comma decimal if present (e.g. "20,50")
    // If there is a comma, replace it with dot
    if (clean.includes(',')) {
        clean = clean.replace(/\./g, '').replace(',', '.')
    }

    return parseFloat(clean) || 0
}

// @deprecated - Use marketService.getAssetHistory() for real data
export const getHistoricalData = (symbol: string, timeframe: '1D' | '1M' | '1Y', baseValue?: number): ChartDataPoint[] => {
    const now = new Date()
    let points = 0
    let interval = 0 // minutes
    let volatility = 0.02

    // Use provided baseValue or random if not provided (fallback)
    // If baseValue is 0 (e.g. failed parse), fallback to random 10-110
    const currentPrice = (baseValue && baseValue > 0) ? baseValue : (Math.random() * 100 + 10)

    if (timeframe === '1D') {
        points = 24 // Hourly
        interval = 60
        volatility = 0.005
    } else if (timeframe === '1M') {
        points = 30 // Daily
        interval = 24 * 60
        volatility = 0.02 // Higher daily volatility
    } else {
        points = 12 // Monthly
        interval = 30 * 24 * 60
        volatility = 0.05 // Monthly volatility
    }

    // Generate backwards from current price
    // We add the last point (current time) first, then iterate backwards
    // However, to supply array in chronological order (Oldest -> Newest),
    // we can generate them into a temporary array and then reverse,
    // OR generate them by simulating backwards walk from current price.

    // Let's generate backwards:
    // P(t) = P(t-1) * (1 + change)
    // So P(t-1) = P(t) / (1 + change) ~ P(t) * (1 - change) for small change

    let priceCursor = currentPrice
    const rawPoints: { date: Date, value: number }[] = []

    // Push current point (Newest)
    rawPoints.push({ date: now, value: Number(priceCursor.toFixed(2)) })

    for (let i = 1; i <= points; i++) {
        const date = new Date(now.getTime() - i * interval * 60 * 1000)

        // Random percent change for previous step
        const percentChange = (Math.random() - 0.5) * volatility

        // Calculate previous price
        // If current = prev * (1 + pct), then prev = current / (1 + pct)
        priceCursor = priceCursor / (1 + percentChange)

        rawPoints.push({
            date: date,
            value: Number(priceCursor.toFixed(2))
        })
    }

    // Reverse to get Oldest -> Newest
    const sortedPoints = rawPoints.reverse()

    return sortedPoints.map(p => {
        let dateStr = ''
        if (timeframe === '1D') {
            dateStr = p.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        } else if (timeframe === '1M') {
            dateStr = p.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        } else {
            dateStr = p.date.toLocaleDateString('pt-BR', { month: 'short' })
        }
        return {
            date: dateStr,
            value: p.value
        }
    })
}
