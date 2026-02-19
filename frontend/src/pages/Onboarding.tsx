
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Mail, Check, LogOut } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface Invite {
    workspace_id: number;
    workspace_name: string;
    role: string;
    status: string;
}

export default function Onboarding() {
    const { user, logout } = useAuthStore()
    const { setActiveWorkspace, setWorkspaces } = useWorkspaceStore()
    const navigate = useNavigate()

    const [workspaceName, setWorkspaceName] = useState('')
    const [loading, setLoading] = useState(false)
    const [invites, setInvites] = useState<Invite[]>([])
    const [loadingInvites, setLoadingInvites] = useState(true)

    useEffect(() => {
        fetchInvites()
    }, [])

    const fetchInvites = async () => {
        try {
            const { data } = await api.get('/workspaces/invites')
            setInvites(data)
        } catch (error) {
            console.error("Erro ao buscar convites", error)
        } finally {
            setLoadingInvites(false)
        }
    }

    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!workspaceName.trim()) return

        setLoading(true)
        try {
            const { data: newWorkspace } = await api.post('/workspaces/', {
                name: workspaceName,
                type: 'personal'
            })

            // Update store
            const { data: workspaces } = await api.get('/workspaces/')
            setWorkspaces(workspaces)
            setActiveWorkspace(newWorkspace)

            toast.success("Workspace criado com sucesso!")
            navigate('/dashboard')
        } catch (error) {
            toast.error("Erro ao criar workspace")
        } finally {
            setLoading(false)
        }
    }

    const handleAcceptInvite = async (workspaceId: number) => {
        try {
            await api.post(`/workspaces/${workspaceId}/invite/respond`, { accept: true })

            // Refresh workspaces and enter
            const { data: workspaces } = await api.get('/workspaces/')
            setWorkspaces(workspaces)

            const joinedWorkspace = workspaces.find((w: any) => w.id === workspaceId)
            if (joinedWorkspace) {
                setActiveWorkspace(joinedWorkspace)
                toast.success(`Você entrou no workspace "${joinedWorkspace.name}"`)
                navigate('/dashboard')
            }
        } catch (error) {
            toast.error("Erro ao aceitar convite")
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Bem-vindo, {user?.full_name?.split(' ')[0] || 'Usuário'}!</h1>
                    <p className="text-muted-foreground">Para começar, você precisa fazer parte de um Workspace.</p>
                </div>

                {/* Pending Invites Section */}
                <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                                <Mail className="w-5 h-5" /> Convites Pendentes
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={fetchInvites} disabled={loadingInvites}>
                                {loadingInvites ? <Spinner className="w-4 h-4" /> : "Atualizar"}
                            </Button>
                        </div>
                        <CardDescription>
                            Se você foi convidado para um workspace, ele aparecerá aqui.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {loadingInvites ? (
                            <div className="flex justify-center p-4">
                                <Spinner className="w-6 h-6 text-primary" />
                            </div>
                        ) : invites.length > 0 ? (
                            invites.map(invite => (
                                <div key={invite.workspace_id} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {invite.workspace_name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{invite.workspace_name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{invite.role === 'admin' ? 'Administrador' : 'Membro'}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleAcceptInvite(invite.workspace_id)} className="gap-2">
                                        <Check className="w-4 h-4" /> Aceitar
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-4 text-muted-foreground text-sm">
                                <p>Nenhum convite pendente encontrado.</p>
                                <p className="mt-2 text-xs">
                                    Está aguardando um convite? Peça para o administrador do workspace enviar para: <span className="font-bold">{user?.email}</span>
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Create Workspace Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Criar novo Workspace</CardTitle>
                        <CardDescription>
                            Crie seu próprio espaço para gerenciar suas finanças.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateWorkspace} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ws-name">Nome do Workspace</Label>
                                <Input
                                    id="ws-name"
                                    placeholder="Ex: Minhas Finanças, Casa, etc..."
                                    value={workspaceName}
                                    onChange={e => setWorkspaceName(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Spinner className="mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Criar Workspace
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <Button variant="link" onClick={handleLogout} className="text-muted-foreground gap-2">
                        <LogOut className="w-4 h-4" /> Sair da conta
                    </Button>
                </div>
            </div>
        </div>
    )
}
