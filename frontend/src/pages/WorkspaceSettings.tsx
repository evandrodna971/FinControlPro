import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Plus, Trash2, Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function WorkspaceSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [monthlySavingsGoal, setMonthlySavingsGoal] = useState(5000.0)
    const [newWorkspaceName, setNewWorkspaceName] = useState('')
    const { activeWorkspace, workspaces, setActiveWorkspace, setWorkspaces } = useWorkspaceStore()

    useEffect(() => {
        fetchSettings()
        fetchWorkspaces()
    }, [])

    const fetchWorkspaces = async () => {
        try {
            const { data } = await api.get('/workspaces/')
            setWorkspaces(data)
        } catch (error) {
            console.error('Error fetching workspaces:', error)
        }
    }

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/couples/settings')
            if (data.monthly_savings_goal) {
                setMonthlySavingsGoal(data.monthly_savings_goal)
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
            toast.error('Erro ao carregar configurações')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await api.put('/couples/settings', {
                monthly_savings_goal: monthlySavingsGoal
            })
            toast.success('Configurações salvas com sucesso!')
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('Erro ao salvar configurações')
        } finally {
            setSaving(false)
        }
    }

    const handleCreateWorkspace = async () => {
        if (!newWorkspaceName.trim()) {
            toast.error('Digite um nome para o workspace')
            return
        }

        try {
            await api.post('/workspaces/', { name: newWorkspaceName, type: 'business' })
            await fetchWorkspaces()
            setNewWorkspaceName('')
            toast.success('Workspace criado com sucesso!')
        } catch (error) {
            console.error('Error creating workspace:', error)
            toast.error('Erro ao criar workspace')
        }
    }

    const handleDeleteWorkspace = async (workspaceId: number, workspaceName: string) => {
        if (!confirm(`Tem certeza que deseja excluir o workspace "${workspaceName}"? Todos os dados vinculados a ele serão perdidos permanentemente.`)) {
            return
        }

        try {
            await api.delete(`/workspaces/${workspaceId}`)
            await fetchWorkspaces()

            // If deleted workspace was active, switch to first available
            if (activeWorkspace?.id === workspaceId) {
                const remaining = workspaces.filter(w => w.id !== workspaceId)
                if (remaining.length > 0) {
                    setActiveWorkspace(remaining[0])
                } else {
                    setActiveWorkspace(null)
                }
            }

            toast.success('Workspace excluído com sucesso')
        } catch (error) {
            console.error('Error deleting workspace:', error)
            toast.error('Erro ao excluir workspace')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen p-8 bg-background text-foreground flex items-center justify-center">
                <p>Carregando...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-8 bg-background text-foreground">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Configurações do Workspace</h1>
                </div>

                {/* Workspace Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5" />
                            Gerenciar Workspaces
                        </CardTitle>
                        <CardDescription>
                            Crie, selecione ou exclua workspaces
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Create New Workspace */}
                        <div className="space-y-2">
                            <Label htmlFor="newWorkspace">Criar Novo Workspace</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="newWorkspace"
                                    type="text"
                                    value={newWorkspaceName}
                                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                                    placeholder="Nome do workspace"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                                />
                                <Button onClick={handleCreateWorkspace}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Criar
                                </Button>
                            </div>
                        </div>

                        {/* Workspace List */}
                        <div className="space-y-2">
                            <Label>Workspaces Existentes</Label>
                            <div className="space-y-2">
                                {workspaces.map((ws) => (
                                    <div
                                        key={ws.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${activeWorkspace?.id === ws.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{ws.name}</p>
                                                {activeWorkspace?.id === ws.id && (
                                                    <p className="text-xs text-primary">Ativo</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {activeWorkspace?.id !== ws.id && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setActiveWorkspace(ws)}
                                                >
                                                    Ativar
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Financeiro</CardTitle>
                        <CardDescription>
                            Configurações financeiras gerais do workspace
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Monthly Savings Goal */}
                        <div className="space-y-2">
                            <Label htmlFor="savingsGoal">
                                Meta de Economia Mensal (R$)
                            </Label>
                            <Input
                                id="savingsGoal"
                                type="number"
                                step="100"
                                value={monthlySavingsGoal}
                                onChange={(e) => setMonthlySavingsGoal(parseFloat(e.target.value))}
                                placeholder="5000.00"
                            />
                            <p className="text-sm text-muted-foreground">
                                Defina sua meta de economia mensal para acompanhar no dashboard
                            </p>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4">
                            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'Salvando...' : 'Salvar Configurações'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
