"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Availability, Profile } from "@/lib/types"

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

interface AvailabilityViewerProps {
  clientId: string
  clientProfile: any
}

export function AvailabilityViewer({ clientId, clientProfile }: AvailabilityViewerProps) {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [trainerInfo, setTrainerInfo] = useState<Profile | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{
    day: number
    startTime: string
  } | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchTrainerData()
  }, [])

  const fetchTrainerData = async () => {
    // Get all trainers (in a real app, you might have a specific trainer selected)
    const { data: trainers } = await supabase.from("profiles").select("*").eq("role", "trainer").limit(1)

    if (trainers && trainers.length > 0) {
      setTrainerInfo(trainers[0])

      // Fetch availability for this trainer
      const { data: avData } = await supabase.from("availability").select("*").eq("trainer_id", trainers[0].id)

      if (avData) {
        setAvailability(avData)
      }
    }
  }

  const handleBookAppointment = async () => {
    if (!selectedSlot || !trainerInfo) return

    setIsBooking(true)
    try {
      // Calculate end time (2 hours after start time)
      const [hours, minutes] = selectedSlot.startTime.split(":").map(Number)
      const endHours = hours + 2
      const endTime = `${String(endHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`

      // Get next scheduled date for this day of week
      const today = new Date()
      const targetDayOfWeek = selectedSlot.day
      let daysUntilTarget = (targetDayOfWeek - today.getDay() + 7) % 7
      if (daysUntilTarget === 0) daysUntilTarget = 7 // Next week if it's today

      const scheduledDate = new Date(today)
      scheduledDate.setDate(scheduledDate.getDate() + daysUntilTarget)
      const dateStr = scheduledDate.toISOString().split("T")[0]

      // Create appointment
      const { error } = await supabase.from("appointments").insert({
        trainer_id: trainerInfo.id,
        client_id: clientId,
        scheduled_date: dateStr,
        start_time: selectedSlot.startTime,
        end_time: endTime,
        client_email: clientProfile.email,
        client_name: clientProfile.full_name,
        status: "confirmed",
      })

      if (error) throw error

      // Create notification for trainer
      await supabase.from("notifications").insert({
        user_id: trainerInfo.id,
        type: "appointment_confirmed",
        message: `Nueva cita agendada: ${clientProfile.full_name} el ${new Date(dateStr).toLocaleDateString("es-MX")} a las ${selectedSlot.startTime}`,
      })

      // Create notification for client
      await supabase.from("notifications").insert({
        user_id: clientId,
        type: "appointment_confirmed",
        message: `Tu cita ha sido confirmada para el ${new Date(dateStr).toLocaleDateString("es-MX")} a las ${selectedSlot.startTime}. Duración: 2 horas. Dirección: ${trainerInfo.gym_address || "Tu gimnasio"}`,
      })

      setSelectedSlot(null)
      alert("Cita agendada exitosamente!")
    } catch (error) {
      console.error("Error booking appointment:", error)
      alert("Error al agendar la cita")
    } finally {
      setIsBooking(false)
    }
  }

  if (!trainerInfo) {
    return (
      <Card>
        <CardContent className="py-8 text-center">No hay entrenadores disponibles en este momento</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidad del Entrenador</CardTitle>
          <CardDescription>Selecciona un horario disponible para agendar tu cita de 2 horas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="font-semibold text-slate-900 dark:text-white">{trainerInfo.full_name}</p>
            {trainerInfo.gym_address && (
              <p className="text-sm text-slate-600 dark:text-slate-400">{trainerInfo.gym_address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DAYS.map((day, index) => {
              const dayAvailability = availability.find((a) => a.day_of_week === index)
              return (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{day}</h3>
                  {dayAvailability ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {dayAvailability.start_time} - {dayAvailability.end_time}
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSelectedSlot({
                                day: index,
                                startTime: dayAvailability.start_time,
                              })
                            }
                          >
                            Agendar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirmar Cita</DialogTitle>
                            <DialogDescription>
                              Confirma tu cita para el {DAYS[index]} a las {dayAvailability.start_time} (2 horas)
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <p>
                              <strong>Entrenador:</strong> {trainerInfo.full_name}
                            </p>
                            <p>
                              <strong>Día:</strong> {DAYS[index]}
                            </p>
                            <p>
                              <strong>Hora:</strong> {dayAvailability.start_time} - {(() => {
                                const [h, m] = dayAvailability.start_time.split(":").map(Number)
                                return `${String(h + 2).padStart(2, "0")}:${String(m).padStart(2, "0")}`
                              })()}
                            </p>
                            <p>
                              <strong>Ubicación:</strong> {trainerInfo.gym_address || "Tu gimnasio"}
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setSelectedSlot(null)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleBookAppointment} disabled={isBooking}>
                              {isBooking ? "Agendando..." : "Confirmar Cita"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">No disponible</p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
