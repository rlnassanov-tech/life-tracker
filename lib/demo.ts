// Демо-режим: включается сам, пока в .env.local нет настоящих ключей Supabase.
// Позволяет смотреть интерфейс без входа по почте. Данные в нём не сохраняются.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""

export const DEMO = !url || url.includes("xxxxxxxx")

export const demoProfile = {
  id: "demo",
  name: "Расул",
  water_goal_ml: 2000,
  steps_goal: 8000,
}
