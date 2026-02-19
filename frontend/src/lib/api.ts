import axios from "axios";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Inject active workspace ID if present
    const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
    if (activeWorkspace) {
        config.headers['X-Workspace-ID'] = activeWorkspace.id.toString();
    }

    return config;
});
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error Details:", {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        return Promise.reject(error);
    }
);
