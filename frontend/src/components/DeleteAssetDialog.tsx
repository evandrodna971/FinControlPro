import { useState } from 'react'
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
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

interface DeleteAssetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    assetId: number | null
    assetSymbol: string | null
    onAssetDeleted: () => void
}

export function DeleteAssetDialog({
    open,
    onOpenChange,
    assetId,
    assetSymbol,
    onAssetDeleted
}: DeleteAssetDialogProps) {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!assetId) return

        setLoading(true)
        try {
            await api.delete(`/investments/assets/${assetId}`)
            toast.success(`Ativo ${assetSymbol} removido com sucesso!`)
            onOpenChange(false)
            onAssetDeleted()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao remover ativo. Verifique se existem transações vinculadas.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertDialogTitle>Excluir Ativo</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        Tem certeza que deseja remover <strong>{assetSymbol}</strong> da sua carteira?
                        Esta ação excluirá permanentemente o ativo e todo o seu histórico de transações.
                        Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={loading}
                    >
                        {loading ? 'Excluindo...' : 'Excluir Ativo'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
