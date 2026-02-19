import { useState, useRef } from 'react'

// ─── Mapeamentos de domínio ────────────────────────────────────────────────

const BR_DOMAIN_MAP: Record<string, string> = {
    PETR4: 'petrobras.com.br', PETR3: 'petrobras.com.br',
    VALE3: 'vale.com', VALE5: 'vale.com',
    ELET3: 'eletrobras.com.br', ELET6: 'eletrobras.com.br',
    ENEV3: 'eneva.com.br', CPLE6: 'copel.com',
    CMIG4: 'cemig.com.br', EGIE3: 'engie.com.br',
    CPFE3: 'cpfl.com.br', TAEE11: 'taesa.com.br',
    ITUB4: 'itau.com.br', ITUB3: 'itau.com.br',
    BBDC4: 'bradesco.com.br', BBDC3: 'bradesco.com.br',
    BBAS3: 'bb.com.br', SANB11: 'santander.com.br',
    BPAC11: 'btgpactual.com', XPBR31: 'xpi.com.br',
    MGLU3: 'magazineluiza.com.br', LREN3: 'lojasrenner.com.br',
    AMER3: 'americanas.com.br', NTCO3: 'naturaeco.com',
    ABEV3: 'ambev.com.br', JBSS3: 'jbs.com.br',
    BRFS3: 'brf-br.com', MRFG3: 'marfrig.com.br',
    VIVT3: 'vivo.com.br', TIMS3: 'tim.com.br',
    TOTS3: 'totvs.com', LWSA3: 'locaweb.com.br',
    RDOR3: 'rededorsirio.com.br', HAPV3: 'hapvida.com.br',
    FLRY3: 'fleury.com.br', HYPE3: 'hypera.com.br',
    CYRE3: 'cyrela.com.br', MRVE3: 'mrv.com.br',
    RAIL3: 'rumo.com.br', CCRO3: 'ccr.com.br',
    GOLL4: 'voegol.com.br', AZUL4: 'voeazul.com.br',
    CSNA3: 'csnsteel.com.br', GGBR4: 'gerdau.com',
    USIM5: 'usiminas.com', CSAN3: 'cosan.com.br',
}

const US_DOMAIN_MAP: Record<string, string> = {
    AAPL: 'apple.com', MSFT: 'microsoft.com', GOOGL: 'google.com',
    GOOG: 'google.com', AMZN: 'amazon.com', META: 'meta.com',
    NVDA: 'nvidia.com', TSLA: 'tesla.com', NFLX: 'netflix.com',
    AVGO: 'broadcom.com', AMD: 'amd.com', INTC: 'intel.com',
    QCOM: 'qualcomm.com', TXN: 'ti.com', MU: 'micron.com',
    ORCL: 'oracle.com', CRM: 'salesforce.com', ADBE: 'adobe.com',
    NOW: 'servicenow.com', SNOW: 'snowflake.com', PLTR: 'palantir.com',
    UBER: 'uber.com', LYFT: 'lyft.com', ABNB: 'airbnb.com',
    SPOT: 'spotify.com', PYPL: 'paypal.com',
    V: 'visa.com', MA: 'mastercard.com', AXP: 'americanexpress.com',
    JPM: 'jpmorganchase.com', BAC: 'bankofamerica.com', WFC: 'wellsfargo.com',
    GS: 'goldmansachs.com', MS: 'morganstanley.com', C: 'citigroup.com',
    JNJ: 'jnj.com', PFE: 'pfizer.com', MRK: 'merck.com',
    ABBV: 'abbvie.com', LLY: 'lilly.com', UNH: 'unitedhealthgroup.com',
    CVX: 'chevron.com', XOM: 'exxonmobil.com', COP: 'conocophillips.com',
    WMT: 'walmart.com', COST: 'costco.com', TGT: 'target.com',
    MCD: 'mcdonalds.com', SBUX: 'starbucks.com', NKE: 'nike.com',
    DIS: 'thewaltdisneycompany.com', CMCSA: 'comcast.com',
    T: 'att.com', VZ: 'verizon.com', TMUS: 't-mobile.com',
    BA: 'boeing.com', CAT: 'caterpillar.com', GE: 'ge.com',
    HON: 'honeywell.com', MMM: '3m.com', RTX: 'rtx.com',
    COIN: 'coinbase.com', MSTR: 'microstrategy.com',
    HOOD: 'robinhood.com', RIOT: 'riotplatforms.com',
}

const CRYPTO_SYMBOLS: Record<string, string> = {
    BTC: '₿', BITCOIN: '₿',
    ETH: 'Ξ', ETHEREUM: 'Ξ',
    SOL: '◎', SOLANA: '◎',
    BNB: 'B', BINANCECOIN: 'B',
    XRP: '✕', RIPPLE: '✕',
    DOGE: 'Ð', DOGECOIN: 'Ð',
    ADA: '₳', CARDANO: '₳',
    DOT: '●', POLKADOT: '●',
    MATIC: 'M', POLYGON: 'M',
    LINK: '⬡', CHAINLINK: '⬡',
    LTC: 'Ł', LITECOIN: 'Ł',
    AVAX: 'A', AVALANCHE: 'A',
    ATOM: '⚛', COSMOS: '⚛',
}

const TYPE_BG: Record<string, string> = {
    crypto: 'bg-orange-500',
    stock: 'bg-blue-600',
    reit: 'bg-emerald-600',
    bond: 'bg-violet-600',
    fund: 'bg-amber-600',
}

// ─── Cache de URLs que funcionaram (não a imagem em si) ───────────────────
// Guarda apenas qual URL funcionou para cada símbolo — sem base64, sem canvas
const WORKING_URL_KEY = 'logo_url_v1_'
const FAILED_KEY = 'logo_fail_v1_'

// Cache em memória para a sessão atual (evita re-render)
const sessionCache: Record<string, string | 'failed'> = {}

function getWorkingUrl(sym: string): string | null {
    if (sym in sessionCache) {
        return sessionCache[sym] === 'failed' ? null : sessionCache[sym] as string
    }
    try {
        const stored = localStorage.getItem(WORKING_URL_KEY + sym)
        if (stored) { sessionCache[sym] = stored; return stored }
        const failed = localStorage.getItem(FAILED_KEY + sym)
        if (failed) { sessionCache[sym] = 'failed'; return null }
    } catch { /* ignora */ }
    return null
}

function saveWorkingUrl(sym: string, url: string) {
    sessionCache[sym] = url
    try { localStorage.setItem(WORKING_URL_KEY + sym, url) } catch { /* ignora */ }
}

function saveFailed(sym: string) {
    sessionCache[sym] = 'failed'
    try { localStorage.setItem(FAILED_KEY + sym, '1') } catch { /* ignora */ }
}

// Limpa cache corrompido de versões anteriores
try {
    Object.keys(localStorage)
        .filter(k => k.startsWith('logo_v2_') || k.startsWith('asset_logo_'))
        .forEach(k => localStorage.removeItem(k))
} catch { /* ignora */ }

// ─── URLs para tentar ─────────────────────────────────────────────────────

function getLogoUrls(symbol: string, market: string): string[] {
    const sym = symbol.toUpperCase()
    const domain = market === 'US'
        ? (US_DOMAIN_MAP[sym] || `${sym.toLowerCase()}.com`)
        : (BR_DOMAIN_MAP[sym] || null)
    if (!domain) return []
    return [
        `https://logo.clearbit.com/${domain}`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    ]
}

// ─── Componente ────────────────────────────────────────────────────────────

interface AssetLogoProps {
    symbol: string
    name: string
    assetType: string
    market: string
    size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
    sm: { container: 'w-7 h-7 rounded-lg', img: 'w-5 h-5', text: 'text-[10px]' },
    md: { container: 'w-9 h-9 rounded-xl', img: 'w-7 h-7', text: 'text-xs' },
    lg: { container: 'w-12 h-12 rounded-2xl', img: 'w-9 h-9', text: 'text-sm' },
}

export function AssetLogo({ symbol, name, assetType, market, size = 'md' }: AssetLogoProps) {
    const sym = symbol.toUpperCase()
    const isCrypto = assetType === 'crypto'
    const bgColor = TYPE_BG[assetType] || 'bg-slate-500'
    const s = sizeMap[size]

    const urls = isCrypto ? [] : getLogoUrls(symbol, market)

    // Inicializa com a URL que já funcionou antes (do cache) ou começa do índice 0
    const [urlIdx, setUrlIdx] = useState<number>(() => {
        if (isCrypto || urls.length === 0) return -1
        const working = getWorkingUrl(sym)
        if (working === null && sessionCache[sym] === 'failed') return -1 // falhou antes
        if (working) {
            const idx = urls.indexOf(working)
            return idx >= 0 ? idx : 0 // usa a URL que funcionou
        }
        return 0 // começa do início
    })

    const [failed, setFailed] = useState(() => {
        if (isCrypto) return false
        return sessionCache[sym] === 'failed'
    })

    const triedRef = useRef(false)

    function handleLoad() {
        const url = urls[urlIdx]
        if (url && !triedRef.current) {
            triedRef.current = true
            saveWorkingUrl(sym, url)
        }
    }

    function handleError() {
        const next = urlIdx + 1
        if (next < urls.length) {
            setUrlIdx(next)
        } else {
            saveFailed(sym)
            setFailed(true)
        }
    }

    // ── Cripto ──
    if (isCrypto) {
        return (
            <div className={`${s.container} flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                <span className={`text-white font-black leading-none ${s.text}`}>
                    {CRYPTO_SYMBOLS[sym] || sym.substring(0, 2)}
                </span>
            </div>
        )
    }

    // ── Fallback: iniciais ──
    if (failed || urlIdx < 0 || urls.length === 0) {
        return (
            <div className={`${s.container} flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                <span className={`text-white font-black leading-none ${s.text}`}>
                    {sym.substring(0, 2)}
                </span>
            </div>
        )
    }

    // ── Logo via URL direta (img tag — sem CORS) ──
    return (
        <div className={`${s.container} flex items-center justify-center flex-shrink-0 bg-white dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-slate-700`}>
            <img
                key={urls[urlIdx]}
                src={urls[urlIdx]}
                alt={name}
                className={`${s.img} object-contain`}
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    )
}
