import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconSelector } from '@/components/IconSelector'
import * as Icons from 'lucide-react'
import { Pencil, X, Trash2 } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Category {
    id: number;
    name: string;
    type: string;
    budget_limit: number;
    icon?: string;
}

export default function Categories() {
    const [categories, setCategories] = useState<Category[]>([])
    const [name, setName] = useState("")
    const [budget, setBudget] = useState("")
    const [type, setType] = useState("expense")
    const [icon, setIcon] = useState("Circle")
    const [color, setColor] = useState("#3b82f6") // Default blue

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories/')
            setCategories(data)
        } catch (error) {
            console.error("Erro ao buscar categorias:", error)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [editName, setEditName] = useState("")
    const [editBudget, setEditBudget] = useState("")
    const [editType, setEditType] = useState("expense")
    const [editIcon, setEditIcon] = useState("Circle")
    const [editColor, setEditColor] = useState("#3b82f6")

    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await api.post('/categories/', {
                name,
                type,
                icon,
                color,
                budget_limit: parseFloat(budget) || 0
            })
            setName("")
            setBudget("")
            setIcon("Circle")
            setColor("#3b82f6")
            fetchCategories()
        } catch (error) {
            console.error("Falha ao criar categoria", error)
        }
    }

    const handleEditClick = (cat: Category) => {
        setEditingCategory(cat)
        setEditName(cat.name)
        setEditBudget(cat.budget_limit ? cat.budget_limit.toString() : "0")
        setEditType(cat.type)
        setEditIcon(cat.icon || "Circle")
        setEditColor((cat as any).color || "#3b82f6")
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingCategory) return

        try {
            await api.put(`/categories/${editingCategory.id}`, {
                name: editName,
                type: editType,
                icon: editIcon,
                color: editColor,
                budget_limit: parseFloat(editBudget) || 0
            })
            setEditingCategory(null)
            fetchCategories()
        } catch (error) {
            console.error("Falha ao atualizar categoria", error)
        }
    }

    const handleDelete = async () => {
        if (!deletingCategory) return
        try {
            await api.delete(`/categories/${deletingCategory.id}`)
            setDeletingCategory(null)
            fetchCategories()
        } catch (error) {
            console.error("Falha ao deletar categoria", error)
        }
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Categorias & Orçamentos</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Create Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Nova Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="ex: Aluguel" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={type} onChange={e => setType(e.target.value)}
                                >
                                    <option value="expense">Despesa</option>
                                    <option value="income">Receita</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Ícone</Label>
                                <IconSelector value={icon} onChange={setIcon} />
                            </div>
                            <div className="space-y-2">
                                <Label>Cor</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={color}
                                        onChange={e => setColor(e.target.value)}
                                        className="w-20 h-10 cursor-pointer"
                                    />
                                    <Input
                                        type="text"
                                        value={color}
                                        onChange={e => setColor(e.target.value)}
                                        placeholder="#3b82f6"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Limite de Orçamento (Opcional)</Label>
                                <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0,00" />
                            </div>
                            <Button type="submit" className="w-full">Criar Categoria</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Suas Categorias</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {categories.map(cat => {
                                const IconComponent = (Icons as any)[cat.icon || "Circle"] || Icons.Circle
                                return (
                                    <div key={cat.id} className="flex justify-between items-center p-3 border rounded-md group hover:bg-muted/50 transition-colors">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer flex-1"
                                            onClick={() => handleEditClick(cat)}
                                        >
                                            <div className="p-2 bg-muted rounded-full group-hover:bg-background transition-colors">
                                                <IconComponent className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium group-hover:underline">{cat.name}</p>
                                                <p className="text-sm text-muted-foreground capitalize">{cat.type === 'expense' ? 'Despesa' : 'Receita'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {cat.type === 'expense' && (
                                                <div className="text-right mr-2">
                                                    <p className="text-sm text-muted-foreground">Orçamento</p>
                                                    <p className="font-bold">R${(cat.budget_limit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(cat)}>
                                                <Pencil className="h-4 w-4 opacity-50 hover:opacity-100" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingCategory(cat)} className="text-red-500 hover:text-red-600 hover:bg-red-100/10">
                                                <Trash2 className="h-4 w-4 opacity-70 hover:opacity-100" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Modal */}
            {editingCategory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Editar Categoria</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setEditingCategory(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nome</Label>
                                    <Input value={editName} onChange={e => setEditName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={editType} onChange={e => setEditType(e.target.value)}
                                    >
                                        <option value="expense">Despesa</option>
                                        <option value="income">Receita</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Ícone</Label>
                                    <IconSelector value={editIcon} onChange={setEditIcon} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cor</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={editColor}
                                            onChange={e => setEditColor(e.target.value)}
                                            className="w-20 h-10 cursor-pointer"
                                        />
                                        <Input
                                            type="text"
                                            value={editColor}
                                            onChange={e => setEditColor(e.target.value)}
                                            placeholder="#3b82f6"
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Limite de Orçamento</Label>
                                    <Input type="number" value={editBudget} onChange={e => setEditBudget(e.target.value)} />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>Cancelar</Button>
                                    <Button type="submit">Salvar Alterações</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deseja excluir esta categoria?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. A categoria "{deletingCategory?.name}" será removida permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Confirmar Exclusão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
