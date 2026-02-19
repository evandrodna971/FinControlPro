import * as Dialog from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { UserBadge } from "@/components/UserBadge"
import { X, Calendar, Tag } from "lucide-react"

interface ApprovalRequest {
    id: number
    transaction: {
        id: number
        description: string
        amount: number
        date: string
        category_name?: string
        type: string
    }
    requested_by: {
        id: number
        full_name: string
        display_color: string
        avatar_emoji: string
    }
    created_at: string
}

interface ApprovalDialogProps {
    approval: ApprovalRequest
    isOpen: boolean
    onClose: () => void
    onApprove: (id: number) => void
    onReject: (id: number) => void
}

export function ApprovalDialog({ approval, isOpen, onClose, onApprove, onReject }: ApprovalDialogProps) {
    const handleApprove = () => {
        onApprove(approval.id)
        onClose()
    }

    const handleReject = () => {
        onReject(approval.id)
        onClose()
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border rounded-lg shadow-lg p-6 w-full max-w-md z-50 animate-in fade-in zoom-in">
                    <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-lg font-semibold">
                            Solicitação de Aprovação
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <Button variant="ghost" size="sm">
                                <X className="h-4 w-4" />
                            </Button>
                        </Dialog.Close>
                    </div>

                    <div className="space-y-4">
                        {/* Requester */}
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Solicitado por</p>
                            <UserBadge
                                userName={approval.requested_by.full_name || 'Usuário'}
                                color={approval.requested_by.display_color}
                                emoji={approval.requested_by.avatar_emoji}
                                size="md"
                            />
                        </div>

                        {/* Transaction Details */}
                        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                            <div>
                                <p className="text-sm text-muted-foreground">Descrição</p>
                                <p className="font-medium">{approval.transaction.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Data
                                    </p>
                                    <p className="text-sm font-medium">
                                        {new Date(approval.transaction.date).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>

                                {approval.transaction.category_name && (
                                    <div>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Tag className="h-3 w-3" />
                                            Categoria
                                        </p>
                                        <p className="text-sm font-medium">{approval.transaction.category_name}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">Valor</p>
                                <p className={`text-2xl font-bold ${approval.transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                                    {approval.transaction.type === 'expense' ? '-' : '+'}R$ {approval.transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleReject}
                            >
                                Rejeitar
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleApprove}
                            >
                                Aprovar
                            </Button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
