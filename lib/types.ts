// Типы строк из базы. Даты — строки 'YYYY-MM-DD', так их отдаёт Postgres.

export type Direction = {
  id: string
  name: string
  color: string
  icon: string
  type: "general" | "university"
  archived: boolean
  sort_order: number
}

export type Session = {
  id: string
  direction_id: string
  date: string
  duration_min: number
  title: string | null
  note: string | null
}

// Показатели за день. Время — строки 'HH:MM:SS' (так отдаёт Postgres)
export type DailyMetrics = {
  date: string
  sleep_start: string | null
  sleep_end: string | null
  sleep_hours: number | null
  water_ml: number
  steps: number
}

export type Subject = {
  id: string
  name: string
  archived: boolean
}

export type Attendance = {
  id: string
  subject_id: string
  date: string
  attended: boolean
}

export const GRADE_KINDS = ["srs", "rk", "exam", "lab", "test", "homework", "other"] as const
export type GradeKind = (typeof GRADE_KINDS)[number]

export type Grade = {
  id: string
  subject_id: string
  date: string
  grade: number
  kind: GradeKind
  note: string | null
}

// То, что приходит из формы записи
export type SessionInput = Omit<Session, "id">
