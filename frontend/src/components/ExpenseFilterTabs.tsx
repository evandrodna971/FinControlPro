import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Users, Heart } from "lucide-react"

interface ExpenseFilterTabsProps {
    activeFilter: string
    onFilterChange: (filter: string) => void
}

export function ExpenseFilterTabs({ activeFilter, onFilterChange }: ExpenseFilterTabsProps) {
    return (
        <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Todos</span>
                </TabsTrigger>
                <TabsTrigger value="mine" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Meus</span>
                </TabsTrigger>
                <TabsTrigger value="partner" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Parceiro</span>
                </TabsTrigger>
                <TabsTrigger value="joint" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Conjuntos</span>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
