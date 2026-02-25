import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, User, Mail, Lock, ShieldCheck } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { motion, AnimatePresence } from 'framer-motion'
import { SEO } from '@/components/SEO'

export default function Login() {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<1 | 2>(1) // 1: Email, 2: Password
    const [rememberMe, setRememberMe] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [emailError, setEmailError] = useState('')
    const { login } = useAuthStore()
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

    const handleRegister = async () => {
        if (!fullName) {
            toast.error('Nome completo é obrigatório')
            return
        }
        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem')
            return
        }
        if (password.length < 8) {
            toast.error('A senha deve ter pelo menos 8 caracteres')
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
            setMode('signin')
            setStep(2)
            setPassword('')
            setConfirmPassword('')
        } catch (err: any) {
            const detail = err.response?.data?.detail || 'Erro ao criar conta. Tente novamente.'
            setError(detail)
            toast.error(detail)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (mode === 'signin') {
            await handleLogin()
        } else {
            await handleRegister()
        }
    }

    return (
        <div className="min-h-screen lg:h-screen lg:max-h-screen flex bg-slate-950 overflow-y-auto lg:overflow-hidden relative text-slate-100">
            <SEO title="Entrar" description="Acesse sua conta no FinControl Pro e gerencie suas finanças." />

            {/* Left Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 lg:p-12 relative z-10 bg-slate-950">
                <div className="w-full max-w-sm space-y-4 lg:space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 py-8 lg:py-0">
                    <div className="space-y-0.5">
                        <Link to="/" className="inline-flex items-center gap-2.5 group mb-0.5">
                            <div className="relative w-7 h-7 flex items-center justify-center bg-primary/10 rounded-lg overflow-hidden border border-primary/20">
                                <img
                                    src="/images/logo.png"
                                    alt="FinControlPro"
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                        e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/607/607156.png"
                                    }}
                                />
                            </div>
                            <span className="font-bold text-sm tracking-tight text-slate-200">FinControlPro</span>
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {mode === 'signin' ? 'Bem-vindo de volta' : 'Comece sua jornada'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {mode === 'signin'
                                ? (step === 1 ? "Insira seu e-mail para acessar sua conta" : "Agora, insira sua senha")
                                : "Crie sua conta em poucos segundos"}
                        </p>
                    </div>

                    {/* Tabs Selector */}
                    <div className="p-1 bg-slate-900 rounded-2xl flex relative overflow-hidden ring-1 ring-white/5">
                        <div
                            className={`absolute inset-y-1 w-[calc(50%-4px)] bg-primary rounded-xl shadow-md transition-all duration-300 ease-in-out ${mode === 'signin' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
                        />
                        <button
                            onClick={() => setMode('signin')}
                            className={`flex-1 py-2 text-sm font-bold relative z-10 transition-colors duration-300 ${mode === 'signin' ? 'text-primary-foreground' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Entrar
                        </button>
                        <button
                            onClick={() => setMode('signup')}
                            className={`flex-1 py-2 text-sm font-bold relative z-10 transition-colors duration-300 ${mode === 'signup' ? 'text-primary-foreground' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Cadastrar
                        </button>
                    </div>

                    <div className="flex flex-col min-h-[340px] sm:min-h-[380px]">
                        <AnimatePresence mode="wait">
                            <motion.form
                                key={mode + step}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                onSubmit={handleSubmit}
                                className="flex flex-col flex-1"
                            >
                                <div className="space-y-5 flex-1 pt-2">
                                    {mode === 'signup' && (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                            <Label htmlFor="fullName" className="text-sm font-semibold text-slate-200">Nome Completo</Label>
                                            <div className="relative">
                                                <Input
                                                    id="fullName"
                                                    placeholder="Seu nome"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    required
                                                    autoFocus={mode === 'signup'}
                                                    className="h-10 bg-slate-900/50 border-white/5 focus-visible:ring-1 focus-visible:ring-primary/50 px-4 rounded-xl transition-all placeholder:text-slate-600"
                                                />
                                                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-sm font-semibold text-slate-200">E-mail</Label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="seu@email.com"
                                                value={email}
                                                onChange={handleEmailChange}
                                                required
                                                autoFocus={mode === 'signin'}
                                                className={`h-10 bg-slate-900/50 border-white/5 focus-visible:ring-1 focus-visible:ring-primary/50 px-4 rounded-xl transition-all placeholder:text-slate-600 ${emailError ? "ring-1 ring-destructive" : ""}`}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Mail className="text-slate-500 w-4 h-4" />
                                            </div>
                                        </div>
                                        {emailError && <p className="text-[10px] text-destructive font-medium ml-1">{emailError}</p>}
                                    </div>

                                    {(mode === 'signup' || mode === 'signin') && (
                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="password" title="Senha" className="text-slate-200">Senha</Label>
                                                    {mode === 'signin' && (
                                                        <Link to="/forgot-password" tabIndex={-1} className="text-[10px] text-primary font-medium hover:underline">
                                                            Esqueceu a senha?
                                                        </Link>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        className="h-10 bg-slate-900/50 border-white/5 focus-visible:ring-1 focus-visible:ring-primary/50 px-4 rounded-xl transition-all pr-12 placeholder:text-slate-600"
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                        <Lock className="text-slate-500 w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            {mode === 'signup' && (
                                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-200">Confirmar Senha</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="confirmPassword"
                                                            type={showPassword ? "text" : "password"}
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            required
                                                            className="h-10 bg-slate-900/50 border-white/5 focus-visible:ring-1 focus-visible:ring-primary/50 px-4 rounded-xl transition-all placeholder:text-slate-600"
                                                        />
                                                        <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                                    </div>
                                                </div>
                                            )}

                                            {mode === 'signin' && (
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id="rememberMe"
                                                            checked={rememberMe}
                                                            onChange={(e) => setRememberMe(e.target.checked)}
                                                            className="peer h-3.5 w-3.5 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:text-primary-foreground"
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-400 group-hover:text-slate-100 transition-colors">
                                                        Lembrar meus dados
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 space-y-4">
                                    {error && (
                                        <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium animate-in shake-1">
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-11 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all uppercase tracking-wide"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner className="mr-2 h-4 w-4" />
                                                {mode === 'signin' ? 'Validando...' : 'Criando Conta...'}
                                            </>
                                        ) : (
                                            mode === 'signin' ? "Acessar Painel" : "Criar Minha Conta"
                                        )}
                                    </Button>
                                </div>
                            </motion.form>
                        </AnimatePresence>
                    </div>

                    <div className="pt-4 border-t text-center space-y-2">
                        <p className="text-[10px] text-muted-foreground px-4">
                            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
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
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 text-white">
                    <div className="relative w-full max-w-md aspect-square mb-8 animate-in fade-in zoom-in-95 duration-1000">
                        {/* The illustration requested */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-teal-500/30 blur-3xl opacity-50 rounded-full" />

                        {/* Image Placeholder with high aesthetic styling */}
                        <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-sm bg-white/5 flex items-center justify-center">
                            <img
                                src="/images/login_background_new.png"
                                alt="Financial Visualization"
                                className="w-full h-full object-cover opacity-90"
                                onError={(e) => {
                                    e.currentTarget.src = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070"
                                }}
                            />
                            {/* Overlaying labels or floating elements */}
                            <div className="absolute top-6 left-6 p-3 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-white/10 shadow-xl">
                                <TrendingUp className="w-5 h-5 text-teal-400 mb-1" />
                                <div className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Análise</div>
                                <div className="text-lg font-bold">Monitoramento</div>
                            </div>
                            <div className="absolute bottom-6 right-6 p-3 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-white/10 text-right shadow-xl">
                                <div className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Status</div>
                                <div className="text-lg font-bold">100% Protegido</div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-md text-center space-y-2">
                        <h2 className="text-3xl font-extrabold leading-tight tracking-tighter">
                            Controle com inteligência.
                        </h2>
                        <p className="text-base text-blue-100/60 leading-relaxed font-medium">
                            Visualize seus dados de forma clara e tome decisões melhores.
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
