"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AvailabilityManager } from "./availability-manager"
import { AppointmentsList } from "./appointments-list"
import { LogoutButton } from "@/components/logout-button"
import { NotificationBell } from "@/components/notification-bell"
import type { Notification } from "@/lib/types"

interface TrainerDashboardProps {
  userId: string
}

export function TrainerDashboard({ userId }: TrainerDashboardProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Fetch notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.read).length)
      }
    }

    fetchNotifications()

    // Subscribe to real-time notifications
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
          setUnreadCount((prev) => prev + 1)
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-950 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel del Entrenador</h1>
          <div className="flex items-center gap-4">
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="availability" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="availability">Mi Disponibilidad</TabsTrigger>
            <TabsTrigger value="appointments">Citas Agendadas</TabsTrigger>
          </TabsList>

          <TabsContent value="availability" className="space-y-4">
            <AvailabilityManager trainerId={userId} />
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <AppointmentsList trainerId={userId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
