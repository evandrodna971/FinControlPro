import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PerformanceChart() {
    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>Desempenho da Carteira</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
                    <p className="text-muted-foreground text-sm">
                        Gráfico de desempenho será exibido aqui após coleta de dados históricos.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
