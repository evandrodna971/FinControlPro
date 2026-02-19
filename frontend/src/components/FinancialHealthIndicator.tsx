import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Activity, TrendingUp, AlertCircle } from "lucide-react"

interface FinancialHealthIndicatorProps {
    income: number
    expenses: number
}

export function FinancialHealthIndicator({ income, expenses }: FinancialHealthIndicatorProps) {
    // Calculate health score (0-100)
    const calculateHealthScore = (): number => {
        if (income === 0) return 0

        const savingsRate = ((income - expenses) / income) * 100

        // Score based on savings rate
        if (savingsRate >= 20) {
            return Math.min(100, 70 + (savingsRate - 20) * 1.5)
        } else if (savingsRate >= 0) {
            return 40 + (savingsRate / 20) * 30
        } else {
            // Negative savings (deficit)
            return Math.max(0, 40 + (savingsRate / 50) * 40)
        }
    }

    const healthScore = calculateHealthScore()
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0

    // Determine health status
    const getHealthStatus = () => {
        if (healthScore >= 80) return { label: "Excelente", color: "text-green-600", icon: TrendingUp }
        if (healthScore >= 60) return { label: "Saudável", color: "text-green-500", icon: Activity }
        if (healthScore >= 40) return { label: "Moderado", color: "text-yellow-500", icon: Activity }
        if (healthScore >= 20) return { label: "Atenção", color: "text-orange-500", icon: AlertCircle }
        return { label: "Crítico", color: "text-red-500", icon: AlertCircle }
    }

    const getHealthColor = () => {
        if (healthScore >= 70) return "bg-green-500"
        if (healthScore >= 40) return "bg-yellow-500"
        return "bg-red-500"
    }

    const getHealthMessage = () => {
        if (income === 0) return "Adicione receitas para ver sua saúde financeira"
        if (savingsRate >= 20) return "Parabéns! Você está economizando bem"
        if (savingsRate >= 10) return "Bom trabalho! Continue economizando"
        if (savingsRate >= 0) return "Tente economizar pelo menos 10% da sua renda"
        return "Atenção! Suas despesas excedem suas receitas"
    }

    const status = getHealthStatus()
    const StatusIcon = status.icon

    return (
        <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Saúde Financeira</span>
                    <StatusIcon className={cn("h-5 w-5", status.color)} />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Score Display */}
                <div className="flex items-baseline justify-between">
                    <div>
                        <p className={cn("text-3xl font-bold", status.color)}>
                            {healthScore.toFixed(0)}
                        </p>
                        <p className="text-sm text-muted-foreground">de 100 pontos</p>
                    </div>
                    <div className="text-right">
                        <p className={cn("text-lg font-semibold", status.color)}>
                            {status.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {savingsRate.toFixed(1)}% economia
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Crítico</span>
                        <span>Excelente</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-500",
                                getHealthColor()
                            )}
                            style={{ width: `${healthScore}%` }}
                        />
                    </div>
                </div>

                {/* Message */}
                <p className="text-sm text-muted-foreground">
                    {getHealthMessage()}
                </p>
            </CardContent>
        </Card>
    )
}
