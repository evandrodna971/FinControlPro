import React, { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CategorySelect } from '@/components/CategorySelect'
import { TagInput } from '@/components/TagInput'
import { LocationInput } from '@/components/LocationInput'
import { TransactionTypeToggle } from '@/components/TransactionTypeToggle'
import { CurrencyInput } from '@/components/CurrencyInput'
import { DatePicker } from '@/components/DatePicker'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTransactionStore } from '@/store/useTransactionStore'
import { TransactionPreview } from '@/components/TransactionPreview'
import { useDebounce } from '@/hooks/useDebounce'
import { useTransactionSubmit } from '@/hooks/useTransactionSubmit'
import { RecurrencePeriod, TransactionType, TransactionStatus } from '@/types/transaction'



export default function AddTransaction() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const editId = searchParams.get('id')

    // Form State
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [type, setType] = useState<TransactionType>("expense")
    const [categoryId, setCategoryId] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("Cartão de Crédito")
    const [tags, setTags] = useState<string[]>([])
    const [location, setLocation] = useState("")

    // Smart Data derived from history
    const [recentTags, setRecentTags] = useState<string[]>([])
    const [recentLocations, setRecentLocations] = useState<string[]>([])

    const [status, setStatus] = useState<TransactionStatus>("paid")

    // Recurrence & Installments
    const [isRecurring, setIsRecurring] = useState(false)
    const [recurrencePeriod, setRecurrencePeriod] = useState<RecurrencePeriod>("monthly")
    const [isInstallment, setIsInstallment] = useState(false)
    const [installmentCount, setInstallmentCount] = useState("2")

    // Validation & Loading State
    const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

    const { submit, isSubmitting } = useTransactionSubmit({ editId })

    const updateField = useTransactionStore(state => state.updateField)
    const resetStore = useTransactionStore(state => state.reset)

    // Debounced values for performance
    const debouncedDescription = useDebounce(description, 300)
    const debouncedTags = useDebounce(tags, 300)
    const debouncedLocation = useDebounce(location, 300)

    // Sync debounced fields to store
    useEffect(() => {
        updateField('description', debouncedDescription)
    }, [debouncedDescription, updateField])

    useEffect(() => {
        updateField('tags', debouncedTags)
    }, [debouncedTags, updateField])

    useEffect(() => {
        updateField('location', debouncedLocation)
    }, [debouncedLocation, updateField])

    // Immediate updates for critical fields
    useEffect(() => {
        updateField('amount', amount)
    }, [amount, updateField])

    useEffect(() => {
        updateField('type', type)
    }, [type, updateField])

    useEffect(() => {
        updateField('date', date)
    }, [date, updateField])

    useEffect(() => {
        updateField('status', status)
    }, [status, updateField])

    useEffect(() => {
        updateField('categoryId', categoryId)
        // updateField('categoryName', ...) -> We don't have categories array anymore to look up name immediately without extra fetch or prop.
        // For now, we can omit categoryName sync or handle it differently.
        // The store requires categoryName? 
    }, [categoryId, updateField])

    useEffect(() => {
        updateField('paymentMethod', paymentMethod)
    }, [paymentMethod, updateField])

    useEffect(() => {
        updateField('isInstallment', isInstallment)
        updateField('installmentCount', installmentCount)
    }, [isInstallment, installmentCount, updateField])

    useEffect(() => {
        updateField('isRecurring', isRecurring)
        updateField('recurrencePeriod', recurrencePeriod)
    }, [isRecurring, recurrencePeriod, updateField])

    // Reset store on unmount
    useEffect(() => {
        return () => resetStore()
    }, [resetStore])

    useEffect(() => {
        if (editId) {
            api.get(`/transactions/${editId}`).then(res => {
                const t = res.data
                setAmount(t.amount.toString())
                setDescription(t.description)
                setDate(t.date.split('T')[0])
                setType(t.type)
                setCategoryId(t.category_id ? t.category_id.toString() : "")
                setPaymentMethod(t.payment_method || "Cartão de Crédito")
                setTags(t.tags ? t.tags.split(',').map((s: string) => s.trim()) : [])
                setLocation(t.location || "")
                setIsRecurring(t.is_recurring)
                setRecurrencePeriod(t.recurrence_period as RecurrencePeriod || "monthly")
                setIsInstallment(t.installment_count > 1)
                setInstallmentCount(t.installment_count.toString())
                setStatus(t.status || "paid")

                // Sync initial edit state to store
                updateField('amount', t.amount.toString())
                updateField('description', t.description)
                updateField('type', t.type)
                updateField('status', t.status || "paid")
                updateField('categoryId', t.category_id ? t.category_id.toString() : "")
            }).catch(err => {
                console.error("Erro ao carregar transação", err)
                toast.error("Erro ao carregar transação para edição.")
                navigate('/transactions')
            })
        }
    }, [editId, navigate, updateField])

    useEffect(() => {
        // Fetch recent transactions for autocomplete and shortcuts
        api.get('/transactions/?limit=100').then(res => {
            const data = res.data

            // Description suggestions
            const descs = data.map((t: any) => t.description)
            setSuggestions(Array.from(new Set(descs)) as string[])

            // Tags suggestions
            const allTags = data.flatMap((t: any) => t.tags ? t.tags.split(',') : [])
            const uniqueTags = Array.from(new Set(allTags.map((t: string) => t.trim()))) as string[]
            setRecentTags(uniqueTags)

            // Location suggestions
            const locs = data.map((t: any) => t.location).filter((l: any) => l)
            setRecentLocations(Array.from(new Set(locs)) as string[])



        }).catch(err => console.error("Error fetching suggestions", err))
    }, [])

    // Real-time Validation Logic
    useEffect(() => {
        const newErrors: { [key: string]: string } = {}

        if (touched.amount || amount) {
            const numAmount = parseFloat(amount.replace(/[^\d,]/g, '').replace(',', '.'))
            if (!amount || isNaN(numAmount) || numAmount <= 0) {
                newErrors.amount = "Valor é obrigatório e deve ser maior que zero"
            }
        }

        if (touched.description || description) {
            if (!description.trim()) {
                newErrors.description = "Descrição é obrigatória"
            }
        }

        setErrors(newErrors)
    }, [amount, description, touched])

    // formatCurrency and handleAmountChange replaced by CurrencyInput logic

    // handleCreateCategory removed (handled by CategorySelect)

    const handleBlur = (field: string) => {
        setTouched({ ...touched, [field]: true })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Final validation check
        // amount from CurrencyInput might be "123.45" or "123,45" depending on implementation.
        // react-currency-input-field usually returns "123,45" with comma as decimal separator if configured.
        // My wrapper has `decimalSeparator=","`.

        let safeAmount = amount;
        if (amount && amount.includes(',')) {
            safeAmount = amount.replace('.', '').replace(',', '.');
        }

        const parsedAmount = parseFloat(safeAmount);

        if (!amount || isNaN(parsedAmount) || parsedAmount <= 0 || !description.trim()) {
            setTouched({ amount: true, description: true })
            toast.error("Por favor, preencha todos os campos obrigatórios.")
            return
        }

        const payload = {
            amount: parsedAmount,
            description,
            date: new Date(date).toISOString(),
            type: type as TransactionType,
            category_id: categoryId ? parseInt(categoryId) : null,
            payment_method: paymentMethod,
            tags: tags.join(', '),
            location: location,
            is_recurring: isRecurring,
            recurrence_period: isRecurring ? (recurrencePeriod as RecurrencePeriod) : null,
            installment_count: isInstallment ? parseInt(installmentCount) : 1,
            status: status as any, // Zod will validate
            due_date: status === 'pending' ? new Date(date).toISOString() : null,
            paid_at: status === 'paid' ? new Date(date).toISOString() : null
        }

        submit(payload)
    }

    // const filteredCategories removed

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">{editId ? 'Editar Transação' : 'Nova Transação'}</h1>
                <Link to="/transactions">
                    <Button variant="ghost">Voltar</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUNA ESQUERDA - FORMULÁRIO */}
                <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

                    {/* CARTÃO 1: INFORMAÇÕES BÁSICAS */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="bg-primary/10 p-2 rounded-full text-primary">💰</span>
                                Informações Básicas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Tipo de Transação</Label>
                                    </div>
                                    <TransactionTypeToggle
                                        value={type}
                                        onValueChange={(val) => !editId && setType(val)}
                                        disabled={!!editId}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="amount">💰 Valor (obrigatório)</Label>
                                        {touched.amount && !errors.amount && <Check className="h-4 w-4 text-green-500" />}
                                    </div>
                                    <CurrencyInput
                                        value={amount}
                                        onValueChange={(val) => {
                                            setAmount(val || "");
                                            setTouched({ ...touched, amount: true })
                                        }}
                                        error={errors.amount}
                                        touched={touched.amount}
                                        type={type}
                                    />
                                    {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <div className="flex justify-between">
                                    <Label htmlFor="description">Descrição</Label>
                                    <div className="flex items-center gap-2">
                                        {touched.description && !errors.description && <Check className="h-4 w-4 text-green-500" />}
                                        <span className="text-xs text-muted-foreground">{description.length}/100</span>
                                    </div>
                                </div>
                                <Input
                                    id="description"
                                    value={description}
                                    onChange={e => setDescription(e.target.value.slice(0, 100))}
                                    onBlur={() => {
                                        handleBlur('description');
                                        // Delay to allow onMouseDown to execute first
                                        setTimeout(() => setShowSuggestions(false), 200);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Ex: Compras no mercado, Salário..."
                                    autoComplete="off"
                                    className={cn(
                                        errors.description ? "border-red-500 focus-visible:ring-red-500" : (touched.description ? "border-green-500 focus-visible:ring-green-500" : "")
                                    )}
                                />
                                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}

                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full bg-background border rounded-md shadow-md mt-1 max-h-[200px] overflow-auto">
                                        {suggestions
                                            .filter(s => s.toLowerCase().includes(description.toLowerCase()))
                                            .slice(0, 5)
                                            .map((s, i) => (
                                                <div
                                                    key={i}
                                                    className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                                                    onMouseDown={() => {
                                                        setDescription(s);
                                                        setShowSuggestions(false);
                                                    }}
                                                >
                                                    {s}
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* CARTÃO 2: STATUS E DATA */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="bg-primary/10 p-2 rounded-full text-primary">📅</span>
                                Status e Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Status Atual</Label>
                                    <div className="flex p-1 bg-muted rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setStatus('paid')}
                                            className={cn(
                                                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                                status === 'paid' ? "bg-background shadow-sm text-green-600" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {type === 'expense' ? 'Pago' : 'Recebido'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStatus('pending')}
                                            className={cn(
                                                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                                status === 'pending' ? "bg-background shadow-sm text-yellow-600" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Pendente
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <DatePicker
                                        value={date}
                                        onValueChange={setDate}
                                        label={status === 'pending' ? 'Data de Vencimento' : 'Data do Pagamento'}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CARTÃO 3: CATEGORIZAÇÃO */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="bg-primary/10 p-2 rounded-full text-primary">🏷️</span>
                                Categorização
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Categoria</Label>
                                    <CategorySelect
                                        value={categoryId}
                                        onValueChange={setCategoryId}
                                        type={type}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                                    <select
                                        id="paymentMethod"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={paymentMethod}
                                        onChange={e => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                                        <option value="Cartão de Débito">Cartão de Débito</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Pix">Pix</option>
                                        <option value="Transferência Bancária">Transferência Bancária</option>
                                        <option value="Boleto">Boleto</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Tags (Opcional)</Label>
                                    <TagInput
                                        value={tags}
                                        onChange={setTags}
                                        suggestions={recentTags}
                                        placeholder="Adicionar tag..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Localização (Opcional)</Label>
                                    <LocationInput
                                        value={location}
                                        onChange={setLocation}
                                        suggestions={recentLocations}
                                        placeholder="Onde foi?"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CARTÃO 4: OPÇÕES AVANÇADAS (Apenas Inserção) */}
                    {!editId && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                    Opções Avançadas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* RECORRÊNCIA */}
                                <div className="flex flex-col space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="recurring"
                                            checked={isRecurring}
                                            onChange={e => {
                                                setIsRecurring(e.target.checked);
                                                if (e.target.checked) setIsInstallment(false);
                                            }}
                                            className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="recurring" className="font-medium">Repetir esta transação</Label>
                                    </div>

                                    {isRecurring && (
                                        <div className="pl-6 ml-2 border-l-2 border-primary/20">
                                            <Label htmlFor="frequency" className="text-xs uppercase text-muted-foreground mb-1.5 block">Frequência</Label>
                                            <select
                                                id="frequency"
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm max-w-[200px]"
                                                value={recurrencePeriod}
                                                onChange={e => setRecurrencePeriod(e.target.value as RecurrencePeriod)}
                                            >
                                                <option value="daily">Diário</option>
                                                <option value="weekly">Semanal</option>
                                                <option value="monthly">Mensal</option>
                                                <option value="yearly">Anual</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-border/50" />

                                {/* PARCELAMENTO */}
                                <div className="flex flex-col space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="installment"
                                            checked={isInstallment}
                                            onChange={e => {
                                                setIsInstallment(e.target.checked);
                                                if (e.target.checked) setIsRecurring(false);
                                            }}
                                            className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="installment" className="font-medium">Parcelar despesa</Label>
                                    </div>

                                    {isInstallment && (
                                        <div className="pl-6 ml-2 border-l-2 border-primary/20 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-sm">Número de Parcelas: <span className="font-bold text-primary text-lg ml-1">{installmentCount}x</span></Label>
                                                <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                                    {amount && !isNaN(parseFloat(amount.replace(/\./g, '').replace(',', '.')))
                                                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                            (parseFloat(amount.replace(/\./g, '').replace(',', '.')) / parseInt(installmentCount))
                                                        ) + ' / mês'
                                                        : 'R$ 0,00 / mês'}
                                                </span>
                                            </div>
                                            <Slider
                                                value={[parseInt(installmentCount)]}
                                                min={2}
                                                max={48}
                                                step={1}
                                                onValueChange={(vals) => setInstallmentCount(vals[0].toString())}
                                                className="py-2"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                                                <span>2x</span>
                                                <span>24x</span>
                                                <span>48x</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* BOTÕES DE AÇÃO */}
                    <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t lg:border-none lg:static lg:bg-transparent lg:p-0 z-10">
                        <Link to="/transactions">
                            <Button variant="outline" type="button" disabled={isSubmitting} className="h-11 px-8">Cancelar</Button>
                        </Link>
                        <Button type="submit" className="h-11 px-8 min-w-[160px]" disabled={isSubmitting || !!errors.amount || !!errors.description || !amount || !description}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Salvando...' : (editId ? 'Salvar Alterações' : 'Salvar Transação')}
                        </Button>
                    </div>
                </form>

                {/* COLUNA DIREITA - PREVIEW */}
                <div className="lg:col-span-1">
                    <div className="lg:sticky lg:top-8 space-y-6">
                        <TransactionPreview isSubmitting={isSubmitting} />
                    </div>
                </div>

            </div>
        </div>
    )
}
