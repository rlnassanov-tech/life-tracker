import "server-only"
import { createClient } from "@/lib/supabase/server"
import { DEMO } from "@/lib/demo"
import { demoStore } from "@/lib/data/demo-store"
import { activityMinutes } from "@/lib/dates"
import type { Activity, ActivityInput } from "@/lib/types"

// Запросы к дневнику занятий

const COLUMNS = "id, title, tag, date, start_time, end_time, duration_min"

// Занятия за период: по дням, внутри дня — по времени начала
export async function getActivities(from: string, to: string): Promise<Activity[]> {
  if (DEMO) {
    return demoStore.activities
      .filter((a) => a.date >= from && a.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("activities")
    .select(COLUMNS)
    .gte("date", from)
    .lte("date", to)
    .order("date")
    .order("start_time")
  if (error) throw error
  return data
}

// Подсказки для формы: последние разные названия и все метки (свежие первыми)
export async function getActivityHints(): Promise<{ titles: string[]; tags: string[] }> {
  let rows: Pick<Activity, "title" | "tag">[]

  if (DEMO) {
    rows = [...demoStore.activities].reverse()
  } else {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("activities")
      .select("title, tag")
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) throw error
    rows = data
  }

  const titles: string[] = []
  const tags: string[] = []
  for (const { title, tag } of rows) {
    if (titles.length < 8 && !titles.includes(title)) titles.push(title)
    if (tag && !tags.includes(tag)) tags.push(tag)
  }
  return { titles, tags }
}

// Возвращает id новой записи — для «Отменить»
export async function addActivity(input: ActivityInput) {
  if (DEMO) {
    const id = crypto.randomUUID()
    demoStore.activities.push({ ...input, id, duration_min: activityMinutes(input.start_time, input.end_time) })
    return id
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from("activities").insert(input).select("id").single()
  if (error) throw error
  return data.id as string
}

export async function updateActivity(id: string, input: ActivityInput) {
  if (DEMO) {
    const a = demoStore.activities.find((a) => a.id === id)
    if (a) Object.assign(a, input, { duration_min: activityMinutes(input.start_time, input.end_time) })
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("activities").update(input).eq("id", id)
  if (error) throw error
}

export async function deleteActivity(id: string) {
  if (DEMO) {
    demoStore.activities = demoStore.activities.filter((a) => a.id !== id)
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("activities").delete().eq("id", id)
  if (error) throw error
}
