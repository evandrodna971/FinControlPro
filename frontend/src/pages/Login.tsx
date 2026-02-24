import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { SEO } from '@/components/SEO'

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
        <div className="min-h-screen flex bg-background overflow-hidden">
            <SEO title="Entrar" description="Acesse sua conta no FinControl Pro e gerencie suas finanças." />

            {/* Left Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10 bg-background">
                <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="space-y-2">
                        <Link to="/" className="inline-flex items-center gap-2 group mb-4">
                            <div className="bg-primary p-1.5 rounded-lg">
                                <ArrowRight className="w-5 h-5 text-primary-foreground rotate-180" />
                            </div>
                            <span className="font-bold text-xl tracking-tight">FinControlPro</span>
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
                        <p className="text-muted-foreground">
                            {step === 1
                                ? "Insira seu e-mail para acessar sua conta"
                                : "A pessoa por trás do e-mail foi identificada. Agora, a senha."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold">E-mail</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={handleEmailChange}
                                        required
                                        disabled={step === 2 && loading}
                                        className={`h-12 bg-muted/50 border-none focus-visible:ring-2 px-4 rounded-xl transition-all ${emailError ? "ring-2 ring-destructive" : ""}`}
                                    />
                                    {step === 2 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 bg-background rounded-full p-0.5 shadow-sm">
                                            <Check size={16} />
                                        </div>
                                    )}
                                </div>
                                {emailError && <p className="text-xs text-destructive font-medium ml-1">{emailError}</p>}
                            </div>

                            {step === 2 && (
                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Senha</Label>
                                            <Link to="/forgot-password" tabIndex={-1} className="text-xs text-primary font-medium hover:underline">
                                                Esqueceu a senha?
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
                                                className="h-12 bg-muted/50 border-none focus-visible:ring-2 px-4 rounded-xl transition-all pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                id="rememberMe"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:text-primary-foreground"
                                            />
                                        </div>
                                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                            Lembrar meus dados
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in shake-1">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all uppercase tracking-wide"
                            disabled={loading || isCheckingEmail}
                        >
                            {step === 1 ? (
                                isCheckingEmail ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" />
                                        Validando...
                                    </>
                                ) : (
                                    <>
                                        Próximo passo
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )
                            ) : (
                                loading ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" />
                                        Entrando...
                                    </>
                                ) : "Acessar Painel"
                            )}
                        </Button>
                    </form>

                    <div className="pt-8 border-t text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Novo por aqui?{" "}
                            <Link to="/register" className="text-primary font-bold hover:underline">
                                Crie sua conta gratuita
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Illustration & Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 border-l border-border/10 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-cyan-500/20" />
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" className="text-blue-500/10" />
                    </svg>
                </div>

                {/* Main Content Area */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12 text-white">
                    <div className="relative w-full max-w-lg aspect-square mb-12 animate-in fade-in zoom-in-95 duration-1000">
                        {/* The illustration requested (Image 1 replica style) */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-purple-500/30 blur-3xl opacity-50 rounded-full" />

                        {/* Image Placeholder with high aesthetic styling */}
                        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-sm bg-white/5 flex items-center justify-center">
                            <img
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070"
                                alt="Financial Visualization"
                                className="w-full h-full object-cover opacity-80"
                            />
                            {/* Overlaying labels or floating elements to mirror the mockup's complexity */}
                            <div className="absolute top-8 left-8 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                                <TrendingUp className="w-6 h-6 text-blue-400 mb-2" />
                                <div className="text-xs font-medium text-white/70 tracking-widest uppercase">Investimentos</div>
                                <div className="text-xl font-bold">+24.5%</div>
                            </div>
                            <div className="absolute bottom-8 right-8 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-right">
                                <div className="text-xs font-medium text-white/70 tracking-widest uppercase">Segurança</div>
                                <div className="text-xl font-bold">Proteção Ativa</div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-md text-center space-y-4">
                        <h2 className="text-4xl font-extrabold leading-tight tracking-tighter">
                            Controle suas finanças com inteligência artificial.
                        </h2>
                        <p className="text-lg text-blue-100/60 leading-relaxed font-medium">
                            Organize gastos, planeje metas e invista com segurança. Tudo em um só lugar.
                        </p>
                    </div>
                </div>

                {/* Animated Light Blobs */}
                <div className="absolute top-1/4 -right-20 w-80 h-80 bg-blue-500/30 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/30 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>
        </div>
    )
}

function TrendingUp(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    )
}
