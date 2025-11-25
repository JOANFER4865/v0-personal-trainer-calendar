"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Appointment } from "@/lib/types"

interface MyAppointmentsProps {
  clientId: string
}

export function MyAppointments({ clientId }: MyAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAppointments()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`appointments:${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          fetchAppointments()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [clientId, supabase])

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("client_id", clientId)
      .order("scheduled_date", { ascending: true })

    if (data) {
      setAppointments(data)
    }
    setIsLoading(false)
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) return

    try {
      // Update appointment status
      await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appointmentId)

      // Notify trainer
      const appointment = appointments.find((a) => a.id === appointmentId)
      if (appointment) {
        await supabase.from("notifications").insert({
          user_id: appointment.trainer_id,
          appointment_id: appointmentId,
          type: "appointment_cancelled",
          message: `La cita de ${appointment.client_name} para el ${new Date(appointment.scheduled_date).toLocaleDateString("es-MX")} ha sido cancelada`,
        })
      }

      await fetchAppointments()
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      alert("Error al cancelar la cita")
    }
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
            No tienes citas agendadas aún
          </CardContent>
        </Card>
      ) : (
        appointments.map((appointment) => (
          <Card key={appointment.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">Cita con el Entrenador</p>
                  <p className="text-sm mt-2">
                    <strong>Fecha:</strong> {new Date(appointment.scheduled_date).toLocaleDateString("es-MX")}
                  </p>
                  <p className="text-sm">
                    <strong>Hora:</strong> {appointment.start_time} - {appointment.end_time}
                  </p>
                  <p className="text-sm">
                    <strong>Duración:</strong> 2 horas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status === "confirmed" && "Confirmada"}
                    {appointment.status === "cancelled" && "Cancelada"}
                    {appointment.status === "completed" && "Completada"}
                  </Badge>
                  {appointment.status === "confirmed" && (
                    <Button variant="outline" size="sm" onClick={() => handleCancelAppointment(appointment.id)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
