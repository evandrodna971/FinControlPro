import { useState, KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    suggestions?: string[];
}

export function TagInput({ value, onChange, placeholder = "Adicionar tag...", suggestions = [] }: TagInputProps) {
    const [inputValue, setInputValue] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(inputValue)
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            removeTag(value[value.length - 1])
        }
    }

    const addTag = (tag: string) => {
        const trimmed = tag.trim()
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed])
        }
        setInputValue("")
        setShowSuggestions(false)
    }

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove))
    }

    const filteredSuggestions = suggestions.filter(
        tag => !value.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
    ).slice(0, 5)

    return (
        <div className="space-y-2">
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {value.map(tag => (
                        <Badge key={tag} variant="secondary" className="px-2 py-1 text-sm font-normal">
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-destructive focus:outline-none"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
            <div className="relative">
                <Input
                    value={inputValue}
                    onChange={e => {
                        setInputValue(e.target.value)
                        setShowSuggestions(true)
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={value.length === 0 ? placeholder : ""}
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-background border rounded-md shadow-md mt-1 max-h-[200px] overflow-auto inline-flex h-10 items-center justify-center bg-muted p-1 rounded-lg w-full">
                        <div className="p-2 text-xs text-muted-foreground font-medium uppercase">Sugestões</div>
                        {filteredSuggestions.map(tag => (
                            <div
                                key={tag}
                                className="px-3 py-2 cursor-pointer hover:bg-accent text-sm flex items-center justify-between"
                            >
                                <span>{tag}</span>
                                <Plus className="h-3 w-3 opacity-50" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
