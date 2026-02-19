import { create } from 'zustand'
import { api } from '@/lib/api'
import { useWorkspaceStore } from './useWorkspaceStore'

interface User {
    id: number;
    email: string;
    role: string;
    full_name: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
    checkEmail: (email: string) => Promise<{ exists: boolean; message: string }>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'),
    isLoading: true,
    login: async (email: string, password: string, rememberMe: boolean) => {
        const formData = new FormData()
        formData.append('username', email)
        formData.append('password', password)

        const response = await api.post('/token', formData)
        const token = response.data.access_token

        if (rememberMe) {
            localStorage.setItem('auth_token', token)
            localStorage.setItem('user_email', email)
            sessionStorage.removeItem('auth_token')
        } else {
            sessionStorage.setItem('auth_token', token)
            localStorage.removeItem('auth_token')
            // Opcional: remover user_email se o usuário decidir não lembrar mais, 
            // mas o requisito diz apenas 'salvar token...'. 
            // Para segurança/privacidade, vamos limpar se desmarcado? 
            // O requisito diz: "Se desmarcado, o token deve ser salvo apenas na sessionStorage".
            // Para "Lembrar meus dados", faz sentido manter o email.
        }

        set({ token, isLoading: true })

        try {
            const { data } = await api.get('/users/me')
            set({ user: data, isLoading: false })
        } catch (error) {
            localStorage.removeItem('auth_token')
            sessionStorage.removeItem('auth_token')
            set({ user: null, token: null, isLoading: false })
            throw error
        }
    },
    checkEmail: async (email: string) => {
        const { data } = await api.post('/check-email', { email })
        return data
    },
    logout: () => {
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('auth_token')
        // Clear workspace store
        useWorkspaceStore.getState().setWorkspaces([])
        useWorkspaceStore.getState().setActiveWorkspace(null)
        useWorkspaceStore.persist.clearStorage()

        set({ user: null, token: null })
    },
    checkAuth: async () => {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
        if (token) {
            try {
                const { data } = await api.get('/users/me')
                set({ user: data, isLoading: false })
            } catch {
                localStorage.removeItem('auth_token')
                sessionStorage.removeItem('auth_token')
                set({ user: null, token: null, isLoading: false })
            }
        } else {
            set({ isLoading: false })
        }
    }
}))
