import { useState } from 'react'
import { Check, Crown, Star, Zap, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SEO } from '@/components/SEO'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

export default function Subscription() {
    const [loading, setLoading] = useState<string | null>(null)

    const plans = [
        {
            id: 'monthly',
            name: 'Mensal',
            price: 'R$ 29,99',
            description: 'Ideal para quem está começando.',
            features: [
                'Workspaces Ilimitados',
                'Ativos Ilimitados',
                'Acompanhamento em Tempo Real',
                'Suporte Prioritário',
            ],
            color: 'blue'
        },
        {
            id: 'quarterly',
            name: 'Trimestral',
            price: 'R$ 85,47',
            originalPrice: 'R$ 89,97',
            discount: '5% OFF',
            description: 'O melhor custo-benefício.',
            features: [
                'Tudo do Plano Mensal',
                'Relatórios Avançados',
                'Exportação de Dados',
                'Acesso Antecipado a Features',
            ],
            recommended: true,
            color: 'indigo'
        },
        {
            id: 'annual',
            name: 'Anual',
            price: 'R$ 323,89',
            originalPrice: 'R$ 359,88',
            discount: '10% OFF',
            description: 'Para o investidor de longo prazo.',
            features: [
                'Tudo do Plano Trimestral',
                'Consultoria Individual (1h)',
                'Acesso Vitalício ao Grupo VIP',
                'Economia Máxima',
            ],
            color: 'purple'
        }
    ]

    const handleUpgrade = async (planId: string) => {
        setLoading(planId)
        // Simulação de gateway de pagamento
        setTimeout(() => {
            setLoading(null)
            window.location.href = 'https://checkout.exemplo.com/' // URL simulada
        }, 1500)
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <SEO title="Assinatura | FinControl Pro" description="Escolha o melhor plano para sua jornada financeira." />

            <div className="max-w-7xl mx-auto text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Badge variant="outline" className="mb-4 py-1 px-4 border-blue-500 text-blue-500 font-bold uppercase tracking-widest text-[10px]">
                        Evolução Financeira
                    </Badge>
                    <h1 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
                        Domine Seus Investimentos <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Sem Limites e Com Inteligência</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-medium">
                        Você atingiu um marco no seu planejamento. Para continuar evoluindo e gerir uma carteira profissional, escolha o plano que melhor se adapta à sua estratégia.
                    </p>
                </motion.div>
            </div>

            {/* Benefícios Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
                {[
                    { icon: <Shield className="w-6 h-6" />, title: "Segurança Total", desc: "Seus dados criptografados e backups diários automáticos." },
                    { icon: <Zap className="w-6 h-6" />, title: "Tempo Real", desc: "Cotações de B3, US e Cripto atualizadas instantaneamente." },
                    { icon: <Crown className="w-6 h-6" />, title: "Profissional", desc: "Workspaces ilimitados para separar finanças pessoais e business." }
                ].map((item, i) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mb-4">
                            {item.icon}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                    >
                        {plan.recommended && (
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 w-full flex justify-center">
                                <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black py-1.5 px-6 shadow-xl shadow-orange-500/20 border-none whitespace-nowrap rounded-full tracking-tight text-[11px] ring-4 ring-slate-50 dark:ring-slate-950">
                                    <Star className="w-3.5 h-3.5 mr-1.5 fill-white" /> O FAVORITO DOS INVESTIDORES
                                </Badge>
                            </div>
                        )}

                        <Card className={`h-full border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 flex flex-col overflow-hidden relative ${plan.recommended ? 'border-blue-600 dark:border-blue-500 shadow-blue-500/10 scale-105 z-10' : 'border-slate-200 dark:border-slate-800 opacity-95'}`}>
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 shadow-inner flex items-center justify-center`}>
                                        {plan.id === 'monthly' ? <Zap className="w-6 h-6 text-blue-500 fill-blue-500/10" /> : plan.id === 'quarterly' ? <Crown className="w-6 h-6 text-amber-500 fill-amber-500/10" /> : <Star className="w-6 h-6 text-purple-500 fill-purple-500/10" />}
                                    </div>
                                    {plan.discount && (
                                        <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border-none font-black px-3 py-1">
                                            {plan.discount}
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-2xl font-black tracking-tight">{plan.name}</CardTitle>
                                <CardDescription className="font-medium">{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="flex flex-col gap-1.5 mb-8">
                                    <div className="flex items-center gap-2">
                                        {plan.originalPrice ? (
                                            <span className="text-sm text-slate-400 line-through font-medium">De {plan.originalPrice}</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">Plano Mensal</span>
                                        )}
                                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                                            {plan.price}
                                        </span>
                                        <span className="text-sm text-slate-400 dark:text-slate-500 font-bold">/mês</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">O que está incluso:</p>
                                    <ul className="space-y-3.5">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium group/item">
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                                    <Check className="w-3 h-3 stroke-[3]" />
                                                </div>
                                                <span className="leading-tight">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-6">
                                <Button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={loading !== null}
                                    className={`w-full py-8 rounded-2xl font-black text-lg transition-all ${plan.recommended ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/30' : 'bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'}`}
                                >
                                    {loading === plan.id ? (
                                        <span className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                                            Processando...
                                        </span>
                                    ) : (
                                        <>
                                            Começar Agora
                                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="mt-24 max-w-4xl mx-auto text-center">
                <div className="relative p-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-[2.5rem] shadow-2xl">
                    <div className="bg-white dark:bg-slate-950 p-10 md:p-16 rounded-[2.3rem] relative overflow-hidden">
                        {/* Abstract Background Element */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight relative z-10">
                            Pronto para transformar sua <br />
                            <span className="text-blue-600">Vida Financeira?</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-2xl mx-auto relative z-10">
                            Milhares de investidores já utilizam o FinControl Pro para tomar decisões mais inteligentes. Junte-se a nós e comece a lucrar com clareza.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                                <Shield className="w-5 h-5 text-emerald-500" />
                                100% Seguro
                            </div>
                            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800" />
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Ativação Imediata
                            </div>
                            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800" />
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                                cancelamento a qualquer momento
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
