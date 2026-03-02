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
                        Planos e Preços
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
                        Evolua sua Gestão <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Para o Próximo Nível</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Escolha o plano que melhor se adapta aos seus objetivos. Desbloqueie workspaces ilimitados, mais ativos e ferramentas exclusivas.
                    </p>
                </motion.div>
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
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-1 px-4 shadow-lg flex items-center gap-1 border-none">
                                    <Star className="w-3 h-3 fill-white" /> MAIS POPULAR
                                </Badge>
                            </div>
                        )}

                        <Card className={`h-full border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col ${plan.recommended ? 'border-blue-500 shadow-blue-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-3 rounded-2xl bg-${plan.color}-100 dark:bg-${plan.color}-900/30 text-${plan.color}-600`}>
                                        {plan.id === 'monthly' ? <Zap className="w-6 h-6" /> : plan.id === 'quarterly' ? <Crown className="w-6 h-6" /> : <Star className="w-6 h-6" />}
                                    </div>
                                    {plan.discount && (
                                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-600 border-none font-bold">
                                            {plan.discount}
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="mb-6">
                                    {plan.originalPrice && (
                                        <span className="text-slate-400 line-through text-sm block">
                                            {plan.originalPrice}
                                        </span>
                                    )}
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                                        <span className="text-sm text-slate-500 font-medium">/período</span>
                                    </div>
                                </div>

                                <ul className="space-y-4">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                                                <Check className="w-3 h-3" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={loading !== null}
                                    className={`w-full py-6 rounded-xl font-bold text-base transition-all ${plan.recommended ? 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20' : 'bg-slate-900 hover:bg-black'}`}
                                >
                                    {loading === plan.id ? 'Processando...' : 'Começar Agora'}
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="mt-20 max-w-4xl mx-auto text-center bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl">
                <div className="flex items-center justify-center gap-2 text-blue-600 font-bold mb-4">
                    <Shield className="w-5 h-5" />
                    Pagamento 100% Seguro
                </div>
                <h3 className="text-xl font-bold mb-2">Garantia de Satisfação</h3>
                <p className="text-slate-500 text-sm max-w-xl mx-auto">
                    Não se preocupe, você pode cancelar sua assinatura a qualquer momento diretamente no seu painel de controle ou entrando em contato com nosso suporte.
                </p>
            </div>
        </div>
    )
}
