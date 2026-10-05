"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DEMO } from "@/lib/demo"

export async function saveName(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  if (!name) return

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) redirect("/login")

  // RLS всё равно не даст обновить чужой профиль, но фильтр по id обязателен
  await supabase.from("profiles").update({ name }).eq("id", data.claims.sub)
  redirect("/")
}

export async function logout() {
  if (DEMO) redirect("/login")

  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
