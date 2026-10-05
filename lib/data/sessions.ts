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

// Все записи начиная с даты from (для сумм за неделю/месяц)
export async function getSessionsSince(from: string): Promise<Session[]> {
  if (DEMO) return sortDemo(demoStore.sessions.filter((s) => s.date >= from))

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sessions")
    .select(COLUMNS)
    .gte("date", from)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
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
    demoStore.sessions.push({ ...input, id: crypto.randomUUID() })
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("sessions").insert(input)
  if (error) throw error
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
