import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AlertsManager() {
    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Alertas de Preço</CardTitle>
                <Button variant="ghost" size="icon">
                    <Bell className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
                    <p className="text-muted-foreground text-sm">
                        Gerenciador de alertas em breve.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
