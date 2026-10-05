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

// То, что приходит из формы записи
export type SessionInput = Omit<Session, "id">
