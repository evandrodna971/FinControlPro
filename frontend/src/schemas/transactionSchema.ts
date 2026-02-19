import { z } from 'zod';

export const transactionSchema = z.object({
    amount: z.number().min(0.01, "O valor deve ser maior que zero"),
    description: z.string().min(1, "A descrição é obrigatória").max(100, "A descrição deve ter no máximo 100 caracteres"),
    date: z.string(), // ISO string validation could be added
    type: z.enum(['expense', 'income']),
    category_id: z.number().nullable().optional(),
    payment_method: z.string().optional(),
    tags: z.string().optional(),
    location: z.string().optional(),
    status: z.enum(['paid', 'pending', 'received', 'overdue']),
    due_date: z.string().nullable().optional(),
    paid_at: z.string().nullable().optional(),

    is_recurring: z.boolean(),
    recurrence_period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).nullable().optional(),
    installment_count: z.number().int().min(1).optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
