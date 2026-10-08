import "server-only"
import { createClient } from "@/lib/supabase/server"
import { DEMO } from "@/lib/demo"
import { demoStore } from "@/lib/data/demo-store"
import type { Attendance, Grade, Subject } from "@/lib/types"

// Запросы для раздела «Универ»: предметы, посещаемость, оценки.
// Данных немного (десятки пар за семестр), поэтому грузим целиком и считаем в коде.

// Свежие сверху: по дате, внутри дня — последние добавленные
function newestFirst<T extends { date: string }>(list: T[]) {
  return [...list].reverse().sort((a, b) => b.date.localeCompare(a.date))
}

// ---------- Предметы ----------

export async function getSubjects(): Promise<Subject[]> {
  if (DEMO) return [...demoStore.subjects]

  const supabase = await createClient()
  const { data, error } = await supabase.from("uni_subjects").select("id, name, archived").order("created_at")
  if (error) throw error
  return data
}

export async function getSubject(id: string): Promise<Subject | null> {
  if (DEMO) return demoStore.subjects.find((s) => s.id === id) ?? null

  const supabase = await createClient()
  const { data } = await supabase.from("uni_subjects").select("id, name, archived").eq("id", id).maybeSingle()
  return data
}

export async function createSubject(name: string) {
  if (DEMO) {
    demoStore.subjects.push({ id: crypto.randomUUID(), name, archived: false })
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("uni_subjects").insert({ name })
  if (error) throw error
}

export async function updateSubject(id: string, patch: Partial<Pick<Subject, "name" | "archived">>) {
  if (DEMO) {
    const s = demoStore.subjects.find((s) => s.id === id)
    if (s) Object.assign(s, patch)
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("uni_subjects").update(patch).eq("id", id)
  if (error) throw error
}

// ---------- Посещаемость ----------

export async function getAttendance(subjectId?: string): Promise<Attendance[]> {
  if (DEMO) return newestFirst(demoStore.attendance.filter((a) => !subjectId || a.subject_id === subjectId))

  const supabase = await createClient()
  let query = supabase
    .from("attendance")
    .select("id, subject_id, date, attended")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
  if (subjectId) query = query.eq("subject_id", subjectId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function addAttendance(input: Omit<Attendance, "id">) {
  if (DEMO) {
    const id = crypto.randomUUID()
    demoStore.attendance.push({ ...input, id })
    return id
  }

  const supabase = await createClient()
  // .select("id") — чтобы получить id новой строки (нужен для «Отменить»)
  const { data, error } = await supabase.from("attendance").insert(input).select("id").single()
  if (error) throw error
  return data.id as string
}

export async function deleteAttendance(id: string) {
  if (DEMO) {
    demoStore.attendance = demoStore.attendance.filter((a) => a.id !== id)
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("attendance").delete().eq("id", id)
  if (error) throw error
}

// ---------- Оценки ----------

export async function getGrades(subjectId?: string): Promise<Grade[]> {
  if (DEMO) return newestFirst(demoStore.grades.filter((g) => !subjectId || g.subject_id === subjectId))

  const supabase = await createClient()
  let query = supabase
    .from("grades")
    .select("id, subject_id, date, grade, kind, note")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
  if (subjectId) query = query.eq("subject_id", subjectId)
  const { data, error } = await query
  if (error) throw error
  // numeric из Postgres может прийти строкой — приводим к числу
  return data.map((g) => ({ ...g, grade: Number(g.grade) }))
}

export async function addGrade(input: Omit<Grade, "id">) {
  if (DEMO) {
    const id = crypto.randomUUID()
    demoStore.grades.push({ ...input, id })
    return id
  }

  const supabase = await createClient()
  // .select("id") — чтобы получить id новой строки (нужен для «Отменить»)
  const { data, error } = await supabase.from("grades").insert(input).select("id").single()
  if (error) throw error
  return data.id as string
}

export async function deleteGrade(id: string) {
  if (DEMO) {
    demoStore.grades = demoStore.grades.filter((g) => g.id !== id)
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("grades").delete().eq("id", id)
  if (error) throw error
}
