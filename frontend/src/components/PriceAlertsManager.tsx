import { useState, useEffect } from 'react'
import { Bell, Trash2, Plus, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Alert {
    id: number
    asset_id: number
    symbol: string
    asset_name: string
    alert_type: string
    target_value: number
    condition: 'above' | 'below'
    is_active: boolean
    triggered_at: string | null
    created_at: string
}

interface Asset {
    id: number
    symbol: string
    name: string
}

export function PriceAlertsManager() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [assets, setAssets] = useState<Asset[]>([])
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(true)

    // Form state
    const [newAlert, setNewAlert] = useState({
        asset_id: '',
        target_value: '',
        condition: 'above' as 'above' | 'below',
        alert_type: 'price_target'
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [alertsRes, assetsRes] = await Promise.all([
                api.get('/investments/alerts'),
                api.get('/investments/assets')
            ])
            setAlerts(alertsRes.data)
            setAssets(assetsRes.data)
        } catch (error) {
            console.error('Erro ao buscar dados:', error)
            toast.error('Erro ao carregar alertas')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAlert = async () => {
        if (!newAlert.asset_id || !newAlert.target_value) {
            toast.error('Preencha todos os campos')
            return
        }

        try {
            await api.post(`/investments/alerts?asset_id=${newAlert.asset_id}`, {
                alert_type: newAlert.alert_type,
                target_value: parseFloat(newAlert.target_value),
                condition: newAlert.condition
            })
            toast.success('Alerta criado com sucesso!')
            setIsAdding(false)
            fetchData()
            setNewAlert({ asset_id: '', target_value: '', condition: 'above', alert_type: 'price_target' })
        } catch (error) {
            toast.error('Erro ao criar alerta')
        }
    }

    const handleDeleteAlert = async (id: number) => {
        try {
            await api.delete(`/investments/alerts/${id}`)
            toast.success('Alerta removido')
            setAlerts(alerts.filter(a => a.id !== id))
        } catch (error) {
            toast.error('Erro ao remover alerta')
        }
    }

    const activeAlerts = alerts.filter(a => a.is_active)
    const triggeredAlerts = alerts.filter(a => !a.is_active).sort((a, b) =>
        new Date(b.triggered_at || '').getTime() - new Date(a.triggered_at || '').getTime()
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-6 h-6 text-blue-500" />
                        Alertas de Preço
                    </h2>
                    <p className="text-slate-500 text-sm">Monitore seus ativos e seja notificado no momento certo.</p>
                </div>

                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-500/20">
                            <Plus className="w-4 h-4" />
                            Novo Alerta
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Configurar Alerta</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="space-y-2">
                                <Label>Selecionar Ativo</Label>
                                <Select value={newAlert.asset_id} onValueChange={(v) => setNewAlert({ ...newAlert, asset_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Escolha um ativo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assets.map(asset => (
                                            <SelectItem key={asset.id} value={asset.id.toString()}>
                                                {asset.symbol} - {asset.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Condição</Label>
                                    <Select value={newAlert.condition} onValueChange={(v: any) => setNewAlert({ ...newAlert, condition: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="above">Acima de</SelectItem>
                                            <SelectItem value="below">Abaixo de</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Preço Alvo</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                                        <Input
                                            type="number"
                                            placeholder="0,00"
                                            className="pl-9"
                                            value={newAlert.target_value}
                                            onChange={(e) => setNewAlert({ ...newAlert, target_value: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleCreateAlert} className="w-full bg-blue-600 hover:bg-blue-700">
                                Criar Alerta
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Ativos */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Alertas Ativos
                    </h3>
                    <AnimatePresence mode="popLayout">
                        {activeAlerts.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed">
                                <Bell className="w-8 h-8 text-slate-300 mb-2" />
                                <p className="text-slate-400 text-sm">Nenhum alerta ativo no momento.</p>
                            </motion.div>
                        ) : (
                            activeAlerts.map(alert => (
                                <motion.div
                                    key={alert.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Card className="overflow-hidden border-none shadow-md bg-white dark:bg-slate-900 hover:ring-1 hover:ring-blue-500/30 transition-all">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${alert.condition === 'above' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'}`}>
                                                    {alert.condition === 'above' ? '↑' : '↓'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{alert.symbol}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {alert.condition === 'above' ? 'Preço acima de' : 'Preço abaixo de'}
                                                        <span className="font-bold ml-1 text-slate-700 dark:text-slate-300">
                                                            R$ {alert.target_value ? alert.target_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAlert(alert.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* Histórico */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Histórico de Disparos
                    </h3>
                    <div className="space-y-3">
                        {triggeredAlerts.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 text-sm italic">O histórico está vazio.</div>
                        ) : (
                            triggeredAlerts.map(alert => (
                                <div key={alert.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 opacity-70">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{alert.symbol} disparou!</div>
                                            <div className="text-[10px] text-slate-500">
                                                Atingiu R$ {alert.target_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em {new Date(alert.triggered_at || '').toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
