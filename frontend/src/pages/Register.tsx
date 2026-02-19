import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

export default function Register() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email)
        }
    }, [location.state])

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email) return 'E-mail é obrigatório'
        if (!re.test(email)) return 'Formato de e-mail inválido'
        return ''
    }

    const passwordRequirements = [
        { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
        { label: 'Uma letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
        { label: 'Um número', test: (p: string) => /[0-9]/.test(p) },
    ]

    const getPasswordErrors = (p: string) => {
        return passwordRequirements.filter(req => !req.test(p))
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setEmail(val)
        setErrors(prev => ({ ...prev, email: validateEmail(val) }))
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setPassword(val)
        const failed = getPasswordErrors(val)
        setErrors(prev => ({ ...prev, password: failed.length > 0 ? 'Senha fraca' : '' }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const emailErr = validateEmail(email)
        const passFailed = getPasswordErrors(password)

        if (emailErr || passFailed.length > 0) {
            toast.error('Por favor, corrija os erros no formulário')
            return
        }

        setError('')
        setLoading(true)
        try {
            await api.post('/register', {
                email,
                password,
                full_name: fullName
            })
            toast.success('Conta criada com sucesso! Faça login para continuar.')
            navigate('/login')
        } catch (err: any) {
            const detail = err.response?.data?.detail || 'Erro ao criar conta. Tente novamente.'
            setError(detail)
            toast.error(detail)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Criar conta</CardTitle>
                    <CardDescription>
                        Preencha os dados abaixo para começar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nome Completo</Label>
                            <Input
                                id="fullName"
                                placeholder="João Silva"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@exemplo.com"
                                value={email}
                                onChange={handleEmailChange}
                                required
                                className={errors.email ? "border-destructive" : ""}
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    required
                                    className={errors.password ? "border-destructive" : ""}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-1 pt-1">
                                {passwordRequirements.map((req, i) => {
                                    const isOk = req.test(password)
                                    return (
                                        <div key={i} className={`flex items-center text-xs ${isOk ? 'text-green-600' : 'text-muted-foreground'}`}>
                                            {isOk ? <Check size={12} className="mr-1" /> : <X size={12} className="mr-1" />}
                                            {req.label}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Spinner className="mr-2" />
                                    Criando conta...
                                </>
                            ) : "Registrar"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t p-6 mt-4">
                    <div className="text-sm text-center text-muted-foreground">
                        Já tem uma conta?{" "}
                        <Link to="/login" className="text-primary hover:underline">
                            Entrar
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
