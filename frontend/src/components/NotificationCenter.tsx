import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Info, UserPlus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Notification {
    id: number;
    content: string;
    type: string;
    link_id?: number;
    read: boolean;
    created_at: string;
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications/');
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRespondInvite = async (notif: Notification, accept: boolean) => {
        try {
            await api.post(`/workspaces/${notif.link_id}/invite/respond`, { accept });
            await api.post(`/notifications/${notif.id}/read`);
            toast.success(accept ? 'Convite aceito!' : 'Convite recusado');
            fetchNotifications();
            // Optional: Refresh page/workspaces if needed, but standard is just notifying.
            // In a real app, you might trigger a workspace refresh in the global store.
            window.location.reload(); // Quickest way to sync workspaces
        } catch (error) {
            toast.error('Erro ao processar convite');
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleClearAll = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications([]);
            setIsOpen(false);
        } catch (error) {
            toast.error('Erro ao limpar notificações');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'invite': return <UserPlus className="w-4 h-4 text-blue-500" />;
            case 'alert': return <AlertCircle className="w-4 h-4 text-amber-500" />;
            default: return <Info className="w-4 h-4 text-slate-400" />;
        }
    };

    const unreadCount = notifications.length;

    return (
        <div className="relative" ref={containerRef}>
            <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full hover:bg-muted"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background">
                        {unreadCount}
                    </span>
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-3 w-80 bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl overflow-hidden z-[100]"
                    >
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="font-bold text-sm">Notificações</h3>
                            {notifications.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                                >
                                    Limpar tudo
                                </button>
                            )}
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center space-y-2">
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                                        <Bell className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">Tudo limpo por aqui!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {notifications.map((n) => (
                                        <div key={n.id} className="p-4 hover:bg-muted/30 transition-colors space-y-3">
                                            <div className="flex gap-3">
                                                <div className="mt-0.5">{getIcon(n.type)}</div>
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-sm leading-relaxed">{n.content}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {new Date(n.created_at).toLocaleString('pt-BR', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            {n.type === 'invite' ? (
                                                <div className="flex gap-2 pl-7">
                                                    <Button
                                                        size="sm"
                                                        className="h-8 flex-1 bg-blue-600 hover:bg-blue-700 text-xs font-bold"
                                                        onClick={() => handleRespondInvite(n, true)}
                                                    >
                                                        <Check className="w-3 h-3 mr-1" /> Aceitar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 flex-1 text-xs font-bold border-red-200 text-red-600 hover:bg-red-50"
                                                        onClick={() => handleRespondInvite(n, false)}
                                                    >
                                                        <X className="w-3 h-3 mr-1" /> Recusar
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end pl-7">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                                                        onClick={() => handleMarkAsRead(n.id)}
                                                    >
                                                        Marcar como lida
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
