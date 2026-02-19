import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import { isTokenExpired } from '@/lib/jwt'

import Layout from '@/components/Layout'
import { Toaster } from 'sonner'

import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { api } from '@/lib/api'
import { MonthProvider } from '@/context/MonthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading, checkAuth } = useAuthStore()
    const { workspaces, setWorkspaces } = useWorkspaceStore()
    const location = useLocation()
    const [checkingWorkspaces, setCheckingWorkspaces] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    useEffect(() => {
        const fetchWorkspaces = async () => {
            if (user) {
                try {
                    const { data } = await api.get('/workspaces/')
                    console.log("[DEBUG] Fetched workspaces:", data)
                    setWorkspaces(data)
                    // Auto-select first workspace if none active
                    if (data.length > 0 && !useWorkspaceStore.getState().activeWorkspace) {
                        useWorkspaceStore.getState().setActiveWorkspace(data[0])
                    }
                } catch (error) {
                    console.error("Failed to fetch workspaces", error)
                } finally {
                    setCheckingWorkspaces(false)
                }
            } else if (!isLoading) {
                setCheckingWorkspaces(false)
            }
        }
        fetchWorkspaces()
    }, [user, isLoading, setWorkspaces])

    if (isLoading || checkingWorkspaces) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Redirect to onboarding if no workspaces and not currently on onboarding page
    if (workspaces.length === 0 && location.pathname !== '/onboarding') {
        console.log("[DEBUG] No workspaces, redirecting to onboarding")
        return <Navigate to="/onboarding" replace />
    }

    // Redirect away from onboarding if workspaces exist
    if (workspaces.length > 0 && location.pathname === '/onboarding') {
        console.log("[DEBUG] Workspaces exist, redirecting to dashboard")
        return <Navigate to="/dashboard" replace />
    }

    return <Layout>{children}</Layout>
}



import Dashboard from '@/pages/Dashboard'

import Categories from '@/pages/Categories'
import AddTransaction from '@/pages/AddTransaction'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Team from '@/pages/Team'
import Transactions from '@/pages/Transactions'
import WorkspaceSettings from '@/pages/WorkspaceSettings'
import Investments from '@/pages/Investments'
import { MarketDashboard } from '@/pages/MarketDashboard'
import Onboarding from '@/pages/Onboarding'

function App() {
    const checkAuth = useAuthStore(state => state.checkAuth)
    const logout = useAuthStore(state => state.logout)

    useEffect(() => {
        checkAuth()

        // Token expiration check
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
        if (token && isTokenExpired(token)) {
            logout()
        }

        // Auto-disconnect on window close (if not remembered)
        const handleBeforeUnload = () => {
            if (!localStorage.getItem('auth_token')) {
                sessionStorage.removeItem('auth_token')
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [checkAuth, logout])

    return (
        <MonthProvider>
            <BrowserRouter>
                <Toaster position="top-right" richColors closeButton duration={4000} />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    <Route path="/onboarding" element={
                        <ProtectedRoute>
                            <Onboarding />
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/categories" element={
                        <ProtectedRoute>
                            <Categories />
                        </ProtectedRoute>
                    } />
                    <Route path="/add-transaction" element={
                        <ProtectedRoute>
                            <AddTransaction />
                        </ProtectedRoute>
                    } />
                    <Route path="/team" element={
                        <ProtectedRoute>
                            <Team />
                        </ProtectedRoute>
                    } />

                    <Route path="/transactions" element={
                        <ProtectedRoute>
                            <Transactions />
                        </ProtectedRoute>
                    } />
                    <Route path="/workspace-settings" element={
                        <ProtectedRoute>
                            <WorkspaceSettings />
                        </ProtectedRoute>
                    } />
                    <Route path="/investments" element={
                        <ProtectedRoute>
                            <Investments />
                        </ProtectedRoute>
                    } />
                    <Route path="/market-ranks" element={
                        <ProtectedRoute>
                            <MarketDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </MonthProvider>
    )
}

export default App
