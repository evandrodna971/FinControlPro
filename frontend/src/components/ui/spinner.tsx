import { LucideLoader2 } from 'lucide-react'

interface SpinnerProps {
    className?: string;
    size?: number;
}

export function Spinner({ className = "", size = 20 }: SpinnerProps) {
    return (
        <LucideLoader2
            className={`animate-spin ${className}`}
            size={size}
        />
    )
}
