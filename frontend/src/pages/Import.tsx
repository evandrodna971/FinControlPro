import React, { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Link, useNavigate } from 'react-router-dom'
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

export default function Import() {
    const navigate = useNavigate()
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ count: number; transactions: any[] } | null>(null)

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) return
        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const { data } = await api.post('/imports/csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setResult({ count: data.length, transactions: data })
        } catch (error) {
            console.error("Falha no upload", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen p-8 bg-background text-foreground flex flex-col items-center">
            <div className="w-full max-w-2xl flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Importar Dados</h1>
                <Link to="/dashboard">
                    <Button variant="outline">Voltar ao Painel</Button>
                </Link>
            </div>

            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Extrato Bancário (CSV/OFX)</CardTitle>
                    <CardDescription>
                        Carregue seu arquivo CSV para importar transações automaticamente.
                        Nosso sistema categorizará automaticamente seus gastos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-12 transition-colors hover:border-primary/50">
                            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                            <label className="cursor-pointer text-center">
                                <span className="text-lg font-medium text-primary hover:underline">Clique para carregar</span>
                                <input type="file" className="hidden" onChange={onFileChange} accept=".csv,.ofx" />
                                <p className="text-sm text-muted-foreground mt-2">Arraste e solte o arquivo aqui (CSV ou OFX)</p>
                            </label>
                            {file && (
                                <div className="mt-6 flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
                                    <FileText className="h-4 w-4" />
                                    <span className="text-sm font-medium">{file.name}</span>
                                </div>
                            )}
                            <Button
                                className="mt-8 px-12"
                                disabled={!file || loading}
                                onClick={handleUpload}
                            >
                                {loading ? "Processando..." : "Importar Agora"}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                            <h2 className="text-2xl font-bold">Importação Concluída!</h2>
                            <p className="text-muted-foreground mt-2 mb-6">
                                Processamos com sucesso <strong>{result.count}</strong> transações do seu extrato.
                            </p>
                            <Button onClick={() => navigate('/dashboard')}>
                                Ver no Painel
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Dica:</strong> Identificamos automaticamente parceiros como Uber, Starbucks e Amazon para você.
                    </p>
                </div>
            </div>
        </div>
    )
}
