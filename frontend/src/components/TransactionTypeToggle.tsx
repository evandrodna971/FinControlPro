import React from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { Wallet, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionType } from '@/types/transaction';

interface TransactionTypeToggleProps {
    value: TransactionType;
    onValueChange: (value: TransactionType) => void;
    disabled?: boolean;
}

export function TransactionTypeToggle({ value, onValueChange, disabled }: TransactionTypeToggleProps) {
    return (
        <ToggleGroup.Root
            type="single"
            value={value}
            onValueChange={(val) => {
                if (val) onValueChange(val as TransactionType);
            }}
            disabled={disabled}
            className="inline-flex bg-muted p-1 rounded-lg w-full"
        >
            <ToggleGroup.Item
                value="expense"
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-primary",
                    value === 'expense'
                        ? "bg-white text-red-600 shadow-sm"
                        : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                )}
            >
                <Wallet className="w-4 h-4" />
                Despesa
            </ToggleGroup.Item>
            <ToggleGroup.Item
                value="income"
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-primary",
                    value === 'income'
                        ? "bg-white text-green-600 shadow-sm"
                        : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                )}
            >
                <DollarSign className="w-4 h-4" />
                Receita
            </ToggleGroup.Item>
        </ToggleGroup.Root>
    );
}
