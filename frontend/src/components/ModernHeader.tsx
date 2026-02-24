import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, User, LogOut, Settings } from 'lucide-react';
import { MonthSelector } from './MonthSelector';
import { MonthProgressBar } from './MonthProgressBar';
import { GlobalSearch } from './GlobalSearch';
import { ThemeToggle } from './ThemeToggle';
import { NotificationCenter } from './NotificationCenter';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMonth } from '@/context/MonthContext';
import { useAuthStore } from '@/store/useAuthStore';

export function ModernHeader() {
    const { logout } = useAuthStore();
    const [scrolled, setScrolled] = useState(false);
    const { selectedMonth, selectedYear, setMonthAndYear } = useMonth();

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`
                sticky top-0 w-full z-50 transition-all duration-300
                ${scrolled
                    ? 'bg-background/95 backdrop-blur-xl border-b border-border/60 shadow-lg'
                    : 'bg-background/80 backdrop-blur-md border-b border-border/30'
                }
            `}
        >
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between h-16 gap-4">
                    {/* Logo Section (Left) */}
                    <Link to="/dashboard" className="flex items-center gap-2 group shrink-0">
                        {/* Animated Icon */}
                        <motion.div
                            animate={{
                                rotate: [0, 5, -5, 0],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3,
                            }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                            <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-1.5 md:p-2 rounded-lg">
                                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </div>
                        </motion.div>

                        {/* Logo Text - Hidden on mobile */}
                        <div className="hidden sm:flex flex-col">
                            <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent leading-none">
                                FinControlPro
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                Controle Financeiro
                            </span>
                        </div>
                    </Link>

                    {/* Actions Section (Right) */}
                    <div className="flex items-center gap-1.5 md:gap-3">
                        {/* Global Search */}
                        <GlobalSearch />

                        {/* Notifications */}
                        <NotificationCenter />

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Month Selector */}
                        <MonthSelector
                            selectedMonth={selectedMonth - 1}
                            selectedYear={selectedYear}
                            onMonthChange={(month, year) => {
                                setMonthAndYear(month + 1, year);
                            }}
                        />

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <User className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem asChild>
                                    <Link to="/workspace-settings" className="flex items-center cursor-pointer">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Configurações
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Month Progress Bar */}
            <MonthProgressBar />
        </motion.header>
    );
}
