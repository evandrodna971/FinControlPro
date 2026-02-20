import { RankItem, dividendYield, marketCap, revenue, topGainers, crypto, fiis } from '@/data/market-ranks'

// Mock data as fallback
const MOCK_DATA = {
    dividendYield,
    marketCap,
    revenue,
    topGainers,
    crypto,
    fiis
}

const BRAPI_TOKEN = import.meta.env.VITE_BRAPI_TOKEN || 'vaojuu2uNboDzmhHXP6Sjg'

// PROXY CONFIGURATION
// We use the backend proxy to avoid CORS and Rate Limits in the browser.
// The backend will forward the request to Brapi with the token securely.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BASE_URL_BRAPI = `${API_URL}/api/proxy/brapi`
// NOTE: VITE_API_URL should be set in .env or Render environment variables.

function formatMarketCap(val: number | undefined): string {
    if (!val) return 'N/A'
    if (val > 1000000000) return `${(val / 1000000000).toFixed(2)}B`
    if (val > 1000000) return `${(val / 1000000).toFixed(2)}M`
    return val.toString()
}

export const marketService = {
    async getExchangeRates() {
        try {
            const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL')
            if (!response.ok) throw new Error('Failed to fetch rates')
            const data = await response.json()
            return {
                USDBRL: parseFloat(data.USDBRL.bid),
                EURBRL: parseFloat(data.EURBRL.bid)
            }
        } catch (error) {
            console.error('Error fetching exchange rates:', error)
            return { USDBRL: 5.0, EURBRL: 5.5 } // Fallback
        }
    },

    async getStocksAndFIIs(): Promise<typeof MOCK_DATA> {
        if (!BRAPI_TOKEN) {
            console.warn('BRAPI_TOKEN not found. Using mock data.')
            return MOCK_DATA
        }

        try {
            const token = BRAPI_TOKEN
            const limit = 6 // Fetch slightly more to ensure we have enough valid data

            // Use the proxy base URL
            const baseUrl = `${BASE_URL_BRAPI}/quote/list?limit=${limit}&token=${token}`

            // 1. Fetch Only Needed Lists (Lowest P/E and FIIs)
            // Replaced Top Gainers with Lowest P/E (P/L) as requested.
            // Sort by price_earnings ASCENDING to get lowest. 
            // We fetch a larger limit (20) to filter out negative/zero P/E in client side if API returns them.
            const [peRes, fiisRes] = await Promise.all([
                fetch(`${baseUrl}&sortBy=price_earnings&sortOrder=asc&type=stock&limit=20`), // Lowest P/E
                fetch(`${baseUrl}&sortBy=change&sortOrder=desc&type=fund&limit=6`)           // FIIs
            ])

            const [peData, fiisData] = await Promise.all([
                peRes.json(),
                fiisRes.json()
            ])

            // Helper to map list items to RankItem
            const mapItem = (item: any, index: number, type: 'price' | 'value' | 'percent' | 'pe', specificValue?: number, specificCurrency?: 'BRL' | 'USD'): RankItem => {
                let valueStr = ''
                if (type === 'price') valueStr = `R$ ${(item.close || item.regularMarketPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

                if (type === 'value') {
                    valueStr = formatMarketCap(specificValue !== undefined ? specificValue : 0)
                }

                if (type === 'percent') {
                    valueStr = `${(item.change || 0).toFixed(2)}%`
                }

                if (type === 'pe') {
                    // P/L value
                    valueStr = `${(item.priceEarnings || 0).toFixed(1)}x`
                }

                return {
                    rank: index + 1,
                    symbol: item.stock || item.symbol,
                    name: item.name || item.shortName || item.stock,
                    value: valueStr,
                    price: item.close || item.regularMarketPrice,
                    change: item.change || item.regularMarketChangePercent,
                    currency: specificCurrency || 'BRL',
                    highlight: false,
                    type: 'stock' // Default to stock for now, can be adjusted if needed
                }
            }

            // 2. Process Lists

            // Filter P/E > 0 and take top 5
            const bestPeList: RankItem[] = (peData.stocks || [])
                .filter((s: any) => s.priceEarnings > 0.5)
                .slice(0, 5)
                .map((q: any, i: number) => mapItem(q, i, 'pe'))

            const fiisList: RankItem[] = (fiisData.stocks || []).slice(0, 5).map((q: any, i: number) => mapItem(q, i, 'price'))

            return {
                topGainers: bestPeList.length > 0 ? bestPeList : MOCK_DATA.topGainers,
                marketCap: MOCK_DATA.marketCap,
                revenue: MOCK_DATA.revenue,
                dividendYield: MOCK_DATA.dividendYield,
                fiis: fiisList.length > 0 ? fiisList : MOCK_DATA.fiis,
                crypto: MOCK_DATA.crypto
            }

        } catch (error) {
            console.error('Error fetching Brapi data:', error)
            return MOCK_DATA
        }
    },

    async getCrypto(): Promise<RankItem[]> {
        console.log('Fetching Crypto data (CoinGecko)...')
        try {
            // Using CoinGecko Simple Price API (Free, no key needed for basic usage, very reliable)
            // IDs: bitcoin, ethereum, binancecoin, solana, ripple
            const ids = 'bitcoin,ethereum,binancecoin,solana,ripple'
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,brl&include_24hr_change=true`)

            if (!response.ok) {
                throw new Error(`CoinGecko API Error: ${response.statusText}`)
            }

            const data = await response.json()
            // Data format: { bitcoin: { usd: 64000, brl: 320000, usd_24h_change: 2.5 } }

            const cryptoList = [
                { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
                { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
                { id: 'binancecoin', symbol: 'BNB', name: 'BNB Chain' },
                { id: 'solana', symbol: 'SOL', name: 'Solana' },
                { id: 'ripple', symbol: 'XRP', name: 'Ripple' }
            ]

            const newCrypto = cryptoList.map((coin, index) => {
                const coinData = data[coin.id] || {}
                const priceUsd = coinData.usd || 0
                const priceBrl = coinData.brl || 0
                const change = coinData.usd_24h_change || 0

                return {
                    rank: index + 1, // logical rank based on our list order (roughly market cap order)
                    symbol: coin.symbol,
                    name: coin.name,
                    // Format: "R$ 350.000 ($ 64.000)"
                    value: `R$ ${priceBrl.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ($ ${priceUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })})`,
                    price: priceUsd,
                    change: change,
                    currency: 'USD' as const, // Base currency for Crypto in our system logic (we store USD price)
                    highlight: change > 0
                }
            }) // Removed sort to keep default Market Cap order (BTC #1)

            console.log('Crypto data fetched:', newCrypto)
            return newCrypto.slice(0, 5)

        } catch (error) {
            console.error('Error fetching CoinGecko data:', error)
            return MOCK_DATA.crypto
        }
    },

    async getAssetHistory(symbol: string, type: 'stock' | 'crypto' | 'fii', timeframe: '1D' | '1M' | '3M' | '1Y', market: string = 'BR'): Promise<{ date: string, value: number }[]> {
        if (type === 'crypto' || market === 'CRYPTO') {
            // Map symbol to CoinGecko ID
            const idMap: Record<string, string> = {
                'BTC': 'bitcoin',
                'ETH': 'ethereum',
                'BNB': 'binancecoin',
                'SOL': 'solana',
                'XRP': 'ripple',
                'DOGE': 'dogecoin',
                'ADA': 'cardano',
                'AVAX': 'avalanche-2'
            }
            const id = idMap[symbol] || symbol.toLowerCase()

            let days = '30' // Default for 1M
            if (timeframe === '1D') days = '1'
            if (timeframe === '3M') days = '90'
            if (timeframe === '1Y') days = '365'

            try {
                const response = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`)
                if (!response.ok) throw new Error('Failed to fetch crypto history')

                const json = await response.json()
                const prices = json.prices // [[timestamp, price], ...]

                if (!prices) return []

                return prices.map((item: [number, number]) => ({
                    date: new Date(item[0]).toLocaleDateString('pt-BR'),
                    value: item[1]
                }))

            } catch (error) {
                console.error('Error fetching crypto history:', error)
                return []
            }
        } else if (market === 'US') {
            // US Stocks (Yahoo via Backend)
            const rangeMap: Record<string, string> = {
                '1D': '1d',
                '1M': '1mo',
                '3M': '3mo',
                '1Y': '1y'
            }
            const yfRange = rangeMap[timeframe] || '3mo'

            try {
                const response = await fetch(`${API_URL}/api/proxy/market/history?symbol=${symbol}&range=${yfRange}&interval=1d`)
                if (!response.ok) return []

                // Process backend response to match expected format if needed
                // Backend returns [{date: ISO, value: number}]
                const json = await response.json()
                return json.map((item: any) => ({
                    date: new Date(item.date).toLocaleDateString('pt-BR'),
                    value: item.value
                }))
            } catch (e) {
                console.error("Error fetching US history:", e)
                return []
            }
        } else {
            // Stocks / FIIs (Brapi) - BR Market
            if (!BRAPI_TOKEN) return []

            try {
                let range = '3mo' // Default 3mo
                let interval = '1d'

                if (timeframe === '1D') {
                    range = '5d'   // Fetch 5 days to guarantee we find the last trading session
                    interval = '15m' // Intraday
                } else if (timeframe === '1M') {
                    range = '1mo'
                    interval = '1d'
                } else if (timeframe === '3M') {
                    range = '3mo'
                    interval = '1d'
                } else if (timeframe === '1Y') {
                    range = '1y'
                    interval = '1d'
                }

                const response = await fetch(`${BASE_URL_BRAPI}/quote/${symbol}?range=${range}&interval=${interval}&token=${BRAPI_TOKEN}`)
                const json = await response.json()

                if (!json.results || !json.results[0] || !json.results[0].historicalDataPrice) return []

                const history = json.results[0].historicalDataPrice

                // Process data based on timeframe
                let processedHistory = history

                if (timeframe === '1D') {
                    // If we fetched 5d, we only want the *last available trading day*
                    if (history.length > 0) {
                        const lastPoint = history[history.length - 1]
                        const lastDate = new Date(lastPoint.date * 1000).toLocaleDateString('pt-BR')

                        processedHistory = history.filter((item: any) =>
                            new Date(item.date * 1000).toLocaleDateString('pt-BR') === lastDate
                        )
                    }
                }

                return processedHistory.map((item: any) => ({
                    date: timeframe === '1D'
                        ? new Date(item.date * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : new Date(item.date * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    value: item.close
                }))
            } catch (error) {
                console.error('Error fetching Brapi history:', error)
                return []
            }
        }
    },

    async getQuotes(symbols: string[]): Promise<RankItem[]> {
        if (!symbols.length || !BRAPI_TOKEN) return []

        try {
            // Brapi allows comma separated symbols
            const symbolsParam = symbols.join(',')
            const response = await fetch(`${BASE_URL_BRAPI}/quote/${symbolsParam}?token=${BRAPI_TOKEN}`)
            const json = await response.json()

            if (!json.results) return []

            return json.results.map((item: any) => ({
                rank: 0,
                symbol: item.symbol,
                name: item.shortName || item.symbol,
                value: `R$ ${(item.regularMarketPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                price: item.regularMarketPrice,
                change: item.regularMarketChangePercent,
                currency: 'BRL',
                highlight: false
            }))
        } catch (error) {
            console.error('Error fetching specific quotes:', error)
            return []
        }
    },

    async getMarketQuotes(symbols: string[]): Promise<RankItem[]> {
        if (!symbols.length) return []
        try {
            // New Backend Proxy for Market Data (Yahoo)
            const response = await fetch(`${API_URL}/api/proxy/market/quote?symbols=${symbols.join(',')}`)
            if (!response.ok) return []
            const data = await response.json()

            return data.map((item: any) => ({
                rank: 0,
                symbol: item.symbol,
                name: item.symbol, // Yahoo quote might not have full name in this endpoint, but we can try
                value: `$ ${(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, // USD
                price: item.price,
                change: item.change,
                currency: 'USD',
                highlight: item.change > 0
            }))
        } catch (e) {
            console.error("Error fetching US quotes:", e)
            return []
        }
    },

    async searchAssets(query: string): Promise<RankItem[]> {
        if (!query) return []

        const isCrypto = /bitcoin|ethereum|solana|ripple|bnb|btc|eth|sol|xrp/i.test(query)
        let results: RankItem[] = []

        // 1. CoinGecko Search (if looks like crypto or just always try?)
        // Let's optimize: only if 3+ chars
        if (query.length >= 3 || isCrypto) {
            try {
                const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`)
                const data = await response.json()
                if (data.coins) {
                    const cryptoResults = data.coins.slice(0, 3).map((coin: any, index: number) => ({
                        rank: index + 1,
                        symbol: coin.symbol,
                        name: coin.name,
                        value: 'Crypto',
                        price: 0,
                        change: 0,
                        currency: 'USD',
                        highlight: false,
                        type: 'crypto',
                        id: coin.id,
                        market: 'CRYPTO'
                    }))
                    results = [...results, ...cryptoResults]
                }
            } catch (e) {
                console.error("CoinGecko search failed", e)
            }
        }

        // 2. US Stocks (Yahoo via Backend)
        if (query.length >= 2) {
            try {
                const response = await fetch(`${API_URL}/api/proxy/market/search?query=${query}`)
                if (response.ok) {
                    const usData = await response.json()
                    const usResults = usData.map((item: any, index: number) => ({
                        rank: index + 1,
                        symbol: item.symbol,
                        name: item.name,
                        value: `${item.exchDisp} - US`,
                        price: 0,
                        change: 0,
                        currency: 'USD',
                        highlight: false,
                        type: 'stock',
                        market: 'US'
                    }))
                    results = [...results, ...usResults]
                }
            } catch (e) {
                console.error("Yahoo search failed", e)
            }
        }

        // 3. Brapi Search (BR)
        if (BRAPI_TOKEN && query.length >= 2) {
            try {
                const response = await fetch(`${BASE_URL_BRAPI}/quote/list?search=${query}&limit=5&token=${BRAPI_TOKEN}`)
                const data = await response.json()
                if (data.stocks) {
                    const stockResults = data.stocks.map((item: any, index: number) => ({
                        rank: index + 1,
                        symbol: item.stock,
                        name: item.name,
                        value: `B3`,
                        price: item.close,
                        change: item.change,
                        currency: 'BRL',
                        highlight: false,
                        type: 'stock',
                        market: 'BR'
                    }))
                    results = [...results, ...stockResults]
                }
            } catch (e) {
                console.error("Brapi search failed", e)
            }
        }

        return results
    },

    async getWatchlistQuotes(assets: { symbol: string, type?: string, market?: string }[]): Promise<RankItem[]> {
        const stocks = assets.filter(a => {
            const m = a.market?.toUpperCase();
            const t = a.type?.toLowerCase();
            const isCryptoRegex = /^(BTC|ETH|SOL|XRP|BNB|DOGE|ADA|AVAX|DOT|LINK|MATIC|MATICPO|POL|SHIB|DAI|LTC|UNI|ATOM|TRX|NEAR|KAS|PEPE|APT|RNDR|RENDER|STX)$/i.test(a.symbol);

            // Prioridade para metadados explícitos
            if (m === 'CRYPTO' || t === 'crypto') return false;
            if (m === 'BR' || m === 'US' || t === 'stock' || t === 'reit') return true;

            // Fallback para regex
            return !isCryptoRegex;
        }).map(a => a.symbol)

        const cryptos = assets.filter(a => {
            const m = a.market?.toUpperCase();
            const t = a.type?.toLowerCase();
            const isCryptoRegex = /^(BTC|ETH|SOL|XRP|BNB|DOGE|ADA|AVAX|DOT|LINK|MATIC|MATICPO|POL|SHIB|DAI|LTC|UNI|ATOM|TRX|NEAR|KAS|PEPE|APT|RNDR|RENDER|STX)$/i.test(a.symbol);

            return m === 'CRYPTO' || t === 'crypto' || isCryptoRegex;
        }).map(a => a.symbol.toLowerCase())

        let stocksData: RankItem[] = []
        let cryptoData: RankItem[] = []

        // Fetch all non-crypto assets (BR & US) via Brapi
        if (stocks.length > 0) {
            stocksData = await this.getQuotes(stocks)
        }

        // Fetch Cryptos
        if (cryptos.length > 0) {
            // Usa o proxy do backend para evitar rate limit e CORS da CoinGecko
            // O backend faz o mapeamento símbolo -> CoinGecko ID
            try {
                const symbolsParam = cryptos.join(',') // ex: "btc,eth,bitcoin"
                const response = await fetch(`${API_URL}/api/proxy/market/crypto?symbols=${encodeURIComponent(symbolsParam)}`)

                if (!response.ok) {
                    console.warn(`Crypto proxy returned ${response.status}`)
                } else {
                    const data: Array<{
                        symbol: string
                        price_usd: number
                        price_brl: number
                        change_24h: number
                    }> = await response.json()

                    cryptoData = data.map(d => ({
                        rank: 0,
                        symbol: d.symbol, // já vem em UPPERCASE do backend
                        name: d.symbol,
                        value: `$ ${d.price_usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
                        price: d.price_usd,
                        change: d.change_24h,
                        currency: 'USD',
                        highlight: d.change_24h > 0
                    }))
                }
            } catch (e) {
                console.error("Crypto proxy fetch error", e)
            }
        }

        return [...stocksData, ...cryptoData]
    }
}
