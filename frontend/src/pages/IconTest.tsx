import * as Icons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Same icon list from IconSelector
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
];

// Test function (same as timeline)
const getIconComponent = (iconName?: string): React.ComponentType<any> => {
    if (!iconName) return Icons.HelpCircle;
    // @ts-ignore
    const IconComponent = Icons[iconName as keyof typeof Icons];
    return (typeof IconComponent === 'function' ? IconComponent : Icons.HelpCircle) as React.ComponentType<any>;
};

export default function IconTest() {
    const testResults = ICONS_DATA.map(icon => {
        const IconComponent = getIconComponent(icon.name);
        const isValid = IconComponent !== Icons.HelpCircle;
        return { ...icon, IconComponent, isValid };
    });

    const validCount = testResults.filter(r => r.isValid).length;
    const invalidCount = testResults.filter(r => !r.isValid).length;

    return (
        <div className="p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Teste de Ícones - IconSelector</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex gap-4 text-sm">
                            <div className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                                ✓ Válidos: {validCount}
                            </div>
                            <div className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg">
                                ✗ Inválidos: {invalidCount}
                            </div>
                            <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg">
                                Total: {ICONS_DATA.length}
                            </div>
                        </div>

                        <div className="grid grid-cols-6 md:grid-cols-10 gap-3">
                            {testResults.map((result) => (
                                <div
                                    key={result.name}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border ${result.isValid
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : 'bg-red-500/10 border-red-500/30'
                                        }`}
                                    title={result.name}
                                >
                                    <result.IconComponent className="w-6 h-6" />
                                    <span className="text-[10px] text-center truncate w-full">
                                        {result.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Teste de Cores Dinâmicas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                            <div key={color} className="flex flex-col gap-2">
                                <div
                                    className="w-full h-20 rounded-xl flex items-center justify-center text-white shadow-lg"
                                    style={{ backgroundColor: color }}
                                >
                                    <Icons.ShoppingCart className="w-8 h-8" />
                                </div>
                                <span className="text-xs text-center text-muted-foreground">{color}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
