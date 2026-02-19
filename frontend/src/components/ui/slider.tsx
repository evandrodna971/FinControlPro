import { ChangeEvent } from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
    value: number[];
    min?: number;
    max?: number;
    step?: number;
    onValueChange: (value: number[]) => void;
    className?: string;
}

export function Slider({ value, min = 0, max = 100, step = 1, onValueChange, className }: SliderProps) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value)
        onValueChange([newValue])
    }

    // Clamp value to ensure it's within bounds
    const clampedValue = Math.max(min, Math.min(max, value[0] || min))
    const percentage = ((clampedValue - min) / (max - min)) * 100

    return (
        <div className={cn("relative w-full flex items-center select-none touch-none h-5 px-2", className)}>
            <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                    className="absolute h-full bg-primary"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={clampedValue}
                onChange={handleChange}
                className="absolute w-full h-full opacity-0 cursor-pointer"
            />
            <div
                className="absolute h-5 w-5 bg-background border-2 border-primary rounded-full shadow pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                style={{
                    left: `calc(${percentage}% - ${percentage * 0.2}px)`,
                    transform: 'translateX(-50%)'
                }}
            />
        </div>
    )
}
