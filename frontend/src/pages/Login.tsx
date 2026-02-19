import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [isCheckingEmail, setIsCheckingEmail] = useState(false)
    const [step, setStep] = useState<1 | 2>(1) // 1: Email, 2: Password
    const [rememberMe, setRememberMe] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [emailError, setEmailError] = useState('')
    const { login, checkEmail } = useAuthStore()
    const navigate = useNavigate()

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email) return 'E-mail é obrigatório'
        if (!re.test(email)) return 'Formato de e-mail inválido'
        return ''
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setEmail(val)
        if (step === 2) {
            // If user changes email after verified, reset to step 1
            setStep(1)
            setPassword('')
        }
        setEmailError(validateEmail(val))
    }

    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        const savedEmail = localStorage.getItem('user_email')

        if (token) {
            setRememberMe(true)
            if (savedEmail) {
                setEmail(savedEmail)
            }
        }
    }, [])

    const handleEmailCheck = async () => {
        const emailErr = validateEmail(email)
        if (emailErr) {
            setEmailError(emailErr)
            toast.error(emailErr)
            return
        }

        setError('')
        setIsCheckingEmail(true)
        try {
            const result = await checkEmail(email)
            if (result.exists) {
                setStep(2)
                toast.success(`Olá ${result.message ? '' : 'novamente'}!`)
            } else {
                toast.info("E-mail não encontrado. Redirecionando para cadastro...")
                setTimeout(() => {
                    navigate('/register', { state: { email } })
                }, 1500)
            }
        } catch (err: any) {
            console.error(err)
            toast.error("Erro ao verificar e-mail. Tente novamente.")
        } finally {
            setIsCheckingEmail(false)
        }
    }

    const handleLogin = async () => {
        setError('')
        setLoading(true)
        try {
            await login(email, password, rememberMe)
            toast.success('Login realizado com sucesso!')
            navigate('/dashboard')
        } catch (err: any) {
            const detail = err.response?.data?.detail || 'Senha inválida'
            setError(detail)
            toast.error(detail)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (step === 1) {
            await handleEmailCheck()
        } else {
            await handleLogin()
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Entrar</CardTitle>
                    <CardDescription>
                        {step === 1
                            ? "Digite seu e-mail para continuar"
                            : `Olá, ${email}. Digite sua senha.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nome@exemplo.com"
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                    disabled={step === 2 && loading} // Disable if logging in, but allow edit if just in step 2 (logic handled in change)
                                    className={emailError ? "border-destructive" : ""}
                                />
                                {step === 2 && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                        <Check size={20} />
                                    </div>
                                )}
                            </div>
                            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                        </div>

                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Senha</Label>
                                        <Link to="/forgot-password" tabIndex={-1} className="text-xs text-primary hover:underline">
                                            Esqueci minha senha
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoFocus
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="rememberMe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Lembrar meus dados
                                    </Label>
                                </div>
                            </div>
                        )}

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button type="submit" className="w-full" disabled={loading || isCheckingEmail}>
                            {step === 1 ? (
                                isCheckingEmail ? (
                                    <>
                                        <Spinner className="mr-2" />
                                        Verificando...
                                    </>
                                ) : (
                                    <>
                                        Continuar
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )
                            ) : (
                                loading ? (
                                    <>
                                        <Spinner className="mr-2" />
                                        Entrando...
                                    </>
                                ) : "Entrar"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t p-6 mt-4">
                    <div className="text-sm text-center text-muted-foreground">
                        Não tem uma conta?{" "}
                        <Link to="/register" className="text-primary hover:underline">
                            Cadastre-se
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
