import { Bell } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function ApprovalNotificationBadge() {
    const { data: pendingApprovals } = useQuery({
        queryKey: ['pending-approvals'],
        queryFn: async () => {
            try {
                const response = await api.get('/approvals/pending')
                return response.data
            } catch (error) {
                console.error('Error fetching pending approvals:', error)
                return []
            }
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    })

    const count = pendingApprovals?.length || 0

    return (
        <div className="relative">
            <Bell className="h-5 w-5" />
            {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </div>
    )
}
