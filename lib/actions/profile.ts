"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DEMO, demoProfile } from "@/lib/demo"

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

// Цели на день: вода (мл) и шаги
export async function saveGoals(water_goal_ml: number, steps_goal: number) {
  const goals = { water_goal_ml: Math.round(water_goal_ml), steps_goal: Math.round(steps_goal) }
  if (!(goals.water_goal_ml > 0 && goals.water_goal_ml <= 20000)) throw new Error("Неверная цель по воде")
  if (!(goals.steps_goal > 0 && goals.steps_goal <= 200000)) throw new Error("Неверная цель по шагам")

  if (DEMO) {
    Object.assign(demoProfile, goals)
  } else {
    const supabase = await createClient()
    const { data } = await supabase.auth.getClaims()
    if (!data) redirect("/login")
    const { error } = await supabase.from("profiles").update(goals).eq("id", data.claims.sub)
    if (error) throw error
  }
  revalidatePath("/", "layout")
}

// Удалить аккаунт и все данные (функция delete_my_account в базе, миграция 0004)
export async function deleteAccount() {
  if (DEMO) redirect("/login")

  const supabase = await createClient()
  const { error } = await supabase.rpc("delete_my_account")
  if (error) throw error
  await supabase.auth.signOut()
  redirect("/login")
}

export async function logout() {
  if (DEMO) redirect("/login")

  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
