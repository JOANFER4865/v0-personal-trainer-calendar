"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Availability } from "@/lib/types"

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

interface AvailabilityManagerProps {
  trainerId: string
}

export function AvailabilityManager({ trainerId }: AvailabilityManagerProps) {
  const [availability, setAvailability] = useState<Record<number, Availability | null>>({})
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAvailability()
  }, [trainerId])

  const fetchAvailability = async () => {
    const { data } = await supabase.from("availability").select("*").eq("trainer_id", trainerId)

    if (data) {
      const avMap: Record<number, Availability | null> = {}
      for (let i = 0; i < 7; i++) {
        avMap[i] = data.find((a) => a.day_of_week === i) || null
      }
      setAvailability(avMap)
    }
    setIsLoading(false)
  }

  const handleUpdateAvailability = async (dayOfWeek: number, startTime: string, endTime: string) => {
    const existing = availability[dayOfWeek]

    try {
      if (existing) {
        // Update existing
        await supabase.from("availability").update({ start_time: startTime, end_time: endTime }).eq("id", existing.id)
      } else {
        // Insert new
        await supabase.from("availability").insert({
          trainer_id: trainerId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
        })
      }
      await fetchAvailability()
    } catch (error) {
      console.error("Error updating availability:", error)
    }
  }

  const handleDeleteAvailability = async (dayOfWeek: number) => {
    const existing = availability[dayOfWeek]
    if (!existing) return

    try {
      await supabase.from("availability").delete().eq("id", existing.id)
      await fetchAvailability()
    } catch (error) {
      console.error("Error deleting availability:", error)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Horario de Disponibilidad</CardTitle>
          <CardDescription>
            Configura tu disponibilidad por día de la semana para que los clientes puedan agendar citas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day, index) => (
            <AvailabilityRow
              key={index}
              day={day}
              dayOfWeek={index}
              availability={availability[index]}
              onUpdate={handleUpdateAvailability}
              onDelete={handleDeleteAvailability}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

interface AvailabilityRowProps {
  day: string
  dayOfWeek: number
  availability: Availability | null
  onUpdate: (dayOfWeek: number, startTime: string, endTime: string) => void
  onDelete: (dayOfWeek: number) => void
}

function AvailabilityRow({ day, dayOfWeek, availability, onUpdate, onDelete }: AvailabilityRowProps) {
  const [startTime, setStartTime] = useState(availability?.start_time || "08:00")
  const [endTime, setEndTime] = useState(availability?.end_time || "17:00")
  const [isEnabled, setIsEnabled] = useState(!!availability)

  return (
    <div className="flex items-end gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
      <div className="flex-1">
        <Label>{day}</Label>
      </div>
      {isEnabled ? (
        <>
          <div className="flex-1">
            <Label htmlFor={`start-${dayOfWeek}`} className="text-xs">
              De
            </Label>
            <Input
              id={`start-${dayOfWeek}`}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor={`end-${dayOfWeek}`} className="text-xs">
              Hasta
            </Label>
            <Input id={`end-${dayOfWeek}`} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <Button onClick={() => onUpdate(dayOfWeek, startTime, endTime)} size="sm">
            Guardar
          </Button>
          <Button
            onClick={() => {
              setIsEnabled(false)
              onDelete(dayOfWeek)
            }}
            variant="destructive"
            size="sm"
          >
            Eliminar
          </Button>
        </>
      ) : (
        <Button onClick={() => setIsEnabled(true)} variant="outline" size="sm">
          Agregar Disponibilidad
        </Button>
      )}
    </div>
  )
}
