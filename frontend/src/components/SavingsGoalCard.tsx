import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface SavingsGoalCardProps {
    currentSavings: number
    savingsGoal: number
}

export function SavingsGoalCard({ currentSavings, savingsGoal }: SavingsGoalCardProps) {
    const isNegative = currentSavings < 0
    const savingsPercentage = savingsGoal > 0 ? (currentSavings / savingsGoal) * 100 : 0
    const displayPercentage = Math.max(0, Math.min(savingsPercentage, 100))
    const remaining = Math.max(savingsGoal - currentSavings, 0)

    return (
        <Card className="transition-all duration-300 hover:shadow-lg border-none bg-muted/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className={cn("h-5 w-5", isNegative ? "text-red-600" : "text-blue-600")} />
                    <span>Meta de Economia</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Current vs Goal */}
                    <div className="flex justify-between items-baseline">
                        <div>
                            <p className={cn("text-2xl font-bold", isNegative ? "text-red-600" : "text-blue-600")}>
                                R$ {currentSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                de R$ {savingsGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={cn(
                                "text-lg font-black",
                                isNegative ? "text-red-600" :
                                    savingsPercentage >= 100 ? "text-green-500" :
                                        savingsPercentage >= 50 ? "text-blue-500" : "text-orange-500"
                            )}>
                                {savingsPercentage.toFixed(0)}%
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-700 ease-out",
                                isNegative
                                    ? "bg-red-600/30"
                                    : "bg-gradient-to-r from-blue-600 to-emerald-500"
                            )}
                            style={{ width: `${displayPercentage}%` }}
                        />
                    </div>

                    {/* Status Message */}
                    <div className="flex items-start gap-2">
                        <p className="text-sm text-muted-foreground font-medium">
                            {isNegative
                                ? `📉 Atenção: Você está R$ ${Math.abs(currentSavings).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no negativo. Precisa de R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para a meta.`
                                : savingsPercentage >= 100
                                    ? "🎉 Meta atingida! Parabéns por economizar!"
                                    : `Faltam R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para atingir sua meta.`}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
