export interface Profile {
  id: string
  email: string
  role: "trainer" | "client"
  full_name: string
  phone?: string
  gym_address?: string
  created_at: string
  updated_at: string
}

export interface Availability {
  id: string
  trainer_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export interface Appointment {
  id: string
  trainer_id: string
  client_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  client_email: string
  client_name: string
  status: "confirmed" | "cancelled" | "completed"
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  appointment_id?: string
  type: "appointment_confirmed" | "appointment_cancelled" | "appointment_reminder"
  message: string
  read: boolean
  created_at: string
}
