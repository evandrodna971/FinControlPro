import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Plus, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// If shadcn Dialog components are missing, I'll use basic HTML or accessible primitives if possible, but let's assume shadcn structure since user asked.
// Actually, I should probably check if Dialog exists. I didn't see it in the list_dir earlier.
// I will implement a simple Dialog using Radix Primitive if needed, but for now I'll try to import from components/ui/dialog if I assume it exists, but I know it wasn't in list_dir.
// I'll use @radix-ui/react-dialog primitives directly inside this file to be safe.

import * as RadixDialog from '@radix-ui/react-dialog';

interface CategorySelectProps {
    value: string; // category ID
    onValueChange: (value: string) => void;
    type: 'income' | 'expense';
}

export function CategorySelect({ value, onValueChange, type }: CategorySelectProps) {
    const [open, setOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const queryClient = useQueryClient();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories/');
            return res.data;
        }
    });

    const createCategoryMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await api.post('/categories/', { name, type });
            return res.data;
        },
        onSuccess: (newCategory) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setDialogOpen(false);
            setNewCategoryName("");
            onValueChange(newCategory.id.toString());
            toast.success(`Categoria "${newCategory.name}" criada!`);
        },
        onError: () => {
            toast.error("Erro ao criar categoria.");
        }
    });

    const filteredCategories = categories.filter((c: any) => c.type === type);
    const selectedCategory = categories.find((c: any) => c.id.toString() === value);

    const handleCreate = () => {
        if (!newCategoryName.trim()) return;
        createCategoryMutation.mutate(newCategoryName);
    };

    return (
        <div className="flex flex-col gap-2">
            <Popover.Root open={open} onOpenChange={setOpen}>
                <Popover.Trigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal"
                    >
                        {value
                            ? selectedCategory?.name
                            : "Selecione uma categoria..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </Popover.Trigger>
                <Popover.Content className="w-[300px] p-0 bg-background border rounded-md shadow-md z-50">
                    <div className="flex items-center border-b px-3">
                        <Loader2 className={cn("mr-2 h-4 w-4 animate-spin", isLoading ? "opacity-100" : "opacity-0")} />
                        <Input
                            placeholder="Buscar categoria..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex h-11 w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                        {filteredCategories
                            .filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .length === 0 ? (
                            <div className="py-6 text-center text-sm">Nenhuma categoria encontrada.</div>
                        ) : (
                            filteredCategories
                                .filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((category: any) => (
                                    <div
                                        key={category.id}
                                        onClick={() => {
                                            onValueChange(category.id.toString());
                                            setOpen(false);
                                            setSearchQuery("");
                                        }}
                                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === category.id.toString() ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {category.name}
                                    </div>
                                ))
                        )}
                        <div className="p-1 border-t mt-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-primary"
                                onClick={() => {
                                    setOpen(false);
                                    setDialogOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Criar nova "{type === 'expense' ? 'Despesa' : 'Receita'}"
                            </Button>
                        </div>
                    </div>
                </Popover.Content>
            </Popover.Root>

            <RadixDialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
                <RadixDialog.Portal>
                    <RadixDialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
                    <RadixDialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
                        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                            <RadixDialog.Title className="text-lg font-semibold leading-none tracking-tight">Criar Nova Categoria</RadixDialog.Title>
                            <RadixDialog.Description className="text-sm text-muted-foreground">Adicione uma nova categoria para suas {type === 'expense' ? 'despesas' : 'receitas'}.</RadixDialog.Description>
                        </div>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Nome</Label>
                                <Input
                                    id="name"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreate} disabled={createCategoryMutation.isPending || !newCategoryName.trim()}>
                                {createCategoryMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Salvar
                            </Button>
                        </div>
                        <RadixDialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </RadixDialog.Close>
                    </RadixDialog.Content>
                </RadixDialog.Portal>
            </RadixDialog.Root>
        </div>
    );
}
