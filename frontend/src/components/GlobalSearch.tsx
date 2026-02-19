import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, Tag, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
    id: number;
    type: 'transaction' | 'category' | 'page';
    title: string;
    subtitle?: string;
    icon: any;
    path: string;
}

export function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();

    // Keyboard shortcut Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Search logic
    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        try {
            const [transactionsRes, categoriesRes] = await Promise.all([
                api.get('/transactions/', { params: { search: searchQuery, limit: 5 } }),
                api.get('/categories/', { params: { search: searchQuery } })
            ]);

            const searchResults: SearchResult[] = [];

            // Add transactions
            transactionsRes.data.forEach((t: any) => {
                searchResults.push({
                    id: t.id,
                    type: 'transaction',
                    title: t.description,
                    subtitle: `R$ ${t.amount.toFixed(2)} - ${t.category_name}`,
                    icon: FileText,
                    path: '/transactions'
                });
            });

            // Add categories
            categoriesRes.data.forEach((c: any) => {
                searchResults.push({
                    id: c.id,
                    type: 'category',
                    title: c.name,
                    subtitle: 'Categoria',
                    icon: Tag,
                    path: '/categories'
                });
            });

            // Add quick navigation
            const pages = [
                { title: 'Dashboard', path: '/dashboard', icon: TrendingUp },
                { title: 'Transações', path: '/transactions', icon: FileText },
                { title: 'Categorias', path: '/categories', icon: Tag },
            ].filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

            pages.forEach((p, idx) => {
                searchResults.push({
                    id: 1000 + idx,
                    type: 'page',
                    title: p.title,
                    subtitle: 'Navegar para',
                    icon: p.icon,
                    path: p.path
                });
            });

            setResults(searchResults);
            setSelectedIndex(0);
        } catch (error) {
            console.error('Search error:', error);
        }
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => clearTimeout(debounce);
    }, [query, performSearch]);

    const handleSelect = (result: SearchResult) => {
        navigate(result.path);
        setIsOpen(false);
        setQuery('');
    };

    const handleKeyNavigation = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            handleSelect(results[selectedIndex]);
        }
    };

    return (
        <>
            {/* Search Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
            >
                <Search className="w-4 h-4" />
                <span>Buscar...</span>
                <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-background border border-border rounded">
                    Ctrl+K
                </kbd>
            </button>

            {/* Search Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        />

                        {/* Search Dialog */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101]"
                        >
                            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                                {/* Search Input */}
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                                    <Search className="w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyNavigation}
                                        placeholder="Buscar transações, categorias..."
                                        className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-muted rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Results */}
                                <div className="max-h-96 overflow-y-auto">
                                    {results.length === 0 && query && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            Nenhum resultado encontrado
                                        </div>
                                    )}
                                    {results.length === 0 && !query && (
                                        <div className="p-8 text-center text-muted-foreground text-sm">
                                            Digite para buscar transações, categorias ou navegar rapidamente
                                        </div>
                                    )}
                                    {results.map((result, idx) => {
                                        const Icon = result.icon;
                                        return (
                                            <button
                                                key={`${result.type}-${result.id}`}
                                                onClick={() => handleSelect(result)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${idx === selectedIndex ? 'bg-muted/50' : ''
                                                    }`}
                                            >
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <Icon className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="font-medium text-sm">{result.title}</p>
                                                    {result.subtitle && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {result.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Footer */}
                                <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex gap-4">
                                        <span className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">↑↓</kbd>
                                            Navegar
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">Enter</kbd>
                                            Selecionar
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">Esc</kbd>
                                            Fechar
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
