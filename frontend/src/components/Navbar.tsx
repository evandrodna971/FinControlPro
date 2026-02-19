import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
    Bell,
    LogOut,
    Check,
    X,
    Plus,
    Trash2,
    Settings
} from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
// import { ApprovalNotificationBadge } from './ApprovalNotificationBadge'

interface Notification {
    id: number | string;
    content: string;
    type: string;
    link_id?: number;
    data?: any;
}

export default function Navbar() {
    // const navigate = useNavigate()
    // const location = useLocation()
    const { user, logout } = useAuthStore()
    const { activeWorkspace, workspaces, setActiveWorkspace, setWorkspaces } = useWorkspaceStore()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [showNotifs, setShowNotifs] = useState(false)
    const notifRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifs(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const fetchWorkspaces = async () => {
        try {
            const { data } = await api.get('/workspaces/')
            setWorkspaces(data)
            if (data.length > 0 && !activeWorkspace) {
                setActiveWorkspace(data[0])
            }
        } catch (error) {
            console.error("Erro ao carregar workspaces", error)
        }
    }

    const fetchNotifications = async () => {
        try {
            // Fetch standard notifications
            const { data: notifs } = await api.get('/notifications/')
            setNotifications(notifs)
        } catch (error) {
            console.error("Erro ao carregar notificações", error)
        }
    }

    useEffect(() => {
        fetchWorkspaces()
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [])

    const handleDeleteWorkspace = async () => {
        if (!activeWorkspace) return

        if (!confirm(`Tem certeza que deseja excluir o workspace "${activeWorkspace.name}"? Todos os dados vinculados a ele serão perdidos permanentemente.`)) {
            return
        }

        try {
            await api.delete(`/workspaces/${activeWorkspace.id}`)

            // Fetch updated workspace list
            const { data } = await api.get('/workspaces/')
            setWorkspaces(data)

            // Set the first available workspace, or null if none exist
            if (data.length > 0) {
                setActiveWorkspace(data[0])
            } else {
                setActiveWorkspace(null)
            }

            alert("Workspace excluído com sucesso.")
        } catch (error) {
            alert("Erro ao excluir workspace.")
        }
    }

    const handleCreateWorkspace = async () => {
        const name = prompt("Nome da nova Área de Trabalho:")
        if (!name) return
        try {
            await api.post('/workspaces/', { name, type: 'business' })
            fetchWorkspaces()
        } catch (error) {
            alert("Erro ao criar workspace")
        }
    }

    const handleRespondInvite = async (notif: Notification, accept: boolean) => {
        try {
            await api.post(`/workspaces/${notif.link_id}/invite/respond`, { accept })
            await api.post(`/notifications/${notif.id}/read`)
            fetchNotifications()
            fetchWorkspaces()
            alert(accept ? "Convite aceito!" : "Convite recusado.")
        } catch (error) {
            alert("Erro ao processar convite")
        }
    }



    const handleClearNotifications = async () => {
        try {
            await api.post('/notifications/read-all')
            fetchNotifications()
        } catch (error) {
            console.error("Erro ao limpar notificações", error)
        }
    }



    return (
        <nav className="h-14 border-b bg-card px-6 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-8">
                <Link to="/dashboard" className="font-bold text-xl text-primary">FinControlPro</Link>


            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 pr-4 border-r">
                    <select
                        className="bg-muted text-foreground border border-input rounded-md px-2 py-1 text-sm font-semibold outline-none cursor-pointer hover:bg-muted/80 transition-colors focus:ring-1 focus:ring-ring max-w-[150px]"
                        value={activeWorkspace?.id || (workspaces.length > 0 ? workspaces[0].id : "")}
                        onChange={(e) => {
                            const ws = workspaces.find(w => w.id.toString() === e.target.value)
                            if (ws) setActiveWorkspace(ws)
                        }}
                    >
                        {workspaces.map(ws => (
                            <option key={ws.id} value={ws.id}>{ws.name}</option>
                        ))}
                    </select>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCreateWorkspace} title="Criar Workspace">
                        <Plus className="w-4 h-4" />
                    </Button>
                    {activeWorkspace && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleDeleteWorkspace} title="Excluir Workspace Atual">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                <Link to="/add-transaction">
                    <Button variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Transação</span>
                    </Button>
                </Link>

                <div className="relative" ref={notifRef}>
                    <Button variant="ghost" size="icon" onClick={() => setShowNotifs(!showNotifs)} className="relative">
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        {notifications.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card" />
                        )}
                    </Button>

                    {showNotifs && (
                        <div className="absolute right-0 mt-2 w-80 bg-card border rounded-lg shadow-xl overflow-hidden z-[100]">
                            <div className="p-3 border-b font-bold text-sm flex justify-between items-center bg-muted/40">
                                <span>Notificações</span>
                                {notifications.length > 0 && (
                                    <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground" onClick={handleClearNotifications}>
                                        Limpar tudo
                                    </Button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-muted-foreground italic">Nenhuma nova notificação</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className="p-4 border-b hover:bg-muted/30 transition-colors">
                                            <p className="text-sm font-medium mb-3">{n.content}</p>

                                            {n.type === 'invite' && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="flex-1 h-8 bg-green-600 hover:bg-green-700" onClick={() => handleRespondInvite(n, true)}>
                                                        <Check className="w-3 h-3 mr-1" /> Aceitar
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="flex-1 h-8 text-red-500" onClick={() => handleRespondInvite(n, false)}>
                                                        <X className="w-3 h-3 mr-1" /> Recusar
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Link to="/workspace-settings">
                        <Button variant="ghost" size="icon" title="Configurações">
                            <Settings className="w-5 h-5 text-muted-foreground" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={logout} title={`Sair de ${user?.email}`}>
                        <LogOut className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </div>
            </div>
        </nav >
    )
}
