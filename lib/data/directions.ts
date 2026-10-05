import "server-only"
import { createClient } from "@/lib/supabase/server"
import { DEMO } from "@/lib/demo"
import { demoStore } from "@/lib/data/demo-store"
import type { Direction } from "@/lib/types"

// Все запросы к таблице directions. Фильтр по user_id не нужен:
// RLS в базе сама отдаёт только строки текущего пользователя.

const COLUMNS = "id, name, color, icon, type, archived, sort_order"

export async function getDirections(): Promise<Direction[]> {
  if (DEMO) return [...demoStore.directions].sort((a, b) => a.sort_order - b.sort_order)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("directions")
    .select(COLUMNS)
    .order("sort_order")
    .order("created_at")
  if (error) throw error
  return data as Direction[]
}

export async function getDirection(id: string): Promise<Direction | null> {
  if (DEMO) return demoStore.directions.find((d) => d.id === id) ?? null

  const supabase = await createClient()
  const { data } = await supabase.from("directions").select(COLUMNS).eq("id", id).maybeSingle()
  return data as Direction | null
}

export async function createDirection(input: Pick<Direction, "name" | "icon" | "color">) {
  const all = await getDirections()
  const sort_order = Math.max(-1, ...all.map((d) => d.sort_order)) + 1

  if (DEMO) {
    demoStore.directions.push({ ...input, id: crypto.randomUUID(), type: "general", archived: false, sort_order })
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("directions").insert({ ...input, sort_order })
  if (error) throw error
}

export async function updateDirection(
  id: string,
  patch: Partial<Pick<Direction, "name" | "icon" | "color" | "archived" | "sort_order">>
) {
  if (DEMO) {
    const d = demoStore.directions.find((d) => d.id === id)
    if (d) Object.assign(d, patch)
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("directions").update(patch).eq("id", id)
  if (error) throw error
}
