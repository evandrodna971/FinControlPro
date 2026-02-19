import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { transactionSchema } from '@/schemas/transactionSchema';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

interface UseTransactionSubmitProps {
    onSuccess?: () => void;
    editId?: string | null;
}

export function useTransactionSubmit({ onSuccess, editId }: UseTransactionSubmitProps = {}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const submit = async (data: any) => {
        setIsSubmitting(true);
        try {
            // Validate data against schema
            const validatedData = transactionSchema.parse(data);

            console.log("Submitting validated payload:", validatedData);

            if (editId) {
                await api.put(`/transactions/${editId}`, validatedData);
                toast.success("Transação atualizada com sucesso!");
            } else {
                await api.post('/transactions/', validatedData);
                toast.success("Transação criada com sucesso!");
            }

            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/transactions');
            }

        } catch (error: any) {
            console.error("Falha ao salvar transação", error);

            if (error instanceof z.ZodError) {
                // Formatting Zod errors
                error.issues.forEach((err: any) => {
                    toast.error(`${err.path.join('.')}: ${err.message}`);
                });
            } else {
                // API Errors
                const errorDetail = error.response?.data?.detail;
                const errorMessage = typeof errorDetail === 'object'
                    ? JSON.stringify(errorDetail)
                    : (errorDetail || error.message || "Erro desconhecido");

                toast.error(`Erro ao salvar: ${errorMessage}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        submit,
        isSubmitting
    };
}
