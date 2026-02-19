import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthSelectorProps {
    selectedMonth: number;
    selectedYear: number;
    onMonthChange: (month: number, year: number) => void;
}

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MonthSelector({ selectedMonth, selectedYear, onMonthChange }: MonthSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [displayYear, setDisplayYear] = useState(selectedYear);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const handleMonthSelect = (month: number) => {
        onMonthChange(month, displayYear);
        setIsOpen(false);
    };

    const handleYearChange = (delta: number) => {
        setDisplayYear(prev => prev + delta);
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="gap-2 hover:bg-primary/10 min-w-[180px] justify-center"
            >
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                    {MONTHS[selectedMonth]} {selectedYear}
                </span>
            </Button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Calendar Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-4"
                        >
                            {/* Year Navigation */}
                            <div className="flex items-center justify-between mb-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleYearChange(-1)}
                                    className="h-8 w-8"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="font-bold text-lg">{displayYear}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleYearChange(1)}
                                    className="h-8 w-8"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Month Grid */}
                            <div className="grid grid-cols-3 gap-2">
                                {MONTHS.map((month, index) => {
                                    const isSelected = index === selectedMonth && displayYear === selectedYear;
                                    const isCurrent = index === currentMonth && displayYear === currentYear;

                                    return (
                                        <motion.button
                                            key={month}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleMonthSelect(index)}
                                            className={`
                                                relative px-3 py-2 rounded-lg text-sm font-medium transition-all
                                                ${isSelected
                                                    ? 'bg-primary text-primary-foreground shadow-md'
                                                    : isCurrent
                                                        ? 'bg-primary/20 text-primary border border-primary/30'
                                                        : 'hover:bg-muted text-foreground'
                                                }
                                            `}
                                        >
                                            {month.slice(0, 3)}
                                            {isCurrent && !isSelected && (
                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
