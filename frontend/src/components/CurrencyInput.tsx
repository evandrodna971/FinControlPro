import CurrencyInputField from 'react-currency-input-field';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface CurrencyInputProps {
    value: string;
    onValueChange: (value: string | undefined) => void;
    error?: string;
    touched?: boolean;
    type: 'income' | 'expense';
    disabled?: boolean;
}

export function CurrencyInput({ value, onValueChange, error, touched, type, disabled }: CurrencyInputProps) {
    return (
        <div className="relative">
            <CurrencyInputField
                id="amount"
                name="amount"
                placeholder="R$ 0,00"
                defaultValue={value}
                decimalsLimit={2}
                decimalSeparator=","
                groupSeparator="."
                prefix="R$ "
                onValueChange={(val) => onValueChange(val)}
                disabled={disabled}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    "font-semibold pr-8",
                    type === 'expense' ? "text-red-500" : "text-green-500",
                    error ? "border-red-500 focus-visible:ring-red-500" : (touched ? "border-green-500 focus-visible:ring-green-500" : "")
                )}
            />
            {error && <AlertCircle className="absolute right-3 top-2.5 h-4 w-4 text-red-500" />}
        </div>
    );
}
