import { ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { RankItem } from '@/data/market-ranks'

interface RankCardProps {
    title: string
    icon: React.ElementType
    data: RankItem[]
    type?: 'yield' | 'value' | 'crypto'
    className?: string
    onItemClick?: (item: RankItem) => void
}

export function RankCard({ title, icon: Icon, data, type = 'value', className, onItemClick }: RankCardProps) {
    return (
        <Card className={cn("overflow-hidden border-slate-800 bg-[#0A0B0E]/80 backdrop-blur-md shadow-2xl", className)}>
            <CardHeader className="bg-gradient-to-r from-blue-900/20 to-transparent border-b border-slate-800/50 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Icon className="w-5 h-5" />
                    </div>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-800/50">
                    {data.map((item, index) => (
                        <div
                            key={item.symbol}
                            onClick={() => onItemClick?.(item)}
                            className={cn(
                                "flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors group cursor-pointer",
                                index < 3 && "bg-gradient-to-r from-slate-900/50 to-transparent"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <span className={cn(
                                    "text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full",
                                    index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                                        index === 1 ? "bg-slate-300/20 text-slate-300" :
                                            index === 2 ? "bg-amber-700/20 text-amber-700" :
                                                "text-slate-500"
                                )}>
                                    {item.rank}
                                </span>
                                <div>
                                    <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                                        {item.symbol}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate max-w-[120px]">
                                        {item.name}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end">
                                <span className={cn(
                                    "font-mono font-bold text-sm",
                                    (type === 'yield' || item.highlight) ? "text-emerald-400" : "text-slate-200"
                                )}>
                                    {item.value}
                                </span>
                                {item.change !== undefined && (
                                    <div className={cn(
                                        "flex items-center text-xs",
                                        item.change >= 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {item.change >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                        {Math.abs(item.change).toFixed(2)}%
                                    </div>
                                )}
                                {type === 'value' && (
                                    <div className="w-16 h-1 mt-1 bg-slate-800 rounded-full overflow-hidden hidden">
                                        {/* Hidden as per user request */}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            <div className="p-3 bg-slate-900/50 border-t border-slate-800 text-center">
                <button className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Ver Ranking Completo
                </button>
            </div>
        </Card>
    )
}
