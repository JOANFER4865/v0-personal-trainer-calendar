"use client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Notification } from "@/lib/types"

interface NotificationBellProps {
  notifications: Notification[]
  unreadCount: number
}

export function NotificationBell({ notifications, unreadCount }: NotificationBellProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-transparent">
          <span className="text-lg">🔔</span>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-600 dark:text-slate-400">No hay notificaciones</div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="p-4 cursor-default">
              <div className="flex flex-col gap-1 w-full">
                <p className="text-sm font-medium">{notification.message}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {new Date(notification.created_at).toLocaleDateString("es-MX")}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
