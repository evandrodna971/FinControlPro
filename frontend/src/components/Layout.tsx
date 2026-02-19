import { ModernHeader } from './ModernHeader'
import { Sidebar } from './Sidebar'
import { useLocation } from 'react-router-dom'
import { useState } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const showNavigation = location.pathname !== '/onboarding' && location.pathname !== '/login' && location.pathname !== '/register'

    if (!showNavigation) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <main className="flex-1">
                    {children}
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <ModernHeader />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/10">
                    <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
