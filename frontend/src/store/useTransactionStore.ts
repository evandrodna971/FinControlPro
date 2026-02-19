import { create } from 'zustand'

import { TransactionType, TransactionStatus, RecurrencePeriod } from '@/types/transaction'

export interface TransactionState {
    amount: string;
    type: TransactionType;
    description: string;
    categoryId: string;
    categoryName: string;
    date: string;
    status: TransactionStatus;
    paymentMethod: string;
    tags: string[];
    location: string;
    isInstallment: boolean;
    installmentCount: string;
    isRecurring: boolean;
    recurrencePeriod: RecurrencePeriod;
}

interface TransactionStore extends TransactionState {
    updateField: <K extends keyof TransactionState>(field: K, value: TransactionState[K]) => void;
    updateFields: (fields: Partial<TransactionState>) => void;
    reset: () => void;
}

const initialState: TransactionState = {
    amount: "",
    type: "expense",
    description: "",
    categoryId: "",
    categoryName: "Sem Categoria",
    date: new Date().toISOString().split('T')[0],
    status: "paid",
    paymentMethod: "Cartão de Crédito",
    tags: [],
    location: "",
    isInstallment: false,
    installmentCount: "1",
    isRecurring: false,
    recurrencePeriod: "monthly",
}

export const useTransactionStore = create<TransactionStore>((set) => ({
    ...initialState,
    updateField: (field, value) => set((state) => ({ ...state, [field]: value })),
    updateFields: (fields) => set((state) => ({ ...state, ...fields })),
    reset: () => set(initialState),
}))
