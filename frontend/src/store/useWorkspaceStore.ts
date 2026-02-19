import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Workspace {
    id: number;
    name: string;
    type: string;
}

interface WorkspaceState {
    activeWorkspace: Workspace | null;
    workspaces: Workspace[];
    setActiveWorkspace: (workspace: Workspace | null) => void;
    setWorkspaces: (workspaces: Workspace[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set) => ({
            activeWorkspace: null,
            workspaces: [],
            setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
            setWorkspaces: (workspaces) => set({ workspaces }),
        }),
        {
            name: 'workspace-storage',
        }
    )
)
