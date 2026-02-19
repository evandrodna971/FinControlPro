import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import * as Dialog from "@radix-ui/react-dialog"
import { Settings, Target, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SavingsGoalCardProps {
    currentSavings: number
    savingsGoal: number
    onGoalUpdate: (newGoal: number) => void
}

export function SavingsGoalCard({ currentSavings, savingsGoal, onGoalUpdate }: SavingsGoalCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newGoal, setNewGoal] = useState(savingsGoal.toString())

    const savingsPercentage = savingsGoal > 0 ? Math.min((currentSavings / savingsGoal) * 100, 100) : 0
    const remaining = Math.max(savingsGoal - currentSavings, 0)

    const handleSaveGoal = () => {
        const goalValue = parseFloat(newGoal)
        if (!isNaN(goalValue) && goalValue > 0) {
            onGoalUpdate(goalValue)
            setIsDialogOpen(false)
        }
    }

    return (
        <>
            <Card className="transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            <span>Meta de Economia</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsDialogOpen(true)}
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
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

            {/* Goal Setting Dialog */}
            <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border rounded-lg shadow-lg p-6 w-full max-w-md z-50">
                        <div className="flex items-center justify-between mb-4">
                            <Dialog.Title className="text-lg font-semibold">
                                Definir Meta de Economia
                            </Dialog.Title>
                            <Dialog.Close asChild>
                                <Button variant="ghost" size="sm">
                                    <X className="h-4 w-4" />
                                </Button>
                            </Dialog.Close>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="goal-amount">Meta Mensal (R$)</Label>
                                <Input
                                    id="goal-amount"
                                    type="number"
                                    value={newGoal}
                                    onChange={(e) => setNewGoal(e.target.value)}
                                    placeholder="Ex: 1000.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    💡 Dica: Especialistas recomendam economizar pelo menos 20% da sua renda mensal.
                                </p>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button onClick={handleSaveGoal}>
                                    Salvar Meta
                                </Button>
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    )
}
