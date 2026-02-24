import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Plus,
    TrendingUp,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNavbar() {
    const location = useLocation();

    const navItems = [
        { label: 'Início', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Extrato', path: '/transactions', icon: FileText },
        { label: 'Novo', path: '/add-transaction', icon: Plus, isPrimary: true },
        { label: 'Investir', path: '/investments', icon: TrendingUp },
        { label: 'Ajustes', path: '/workspace-settings', icon: Settings },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 h-16 px-4 flex items-center justify-around z-[60] safe-area-bottom pb-safe">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;

                if (item.isPrimary) {
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="relative -top-3"
                        >
                            <div className="bg-primary text-primary-foreground p-3 rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                                <Plus className="w-6 h-6" />
                            </div>
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 transition-colors min-w-[64px]",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <item.icon className={cn("w-5 h-5", isActive && "animate-in zoom-in-75 duration-300")} />
                        <span className="text-[10px] font-medium tracking-tight">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
