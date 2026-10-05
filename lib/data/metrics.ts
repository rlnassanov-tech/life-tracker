import "server-only"
import { createClient } from "@/lib/supabase/server"
import { DEMO } from "@/lib/demo"
import { demoStore } from "@/lib/data/demo-store"
import { sleepHours } from "@/lib/dates"
import type { DailyMetrics } from "@/lib/types"

// Запросы к daily_metrics: одна строка на день

const COLUMNS = "date, sleep_start, sleep_end, sleep_hours, water_ml, steps"

export function emptyMetrics(date: string): DailyMetrics {
  return { date, sleep_start: null, sleep_end: null, sleep_hours: null, water_ml: 0, steps: 0 }
}

// Показатели за день (если строки ещё нет — пустые)
export async function getMetrics(date: string): Promise<DailyMetrics> {
  if (DEMO) return demoStore.metrics.find((m) => m.date === date) ?? emptyMetrics(date)

  const supabase = await createClient()
  const { data, error } = await supabase.from("daily_metrics").select(COLUMNS).eq("date", date).maybeSingle()
  if (error) throw error
  return data ?? emptyMetrics(date)
}

// Показатели за период — для экрана недели (этап 5)
export async function getMetricsRange(from: string, to: string): Promise<DailyMetrics[]> {
  if (DEMO) return demoStore.metrics.filter((m) => m.date >= from && m.date <= to)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("daily_metrics")
    .select(COLUMNS)
    .gte("date", from)
    .lte("date", to)
    .order("date")
  if (error) throw error
  return data
}

// Последнее внесённое время сна — подставляем его в форму по умолчанию
export async function getLastSleep(): Promise<{ start: string; end: string } | null> {
  let row: Pick<DailyMetrics, "sleep_start" | "sleep_end"> | undefined

  if (DEMO) {
    row = [...demoStore.metrics].sort((a, b) => b.date.localeCompare(a.date)).find((m) => m.sleep_start && m.sleep_end)
  } else {
    const supabase = await createClient()
    const { data } = await supabase
      .from("daily_metrics")
      .select("sleep_start, sleep_end")
      .not("sleep_start", "is", null)
      .not("sleep_end", "is", null)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle()
    row = data ?? undefined
  }

  return row?.sleep_start && row.sleep_end ? { start: row.sleep_start, end: row.sleep_end } : null
}

type Patch = Partial<Pick<DailyMetrics, "sleep_start" | "sleep_end" | "water_ml" | "steps">>

// Создать или обновить строку за день («upsert» = insert или update)
export async function saveMetrics(date: string, patch: Patch) {
  if (DEMO) {
    let m = demoStore.metrics.find((m) => m.date === date)
    if (!m) demoStore.metrics.push((m = emptyMetrics(date)))
    Object.assign(m, patch)
    m.sleep_hours = m.sleep_start && m.sleep_end ? sleepHours(m.sleep_start, m.sleep_end) : null
    return
  }

  const supabase = await createClient()
  // user_id подставит база (default auth.uid()), конфликт ищем по паре user_id + date
  const { error } = await supabase.from("daily_metrics").upsert({ date, ...patch }, { onConflict: "user_id,date" })
  if (error) throw error
}
