export type TransactionType = 'expense' | 'income';
export type TransactionStatus = 'paid' | 'pending' | 'received' | 'overdue';
export type RecurrencePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TransactionBase {
    amount: number;
    description: string;
    date: string; // ISO string
    type: TransactionType;
    category_id?: number | null;
    payment_method?: string;
    tags?: string;
    location?: string;
    status: TransactionStatus;
    due_date?: string | null;
    paid_at?: string | null;

    // Recurrence & Installments
    is_recurring: boolean;
    recurrence_period?: RecurrencePeriod | null;
    recurrence_end_date?: string | null;
    installment_count?: number;
    installment_number?: number;
    parent_id?: number | null;
}

export interface TransactionCreate extends TransactionBase {
    // Helper fields for UI logic that might be transformed before sending
    // but strictly speaking the API expects the structure above.
}

export interface Transaction extends TransactionBase {
    id: number;
    user_id: number;
    workspace_id?: number;
    category_name?: string;
    created_at?: string;
    total_value?: number; // For summary views
}
