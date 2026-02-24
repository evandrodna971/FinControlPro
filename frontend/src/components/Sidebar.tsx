import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    TrendingUp,
    FileText,
    Tag,
    Menu,
    ChevronLeft,
    Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
    isCollapsed: boolean
    toggleSidebar: () => void
}

export function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
    const location = useLocation()

    // Add Settings to the sidebar list if desired, or keep only in header as planned. 
    // Plan said to keep Settings in header, but user requested sidebar menu. 
    // User request: "mantenha no topo apenas a logo/ nome do program... e na direita workspace..., nova transação, botao de configurações, notificações, sair"
    // So Settings (Configurações) stays in Header. 
    // Navigation links go to Sidebar.

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Transações', path: '/transactions', icon: FileText },
        { label: 'Categorias', path: '/categories', icon: Tag },
        { label: 'Equipe', path: '/team', icon: Users },

        { label: 'Investimentos', path: '/investments', icon: TrendingUp },
        { label: 'Configurações', path: '/workspace-settings', icon: Settings },
    ]

    return (
        <aside
            className={cn(
                "h-screen bg-card border-r transition-all duration-300 ease-in-out hidden md:flex flex-col z-40 sticky top-0",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            <div className="h-14 flex items-center justify-between px-3 border-b">
                {!isCollapsed && (
                    <span className="font-bold text-lg text-primary truncate">Menu</span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="ml-auto"
                    title={isCollapsed ? "Expandir" : "Recolher"}
                >
                    {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </Button>
            </div>

            <div className="flex-1 py-4 overflow-y-auto">
                <nav className="space-y-1 px-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    isCollapsed && "justify-center px-0"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="p-4 border-t text-xs text-muted-foreground text-center">
                {!isCollapsed && <p>&copy; 2026 FinControlPro</p>}
            </div>
        </aside>
    )
}
