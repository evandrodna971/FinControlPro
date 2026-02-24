import { useEffect, useState } from 'react'

import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Plus, TrendingUp, TrendingDown, Activity, ArrowRight } from 'lucide-react'
import { TrendChart } from '@/components/TrendChart'
import { CategoryPieChart } from '@/components/CategoryPieChart'
import { UpcomingBills } from '@/components/UpcomingBills'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { FinancialHealthIndicator } from '@/components/FinancialHealthIndicator'
import { SavingsGoalCard } from '@/components/SavingsGoalCard'
import { JointGoalCard } from '@/components/JointGoalCard'
import { RecentTransactionsTimeline } from '@/components/RecentTransactionsTimeline'
import { SEO } from '@/components/SEO'
import { useMonth } from '@/context/MonthContext'

interface Transaction {
    id: number;
    amount: number;
    description: string;
    category_name: string;
    type: string;
    date: string;
    status: string;
    total_value?: number;
    installment_number?: number;
    installment_count?: number;
    is_recurring?: boolean;
}

interface Summary {
    total_balance: number;
    total_income: number;
    total_expenses: number;
    income_trend: { name: string; value: number }[];
    expense_trend: { name: string; value: number }[];
    category_breakdown: { name: string; value: number; percentage: number; icon?: string }[];
    income_category_breakdown: { name: string; value: number; percentage: number; icon?: string }[];
}

export default function Dashboard() {

    const { activeWorkspace } = useWorkspaceStore()
    const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useMonth()

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [summary, setSummary] = useState<Summary>({
        total_balance: 0,
        total_income: 0,
        total_expenses: 0,
        income_trend: [],
        expense_trend: [],
        category_breakdown: [],
        income_category_breakdown: []
    })

    const [chartInterval, setChartInterval] = useState("monthly")
    const [savingsGoal, setSavingsGoal] = useState(5000)
    const [jointGoals, setJointGoals] = useState<any[]>([]) // Default goal

    const fetchData = async () => {
        try {
            const [transRes, sumRes] = await Promise.all([
                api.get<Transaction[]>('/transactions/', { params: { limit: 5, summary_view: true } }), // Get recent transactions with summary view
                api.get<Summary>('/transactions/summary', {
                    params: { month: selectedMonth, year: selectedYear, interval: chartInterval }
                })
            ]);
            setTransactions(transRes.data);
            setSummary(sumRes.data);
        } catch (error) {
            console.error("Erro ao carregar dados do dashboard", error);
        }
    };

    const fetchJointGoals = async () => {
        try {
            const { data } = await api.get('/couples/joint-goals/')
            setJointGoals(data)
        } catch (error) {
            console.error('Error fetching joint goals:', error)
        }
    }

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/couples/settings')
            if (data && data.monthly_savings_goal) {
                setSavingsGoal(data.monthly_savings_goal)
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
        }
    }



    useEffect(() => {
        fetchData();
        fetchJointGoals();
        fetchSettings();
    }, [activeWorkspace, selectedMonth, selectedYear, chartInterval]);

    const handlePrevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12)
            setSelectedYear(selectedYear - 1)
        } else {
            setSelectedMonth(selectedMonth - 1)
        }
    }

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1)
            setSelectedYear(selectedYear + 1)
        } else {
            setSelectedMonth(selectedMonth + 1)
        }
    }

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8">
            <SEO title="Dashboard" description="Visão geral das suas finanças pessoais - saldo, receitas, despesas e metas." />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Bem-vindo de volta ao seu controle financeiro.</p>
                </div>

                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
                    <select
                        className="bg-background border rounded-xl px-3 py-1 text-sm h-10 shadow-sm focus:ring-2 focus:ring-primary outline-none"
                        value={chartInterval}
                        onChange={(e) => setChartInterval(e.target.value)}
                    >
                        <option value="weekly">Semanal</option>
                        <option value="biweekly">Quinzenal</option>
                        <option value="monthly">Mensal</option>
                        <option value="yearly">Anual</option>
                    </select>
                    <div className="flex items-center justify-between border rounded-xl p-1 bg-muted/20">
                        <Button onClick={handlePrevMonth} variant="ghost" size="icon" className="h-8 w-8 hover:bg-background">←</Button>
                        <span className="text-sm font-semibold px-4 min-w-[120px] text-center">
                            {monthNames[selectedMonth - 1]} {selectedYear}
                        </span>
                        <Button onClick={handleNextMonth} variant="ghost" size="icon" className="h-8 w-8 hover:bg-background">→</Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {/* Balance Card */}
                <Card className="transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer bg-gradient-to-br from-blue-950 to-cyan-950 dark:from-blue-50 dark:to-cyan-50 border-blue-800 dark:border-blue-200 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Activity className="h-12 w-12 text-blue-400 dark:text-blue-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-300 dark:text-blue-700">Saldo Total</CardTitle>
                        <Activity className="h-4 w-4 text-blue-400 dark:text-blue-600 md:hidden" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl md:text-3xl font-bold text-blue-100 dark:text-blue-900">
                            R${(summary.total_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-blue-400 dark:text-blue-600 mt-1">
                            Disponível para uso
                        </p>
                    </CardContent>
                </Card>

                {/* Income Card */}
                <Card className="transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer bg-gradient-to-br from-green-950 to-emerald-950 dark:from-green-50 dark:to-emerald-50 border-green-800 dark:border-green-200 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-12 w-12 text-green-400 dark:text-green-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-300 dark:text-green-700">Receitas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-400 dark:text-green-600 md:hidden" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl md:text-3xl font-bold text-green-400 dark:text-green-700">
                            +R${(summary.total_income || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-green-400 dark:text-green-600 font-medium">
                            {summary.income_trend.length > 1 && (
                                <span className="bg-green-900/30 dark:bg-green-100 px-1.5 py-0.5 rounded-md">
                                    ↑ {((summary.total_income - (summary.income_trend[summary.income_trend.length - 2]?.value || 0)) / (summary.income_trend[summary.income_trend.length - 2]?.value || 1) * 100).toFixed(0)}%
                                </span>
                            )}
                            <span className="font-normal opacity-80">recebido este mês</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Expenses Card */}
                <Card className="transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer bg-gradient-to-br from-red-950 to-rose-950 dark:from-red-50 dark:to-rose-50 border-red-800 dark:border-red-200 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingDown className="h-12 w-12 text-red-400 dark:text-red-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-300 dark:text-red-700">Despesas</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-400 dark:text-red-600 md:hidden" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl md:text-3xl font-bold text-red-400 dark:text-red-700">
                            -R${(summary.total_expenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-400 dark:text-red-600 font-medium">
                            {summary.expense_trend.length > 1 && (
                                <span className="bg-red-900/30 dark:bg-red-100 px-1.5 py-0.5 rounded-md">
                                    ↑ {((summary.total_expenses - (summary.expense_trend[summary.expense_trend.length - 2]?.value || 0)) / (summary.expense_trend[summary.expense_trend.length - 2]?.value || 1) * 100).toFixed(0)}%
                                </span>
                            )}
                            <span className="font-normal opacity-80">gasto este mês</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Health & Savings Goal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <FinancialHealthIndicator
                    income={summary.total_income}
                    expenses={summary.total_expenses}
                />
                <SavingsGoalCard
                    currentSavings={summary.total_income - summary.total_expenses}
                    savingsGoal={savingsGoal}
                />
            </div>

            {/* Joint Goals Section */}
            {jointGoals.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight">Metas Conjuntas 💑</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {jointGoals.map((goal) => (
                            <JointGoalCard key={goal.id} goal={goal} />
                        ))}
                    </div>
                </div>
            )}

            {/* Charts Section - Hidden on very small screens */}
            <div className="hidden min-[320px]:grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 mb-8">
                <TrendChart incomeData={summary.income_trend} expenseData={summary.expense_trend} />
                <CategoryPieChart
                    expenseData={summary.category_breakdown}
                    incomeData={summary.income_category_breakdown}
                />
            </div>

            {/* Mobile Chart Placeholder (for screens < 320px) */}
            <div className="block min-[320px]:hidden p-4 text-center bg-muted/20 rounded-xl text-xs text-muted-foreground">
                Gráficos não disponíveis para esta resolução.
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-bold tracking-tight">Próximos Vencimentos</h2>
                    <Link to="/transactions">
                        <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/5">
                            Ver tudo <ArrowRight className="ml-1 w-4 h-4" />
                        </Button>
                    </Link>
                </div>
                <UpcomingBills month={selectedMonth} year={selectedYear} onUpdate={fetchData} />
            </div>

            <Card className="border-none shadow-md overflow-hidden rounded-3xl">
                <CardHeader className="bg-muted/10 pb-4">
                    <CardTitle className="flex justify-between items-center text-lg">
                        Transações Recentes
                        <Link to="/transactions">
                            <Button variant="ghost" size="sm" className="text-xs hover:bg-transparent text-primary">Ver tudo</Button>
                        </Link>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <RecentTransactionsTimeline transactions={transactions} />
                </CardContent>
            </Card>

            {/* Floating Action Button - Hidden on Mobile (use MobileNavbar instead) */}
            <Link to="/add-transaction" className="hidden md:flex fixed bottom-8 right-8 z-50 group items-center gap-2">
                <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-lg border border-slate-700 whitespace-nowrap">
                    Nova Transação
                </span>
                <Button size="lg" className="rounded-2xl w-14 h-14 shadow-2xl bg-primary hover:scale-110 transition-all duration-300 flex items-center justify-center p-0">
                    <Plus className="w-8 h-8 text-white group-hover:rotate-90 transition-transform duration-300" />
                </Button>
            </Link>
        </div>
    )
}
