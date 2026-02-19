import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.post('/forgot-password', { email })
            setMessage("Se a conta existir, um link de recuperação foi registrado no console do servidor.")
        } catch (error) {
            console.error(error)
            setMessage("Erro ao solicitar recuperação. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Recuperação de Senha</CardTitle>
                    <CardDescription>Digite seu e-mail para receber um link de redefinição</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@exemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        {message && <p className="text-sm text-blue-500">{message}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Enviando..." : "Enviar Link de Recuperação"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4 mt-2">
                    <Link to="/login" className="text-sm text-primary hover:underline">Voltar para Login</Link>
                </CardFooter>
            </Card>
        </div>
    )
}
