import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, ExternalLink } from 'lucide-react'

interface LocationInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    suggestions?: string[];
}

export function LocationInput({ value, onChange, placeholder = "Localização...", suggestions = [] }: LocationInputProps) {
    const [inputValue, setInputValue] = useState(value)
    const [showSuggestions, setShowSuggestions] = useState(false)

    // Sync external value changes
    React.useEffect(() => {
        setInputValue(value)
    }, [value])

    const handleSelect = (location: string) => {
        setInputValue(location)
        onChange(location)
        setShowSuggestions(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setInputValue(newValue)
        onChange(newValue)
        setShowSuggestions(true)
    }

    const filteredSuggestions = suggestions.filter(
        loc => loc && loc.toLowerCase().includes(inputValue.toLowerCase()) && loc !== inputValue
    ).slice(0, 5)

    return (
        <div className="relative space-y-2">
            <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    value={inputValue}
                    onChange={handleChange}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={placeholder}
                    className="pl-9 pr-10"
                />
                {value && (
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-primary transition-colors"
                        title="Ver no Mapa"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </a>
                )}
            </div>

            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-background border rounded-md shadow-md mt-1 max-h-[200px] overflow-auto">
                    <div className="p-2 text-xs text-muted-foreground font-medium uppercase">Recentes</div>
                    {filteredSuggestions.map((loc, i) => (
                        <div
                            key={i}
                            className="px-3 py-2 cursor-pointer hover:bg-accent text-sm flex items-center"
                            onMouseDown={() => handleSelect(loc)}
                        >
                            <MapPin className="mr-2 h-3 w-3 opacity-50" />
                            {loc}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
