import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientDashboard } from "@/components/client/client-dashboard"

export default async function ClientDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Verify user is a client
  const { data: profile } = await supabase.from("profiles").select("role, full_name, email").eq("id", user.id).single()

  if (profile?.role !== "client") {
    redirect("/trainer/dashboard")
  }

  return <ClientDashboard userId={user.id} userProfile={profile} />
}
