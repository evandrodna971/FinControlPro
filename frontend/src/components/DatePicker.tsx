import React from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import 'react-day-picker/dist/style.css';

interface DatePickerProps {
    value: string;
    onValueChange: (date: string) => void;
    label?: string;
}

export function DatePicker({ value, onValueChange, label }: DatePickerProps) {
    const date = value ? new Date(value) : undefined;

    const handleSelect = (newDate: Date | undefined) => {
        if (newDate) {
            onValueChange(newDate.toISOString());
        }
    };

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <Popover.Root>
                <Popover.Trigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                    </Button>
                </Popover.Trigger>
                <Popover.Content className="w-auto p-0 bg-background border rounded-md shadow-md z-50" align="start">
                    <div className="p-3 border-b flex justify-between gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleSelect(new Date())}>Hoje</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleSelect(subDays(new Date(), 1))}>Ontem</Button>
                    </div>
                    <DayPicker
                        mode="single"
                        selected={date}
                        onSelect={handleSelect}
                        locale={ptBR}
                        showOutsideDays
                        className="p-3"
                        modifiersClassNames={{
                            selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            today: "bg-accent text-accent-foreground"
                        }}
                    />
                </Popover.Content>
            </Popover.Root>
        </div>
    );
}
