import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface SavingsGoalCardProps {
    currentSavings: number
    savingsGoal: number
}

export function SavingsGoalCard({ currentSavings, savingsGoal }: SavingsGoalCardProps) {
    const savingsPercentage = savingsGoal > 0 ? Math.min((currentSavings / savingsGoal) * 100, 100) : 0
    const remaining = Math.max(savingsGoal - currentSavings, 0)

    return (
        <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Meta de Economia</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Current vs Goal */}
                    <div className="flex justify-between items-baseline">
                        <div>
                            <p className="text-2xl font-bold text-blue-600">
                                R$ {currentSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                de R$ {savingsGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={cn(
                                "text-lg font-semibold",
                                savingsPercentage >= 100 ? "text-green-500" :
                                    savingsPercentage >= 50 ? "text-yellow-500" : "text-orange-500"
                            )}>
                                {savingsPercentage.toFixed(0)}%
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                            style={{ width: `${savingsPercentage}%` }}
                        />
                    </div>

                    {/* Status Message */}
                    <p className="text-sm text-muted-foreground">
                        {savingsPercentage >= 100
                            ? "🎉 Meta atingida! Parabéns!"
                            : `Faltam R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para atingir sua meta`}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
