import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Upload, FileText, Check, Loader2, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'

interface Category {
    id: number
    name: string
    color: string
}

interface TransactionPreview {
    date: string // ISO string from backend
    description: string
    amount: number
    type: 'income' | 'expense'
    category_id: number | null
    category_name: string
    status?: 'paid' | 'pending'
}

interface ImportTransactionsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onImportSuccess: () => void
}

export function ImportTransactionsDialog({
    open,
    onOpenChange,
    onImportSuccess
}: ImportTransactionsDialogProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'processing'>('upload')
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<TransactionPreview[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Fetch categories when dialog opens or step changes to preview
    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories/')
            setCategories(data)
        } catch (error) {
            console.error("Erro ao carregar categorias", error)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            // First load categories for the select dropdowns
            await fetchCategories()

            const { data } = await api.post('/imports/preview', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setPreviewData(data)
            setStep('preview')
        } catch (error: any) {
            console.error("Erro no upload", error)
            toast.error(error.response?.data?.detail || "Erro ao processar arquivo.")
        } finally {
            setLoading(false)
        }
    }

    const updateCategory = (index: number, categoryId: string) => {
        const catId = parseInt(categoryId)
        const catName = categories.find(c => c.id === catId)?.name || 'Outros'

        setPreviewData(prev => {
            const newData = [...prev]
            newData[index] = {
                ...newData[index],
                category_id: catId,
                category_name: catName
            }
            return newData
        })
    }

    const handleRemove = (index: number) => {
        setPreviewData(prev => prev.filter((_, i) => i !== index))
    }

    const handleConfirmImport = async () => {
        setLoading(true)
        setStep('processing')

        try {
            // Transform preview data to TransactionCreate schema expected by backend
            const transactionsToSave = previewData.map(t => ({
                amount: t.amount,
                description: t.description,
                date: t.date,
                type: t.type,
                category_id: t.category_id,
                status: 'paid', // Imported transactions are usually past/paid
                paid_at: t.date, // Assume paid at transaction date
                payment_method: 'Credit Card', // Default assumption for Nubank CSV usually
                is_recurring: false
            }))

            await api.post('/imports/confirm', transactionsToSave)

            toast.success(`${transactionsToSave.length} transações importadas com sucesso!`)
            onImportSuccess()
            onOpenChange(false)

            // Reset state
            setTimeout(() => {
                setStep('upload')
                setFile(null)
                setPreviewData([])
            }, 500)

        } catch (error: any) {
            console.error("Erro ao salvar", error)
            toast.error("Erro ao salvar transações.")
            setStep('preview')
        } finally {
            setLoading(false)
        }
    }

    const totals = previewData.reduce((acc, curr) => {
        if (curr.type === 'income') acc.income += curr.amount
        else acc.expense += Math.abs(curr.amount)
        return acc
    }, { income: 0, expense: 0 })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Importar Transações (Nubank)</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-1 flex flex-col">
                    {step === 'upload' && (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg border-muted-foreground/25 bg-muted/50 gap-4">
                            <Upload className="w-10 h-10 text-muted-foreground" />
                            <div className="text-center space-y-2">
                                <p className="text-sm font-medium">Arraste seu arquivo CSV ou clique para selecionar</p>
                                <p className="text-xs text-muted-foreground">Formato suportado: CSV (Nubank)</p>
                            </div>
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />
                            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                Selecionar Arquivo
                            </Button>
                            {file && (
                                <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-1 rounded-full mt-2">
                                    <FileText className="w-4 h-4" />
                                    {file.name}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="flex-1 flex flex-col gap-4 min-h-0">
                            <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Total Receitas</p>
                                    <p className="text-lg font-bold text-emerald-500">
                                        {totals.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Total Despesas</p>
                                    <p className="text-lg font-bold text-rose-500">
                                        {totals.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Transações</p>
                                    <p className="text-lg font-bold">{previewData.length}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto min-h-0 border rounded-md shadow-sm">
                                <table className="w-full text-sm relative">
                                    <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-3 text-left font-medium">Data</th>
                                            <th className="p-3 text-left font-medium">Descrição</th>
                                            <th className="p-3 text-left font-medium">Categoria</th>
                                            <th className="p-3 text-right font-medium">Valor</th>
                                            <th className="p-3 text-center font-medium w-[50px]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {previewData.map((t, i) => (
                                            <tr key={i} className="hover:bg-muted/50">
                                                <td className="p-3 whitespace-nowrap text-muted-foreground">
                                                    {format(new Date(t.date), 'dd/MM/yyyy')}
                                                </td>
                                                <td className="p-3 max-w-[200px] truncate" title={t.description}>
                                                    {t.description}
                                                </td>
                                                <td className="p-3">
                                                    <Select
                                                        value={t.category_id?.toString() || 'unknown'}
                                                        onValueChange={(val) => updateCategory(i, val)}
                                                    >
                                                        <SelectTrigger className="h-8 w-[160px]">
                                                            <SelectValue placeholder="Selecione..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {categories.map(c => (
                                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                                                                        {c.name}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                            {!t.category_id && <SelectItem value="unknown" disabled>Selecione...</SelectItem>}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className={`p-3 text-right font-medium ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(i)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Salvando transações...</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4">
                    {step === 'upload' && (
                        <Button
                            onClick={handleUpload}
                            disabled={!file || loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Visualizar Importação
                        </Button>
                    )}
                    {step === 'preview' && (
                        <>
                            <Button variant="ghost" onClick={() => setStep('upload')} disabled={loading}>
                                Voltar
                            </Button>
                            <Button onClick={handleConfirmImport} disabled={loading}>
                                <Check className="w-4 h-4 mr-2" />
                                Confirmar Importação
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
