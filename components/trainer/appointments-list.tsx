"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Appointment } from "@/lib/types"

interface AppointmentsListProps {
  trainerId: string
}

export function AppointmentsList({ trainerId }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAppointments()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`appointments:${trainerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `trainer_id=eq.${trainerId}`,
        },
        () => {
          fetchAppointments()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [trainerId, supabase])

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("scheduled_date", { ascending: true })

    if (data) {
      setAppointments(data)
    }
    setIsLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return ""
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando citas...</div>
  }

  return (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-600 dark:text-slate-400">
            No hay citas agendadas aún
          </CardContent>
        </Card>
      ) : (
        appointments.map((appointment) => (
          <Card key={appointment.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{appointment.client_name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{appointment.client_email}</p>
                  <p className="text-sm mt-2">
                    <strong>Fecha:</strong> {new Date(appointment.scheduled_date).toLocaleDateString("es-MX")}
                  </p>
                  <p className="text-sm">
                    <strong>Hora:</strong> {appointment.start_time} - {appointment.end_time}
                  </p>
                </div>
                <Badge className={getStatusColor(appointment.status)}>
                  {appointment.status === "confirmed" && "Confirmada"}
                  {appointment.status === "cancelled" && "Cancelada"}
                  {appointment.status === "completed" && "Completada"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
