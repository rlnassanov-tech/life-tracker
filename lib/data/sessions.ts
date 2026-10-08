import "server-only"
import { createClient } from "@/lib/supabase/server"
import { DEMO } from "@/lib/demo"
import { demoStore } from "@/lib/data/demo-store"
import type { Session, SessionInput } from "@/lib/types"

// Все запросы к таблице sessions (записи по направлениям)

const COLUMNS = "id, direction_id, date, duration_min, title, note"

// Свежие сверху: по дате, внутри дня — по времени создания
function sortDemo(list: Session[]) {
  return [...list].reverse().sort((a, b) => b.date.localeCompare(a.date))
}

// Все записи начиная с даты from (и до to, если указано) — для сумм за неделю/месяц
export async function getSessionsSince(from: string, to?: string): Promise<Session[]> {
  if (DEMO) return sortDemo(demoStore.sessions.filter((s) => s.date >= from && (!to || s.date <= to)))

  const supabase = await createClient()
  let query = supabase
    .from("sessions")
    .select(COLUMNS)
    .gte("date", from)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
  if (to) query = query.lte("date", to)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Дни, в которые были записи, по каждому направлению (начиная с from) — для серий 🔥
export async function getActiveDays(from: string): Promise<Record<string, string[]>> {
  let rows: Pick<Session, "direction_id" | "date">[]

  if (DEMO) {
    rows = demoStore.sessions.filter((s) => s.date >= from)
  } else {
    const supabase = await createClient()
    const { data, error } = await supabase.from("sessions").select("direction_id, date").gte("date", from)
    if (error) throw error
    rows = data
  }

  const sets: Record<string, Set<string>> = {}
  for (const { direction_id, date } of rows) (sets[direction_id] ??= new Set()).add(date)
  return Object.fromEntries(Object.entries(sets).map(([id, set]) => [id, [...set]]))
}

// Дата последней записи по каждому направлению — чтобы найти заброшенные
export async function getLastSessionDates(): Promise<Record<string, string>> {
  let rows: Pick<Session, "direction_id" | "date">[]

  if (DEMO) {
    rows = sortDemo(demoStore.sessions)
  } else {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sessions")
      .select("direction_id, date")
      .order("date", { ascending: false })
      .limit(1000)
    if (error) throw error
    rows = data
  }

  // Список отсортирован от новых к старым, поэтому первая встреча — самая свежая дата
  const result: Record<string, string> = {}
  for (const { direction_id, date } of rows) result[direction_id] ??= date
  return result
}

// История одного направления (последние 200 записей)
export async function getDirectionSessions(directionId: string): Promise<Session[]> {
  if (DEMO) return sortDemo(demoStore.sessions.filter((s) => s.direction_id === directionId)).slice(0, 200)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sessions")
    .select(COLUMNS)
    .eq("direction_id", directionId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) throw error
  return data
}

// Последние 5 разных названий по каждому направлению — подсказки в форме записи
export async function getRecentTitles(): Promise<Record<string, string[]>> {
  let recent: Pick<Session, "direction_id" | "title">[]

  if (DEMO) {
    recent = sortDemo(demoStore.sessions).slice(0, 200)
  } else {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sessions")
      .select("direction_id, title")
      .not("title", "is", null)
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) throw error
    recent = data
  }

  const result: Record<string, string[]> = {}
  for (const { direction_id, title } of recent) {
    if (!title) continue
    const list = (result[direction_id] ??= [])
    if (list.length < 5 && !list.includes(title)) list.push(title)
  }
  return result
}

export async function addSession(input: SessionInput) {
  if (DEMO) {
    const id = crypto.randomUUID()
    demoStore.sessions.push({ ...input, id })
    return id
  }

  const supabase = await createClient()
  // .select("id") — чтобы получить id новой строки (нужен для «Отменить»)
  const { data, error } = await supabase.from("sessions").insert(input).select("id").single()
  if (error) throw error
  return data.id as string
}

export async function updateSession(id: string, input: SessionInput) {
  if (DEMO) {
    const s = demoStore.sessions.find((s) => s.id === id)
    if (s) Object.assign(s, input)
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("sessions").update(input).eq("id", id)
  if (error) throw error
}

export async function deleteSession(id: string) {
  if (DEMO) {
    demoStore.sessions = demoStore.sessions.filter((s) => s.id !== id)
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("sessions").delete().eq("id", id)
  if (error) throw error
}
