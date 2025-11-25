import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TrainerDashboard } from "@/components/trainer/trainer-dashboard"

export default async function TrainerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Verify user is a trainer
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "trainer") {
    redirect("/client/dashboard")
  }

  return <TrainerDashboard userId={user.id} />
}
