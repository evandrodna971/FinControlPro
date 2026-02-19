import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import * as Icons from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// List of popular icons with search terms in Portuguese
const ICONS_DATA = [
    { name: "Home", terms: "casa lar moradia residencia" },
    { name: "Car", terms: "carro veiculo automovel transporte" },
    { name: "ShoppingCart", terms: "carrinho compras mercado shopping" },
    { name: "Utensils", terms: "talheres garfo faca comida restaurante" },
    { name: "CreditCard", terms: "cartao cartāo credito debito" },
    { name: "Banknote", terms: "dinheiro nota cedula saque" },
    { name: "Briefcase", terms: "maleta trabalho escritorio negocio" },
    { name: "Plane", terms: "aviao viagem turismo ferias voo" },
    { name: "Gift", terms: "presente aniversario natal" },
    { name: "Heart", terms: "coracao saude amor vida" },
    { name: "Music", terms: "musica som show audio" },
    { name: "Smartphone", terms: "celular telefone iphone android" },
    { name: "Wifi", terms: "internet rede conexao wifi" },
    { name: "Zap", terms: "energia raio eletricidade luz" },
    { name: "Droplet", terms: "agua gota hidraulica conta" },
    { name: "Book", terms: "livro estudo educacao escola leitura" },
    { name: "GraduationCap", terms: "formatura faculdade curso univerdade" },
    { name: "Dumbbell", terms: "academia peso exercicio treino fitness" },
    { name: "Stethoscope", terms: "medico saude hospital consulta clinica" },
    { name: "Pill", terms: "remedio medicamento farmacia saude" },
    { name: "Gamepad2", terms: "game jogo videogame diversao playstation xbox" },
    { name: "Tv", terms: "televisao tv streaming assinatura filme" },
    { name: "Shirt", terms: "camisa roupa vestuario moda" },
    { name: "Scissors", terms: "tesoura cabeleireiro corte" },
    { name: "Wrench", terms: "chave ferramenta reparo mecanica oficina" },
    { name: "Hammer", terms: "martelo obra reforma construcao" },
    { name: "Construction", terms: "construcao obra capacete engenharia" },
    { name: "Dog", terms: "cachorro cao pet animal estimacao" },
    { name: "Cat", terms: "gato pet animal felino" },
    { name: "Baby", terms: "bebe crianca filho maternidade" },
    { name: "Coffee", terms: "cafe padaria lanche cafeteira" },
    { name: "Beer", terms: "cerveja bebida bar festa happy hour" },
    { name: "Pizza", terms: "pizza lanche comida delivery" },
    { name: "Burger", terms: "hamburguer lanche fastfood" },
    { name: "Apple", terms: "maca fruta feira mercado saudavel" },
    { name: "Banana", terms: "banana fruta feira mercado" },
    { name: "IceCream", terms: "sorvete sobremesa doce gelado" },
    { name: "Cake", terms: "bolo festa aniversario doce confeitaria" },
    { name: "Clapperboard", terms: "cinema filme entreterimento video" },
    { name: "Ticket", terms: "ingresso entrada show teatro cinema evento" },
    { name: "MapPin", terms: "local mapa gps viagem endereco" },
    { name: "Flag", terms: "bandeira meta objetivo pais" },
    { name: "Thermometer", terms: "termometro temperatura febre clima" },
    { name: "Sun", terms: "sol verao dia praia calor" },
    { name: "Moon", terms: "lua noite dormir sono" },
    { name: "Umbrella", terms: "guarda-chuva chuva inverno protecao" },
    { name: "Cloud", terms: "nuvem clima tempo ceu" },
    { name: "Star", terms: "estrela favorito destaque premio" },
    { name: "Circle", terms: "circulo bolinha redonda" },
    { name: "Square", terms: "quadrado box" },
    { name: "Triangle", terms: "triangulo alerta" },
    { name: "Hexagon", terms: "hexagono" }
]

interface IconSelectorProps {
    value: string
    onChange: (icon: string) => void
}

export function IconSelector({ value, onChange }: IconSelectorProps) {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Get the icon component dynamically
    const SelectedIcon = (Icons as any)[value] || Icons.Circle

    // Filter icons based on search
    const filteredIcons = ICONS_DATA.filter(icon =>
        icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        icon.terms.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                onClick={() => setOpen(!open)}
                type="button"
            >
                <div className="flex items-center gap-2">
                    <SelectedIcon className="h-4 w-4" />
                    <span>{value || "Selecione um ícone"}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>

            {open && (
                <div className="absolute top-full left-0 z-[100] w-full mt-2 rounded-md border border-slate-800 bg-slate-950 text-slate-50 shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                    <div className="p-2 border-b">
                        <div className="flex items-center px-2 border rounded-md">
                            <Search className="h-4 w-4 mr-2 opacity-50" />
                            <Input
                                placeholder="Buscar ícone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-0 focus-visible:ring-0 h-8"
                            />
                        </div>
                    </div>
                    <ScrollArea className="h-[200px]">
                        <div className="grid grid-cols-5 p-2 gap-2">
                            {filteredIcons.map((icon) => {
                                const IconComponent = (Icons as any)[icon.name]
                                if (!IconComponent) return null

                                return (
                                    <Button
                                        key={icon.name}
                                        variant="ghost"
                                        className={cn(
                                            "h-10 w-10 p-0 flex items-center justify-center hover:bg-muted",
                                            value === icon.name && "bg-primary/20 text-primary border border-primary/50"
                                        )}
                                        onClick={() => {
                                            onChange(icon.name)
                                            setOpen(false)
                                        }}
                                        title={icon.name}
                                        type="button"
                                    >
                                        <IconComponent className="h-5 w-5" />
                                    </Button>
                                )
                            })}
                            {filteredIcons.length === 0 && (
                                <div className="col-span-5 text-center text-sm text-muted-foreground p-4">
                                    Nenhum ícone encontrado.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    )
}
