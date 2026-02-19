import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Calendar, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface JointGoal {
    id: number
    title: string
    description?: string
    target_amount: number
    current_amount: number
    deadline?: string
}

interface JointGoalCardProps {
    goal: JointGoal
    onUpdate?: (id: number, amount: number) => void
}

export function JointGoalCard({ goal }: JointGoalCardProps) {
    const target = goal.target_amount || 0
    const current = goal.current_amount || 0
    const progress = target > 0 ? (current / target) * 100 : 0
    const remaining = Math.max(target - current, 0)

    let daysRemaining: number | null = null
    try {
        if (goal.deadline) {
            const deadlineDate = new Date(goal.deadline)
            if (!isNaN(deadlineDate.getTime())) {
                daysRemaining = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            }
        }
    } catch (e) {
        daysRemaining = null
    }

    return (
        <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500" />
                    <span>{goal.title}</span>
                </CardTitle>
                {goal.description && (
                    <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress Display */}
                <div className="flex justify-between items-baseline">
                    <div>
                        <p className="text-2xl font-bold text-pink-600">
                            R$ {(goal.current_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            de R$ {(goal.target_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={cn(
                            "text-lg font-semibold",
                            progress >= 100 ? "text-green-500" :
                                progress >= 50 ? "text-pink-500" : "text-orange-500"
                        )}>
                            {progress.toFixed(0)}%
                        </p>
                        {daysRemaining !== null && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{daysRemaining} dias</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>

                {/* Status Message */}
                <div className="flex items-start gap-2">
                    {progress >= 100 ? (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            🎉 Meta alcançada! Parabéns!
                        </p>
                    ) : (
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                                Faltam R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para alcançar a meta
                            </p>
                            {daysRemaining !== null && daysRemaining > 0 && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>
                                        Economize R$ {(remaining / daysRemaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por dia
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
