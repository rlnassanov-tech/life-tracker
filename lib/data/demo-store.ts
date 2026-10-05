import { DEFAULT_TZ, addDays, sleepHours, todayIn } from "@/lib/dates"
import type { Attendance, DailyMetrics, Direction, Grade, Session, Subject } from "@/lib/types"

// Данные демо-режима. Живут в памяти сервера и пропадают при его перезапуске.

type DemoStore = {
  directions: Direction[]
  sessions: Session[]
  metrics: DailyMetrics[]
  subjects: Subject[]
  attendance: Attendance[]
  grades: Grade[]
}

function seed(): DemoStore {
  const directions: Direction[] = [
    { id: "d-uni", name: "Универ", icon: "🎓", color: "#3b82f6", type: "university", archived: false, sort_order: 0 },
    { id: "d-lang", name: "Языки", icon: "🗣️", color: "#22c55e", type: "general", archived: false, sort_order: 1 },
    { id: "d-piano", name: "Пианино", icon: "🎹", color: "#a855f7", type: "general", archived: false, sort_order: 2 },
    { id: "d-code", name: "Вайбкодинг", icon: "💻", color: "#f97316", type: "general", archived: false, sort_order: 3 },
  ]

  const today = todayIn(DEFAULT_TZ)
  const sessions: Session[] = []
  const add = (daysAgo: number, direction_id: string, duration_min: number, title: string) =>
    sessions.push({
      id: crypto.randomUUID(),
      direction_id,
      date: addDays(today, -daysAgo),
      duration_min,
      title,
      note: null,
    })

  // Две недели примерных записей
  for (let i = 0; i < 14; i++) {
    if (i % 7 !== 5 && i % 7 !== 6) add(i, "d-uni", 90 + (i % 3) * 45, ["Матан", "Физика", "Домашка"][i % 3])
    if (i % 4 !== 3) add(i, "d-lang", 20 + (i % 3) * 10, i % 2 ? "Anki" : "Английский: сериал")
    if (i >= 4 && i % 2 === 0) add(i, "d-piano", 30, i % 4 ? "Гаммы" : "Этюд Черни") // заброшено 4 дня
    if (i % 3 !== 2) add(i, "d-code", 60 + (i % 4) * 20, "Трекер жизни")
  }

  // Показатели: сон, вода, шаги за те же две недели
  const metrics: DailyMetrics[] = []
  for (let i = 0; i < 14; i++) {
    const sleep_start = ["23:30:00", "00:15:00", "23:00:00", "01:00:00"][i % 4]
    const sleep_end = ["07:00:00", "07:30:00", "08:15:00"][i % 3]
    metrics.push({
      date: addDays(today, -i),
      sleep_start,
      sleep_end,
      sleep_hours: sleepHours(sleep_start, sleep_end),
      water_ml: i === 0 ? 750 : 1250 + (i % 4) * 250,
      steps: i === 0 ? 3200 : 5000 + ((i * 1700) % 6000),
    })
  }

  // Универ: предметы, пары за две недели (кроме выходных), несколько оценок
  const subjects: Subject[] = [
    { id: "s-math", name: "Матан", archived: false },
    { id: "s-phys", name: "Физика", archived: false },
    { id: "s-eng", name: "Английский", archived: false },
    { id: "s-hist", name: "История Казахстана", archived: false },
  ]
  const attendance: Attendance[] = []
  for (let i = 1; i < 14; i++) {
    const date = addDays(today, -i)
    const weekday = new Date(date + "T00:00:00Z").getUTCDay()
    if (weekday === 0 || weekday === 6) continue // в выходные пар нет
    subjects.forEach((s, k) => {
      if ((i + k) % 2 === 0) {
        attendance.push({ id: crypto.randomUUID(), subject_id: s.id, date, attended: (i * 3 + k) % 7 !== 0 })
      }
    })
  }
  const grades: Grade[] = [
    { id: crypto.randomUUID(), subject_id: "s-math", date: addDays(today, -10), grade: 88, kind: "srs", note: null },
    { id: crypto.randomUUID(), subject_id: "s-math", date: addDays(today, -3), grade: 92, kind: "test", note: null },
    { id: crypto.randomUUID(), subject_id: "s-phys", date: addDays(today, -6), grade: 74, kind: "lab", note: "Лаба №3" },
    { id: crypto.randomUUID(), subject_id: "s-eng", date: addDays(today, -2), grade: 97, kind: "homework", note: null },
  ]

  return { directions, sessions, metrics, subjects, attendance, grades }
}

// globalThis — чтобы данные не сбрасывались при горячей перезагрузке кода в dev.
// Если в коде появилась новая коллекция (store старой версии) — пересоздаём.
const g = globalThis as unknown as { demoStore?: DemoStore }
if (!g.demoStore?.grades) g.demoStore = seed()
export const demoStore = g.demoStore
