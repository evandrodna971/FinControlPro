import React, { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useAuthStore } from '@/store/useAuthStore'

interface Member {
    user_id: number;
    email: string;
    role: string;
    full_name?: string;
    status: string;
}

export default function Team() {
    const { activeWorkspace } = useWorkspaceStore()
    const { user: currentUser } = useAuthStore()
    const [members, setMembers] = useState<Member[]>([])

    // Invite Form
    const [email, setEmail] = useState("")
    const [role, setRole] = useState("member")

    const fetchMembers = async () => {
        if (!activeWorkspace) return
        try {
            const membersRes = await api.get(`/workspaces/${activeWorkspace.id}/members`)
            setMembers(membersRes.data)
        } catch (error) {
            console.error("Erro ao carregar membros", error)
        }
    }

    useEffect(() => {
        fetchMembers()
    }, [activeWorkspace])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeWorkspace) return
        try {
            await api.post(`/workspaces/${activeWorkspace.id}/invite?email=${email}&role=${role}`)
            setEmail("")
            fetchMembers()
            alert("Membro convidado com sucesso!")
        } catch (error: any) {
            if (error.response?.status === 404) {
                alert("Erro: Este e-mail não está cadastrado no sistema. O usuário precisa primeiro criar uma conta.")
            } else {
                alert("Erro ao convidar membro")
            }
        }
    }

    const handleUpdateRole = async (userId: number, newRole: string) => {
        if (!activeWorkspace) return
        try {
            await api.patch(`/workspaces/${activeWorkspace.id}/members/${userId}`, { role: newRole })
            fetchMembers()
        } catch (error) {
            alert("Erro ao atualizar cargo")
        }
    }

    const handleRemoveMember = async (userId: number) => {
        if (!activeWorkspace) return
        if (!confirm("Tem certeza que deseja remover este membro ou cancelar o convite?")) return
        try {
            await api.delete(`/workspaces/${activeWorkspace.id}/members/${userId}`)
            fetchMembers()
        } catch (error) {
            alert("Erro ao remover membro")
        }
    }

    if (!activeWorkspace) {
        return <div className="p-8 text-center text-muted-foreground">Selecione um Workspace para gerenciar a equipe.</div>
    }

    const currentMember = members.find(m => m.user_id === currentUser?.id)
    const isPrivileged = currentMember?.role === 'owner' || currentMember?.role === 'admin'

    return (
        <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    {/* Pending Invites Section */}
                    {members.some(m => m.status === 'pending') && (
                        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-900/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                                    <span className="bg-yellow-200 dark:bg-yellow-900/30 p-1.5 rounded-full">⏳</span>
                                    Convites Pendentes
                                </CardTitle>
                                <CardDescription>Usuários convidados que ainda não aceitaram</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {members.filter(m => m.status === 'pending').map(member => (
                                        <div key={member.user_id} className="flex items-center justify-between p-3 bg-background border rounded-lg shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs">
                                                    {member.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{member.full_name || 'Usuário'}</p>
                                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                            {isPrivileged && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 gap-1"
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                >
                                                    <Trash2 className="w-4 h-4" /> Cancelar
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Active Members Section */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Membros Ativos</CardTitle>
                                <CardDescription>Usuários com acesso a este workspace</CardDescription>
                            </div>
                            <Users className="text-muted-foreground w-5 h-5" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {members.filter(m => m.status !== 'pending').map(member => (
                                    <div key={member.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {member.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold flex items-center gap-2">
                                                    {member.full_name || 'Sem Nome'}
                                                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                                                        {member.role === 'owner' ? 'PROPRIETÁRIO' : member.role.toUpperCase()}
                                                    </Badge>
                                                </p>
                                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {isPrivileged && member.role !== 'owner' && member.user_id !== currentUser?.id ? (
                                                <>
                                                    <select
                                                        className="bg-background border rounded px-2 py-1 text-xs outline-none focus:ring-1 ring-primary"
                                                        value={member.role}
                                                        onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                                                    >
                                                        <option value="admin">Administrador</option>
                                                        <option value="member">Membro (Editar)</option>
                                                        <option value="observer">Observador (Leitura)</option>
                                                    </select>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemoveMember(member.user_id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Informações</CardTitle>
                            <CardDescription>Workspace: <b>{activeWorkspace.name}</b></CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            {isPrivileged ?
                                "Como administrador, você pode convidar novos membros e gerenciar permissões existentes." :
                                "Você tem acesso a este workspace. Somente administradores podem convidar novos membros."
                            }
                        </CardContent>
                    </Card>

                    {isPrivileged && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Novo Membro</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleInvite} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>E-mail do Usuário</Label>
                                        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email cadastrado..." required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nível de Acesso</Label>
                                        <select
                                            className="w-full bg-background border px-3 py-2 rounded-md text-sm outline-none focus:ring-1 ring-primary"
                                            value={role} onChange={e => setRole(e.target.value)}
                                        >
                                            <option value="member">Membro (Editar)</option>
                                            <option value="observer">Observador (Leitura)</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                    <Button type="submit" className="w-full">
                                        <UserPlus className="w-4 h-4 mr-2" /> Convidar
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
