import { LineChart } from 'lucide-react'
import { MarketOverview } from '@/components/market/MarketOverview'

export function MarketDashboard() {
    return (
        <div className="min-h-screen bg-[#0A0B0E] text-slate-200">
            {/* Header Section */}
            <div className="border-b border-slate-800 bg-[#0A0B0E]/95 backdrop-blur sticky top-0 z-30">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <LineChart className="w-8 h-8 text-blue-500" />
                            Market Rank Pro
                        </h1>
                        <p className="text-slate-400 text-sm">Rankings em tempo real - Ações, FIIs, Stocks e Cripto</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <MarketOverview />
            </div>
        </div>
    )
}
