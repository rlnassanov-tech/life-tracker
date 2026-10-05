import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DEMO, demoProfile } from "@/lib/demo"

// Текущий пользователь и его профиль. cache() — чтобы за один запрос
// layout и страница не ходили в базу дважды.
export const getProfile = cache(async () => {
  if (DEMO) return demoProfile

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, water_goal_ml, steps_goal")
    .eq("id", claims.claims.sub)
    .single()
  if (!profile) redirect("/login")

  return profile
})
