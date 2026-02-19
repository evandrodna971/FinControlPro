import { Users } from "lucide-react"

interface UserBadgeProps {
    userId?: number
    userName: string
    color: string
    emoji: string
    isJoint?: boolean
    size?: "sm" | "md"
}

export function UserBadge({ userName, color, emoji, isJoint, size = "sm" }: UserBadgeProps) {
    if (isJoint) {
        return (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                <Users className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
                <span className={size === "sm" ? "text-xs" : "text-sm font-medium"}>Conjunto</span>
            </div>
        )
    }

    return (
        <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-white ${size === "sm" ? "text-xs" : "text-sm"} font-medium`}
            style={{ backgroundColor: color }}
        >
            <span>{emoji}</span>
            <span>{userName}</span>
        </div>
    )
}
