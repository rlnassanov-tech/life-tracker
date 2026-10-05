import { DEFAULT_TZ, addDays, todayIn } from "@/lib/dates"
import type { Direction, Session } from "@/lib/types"

// Данные демо-режима. Живут в памяти сервера и пропадают при его перезапуске.

type DemoStore = { directions: Direction[]; sessions: Session[] }

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

  return { directions, sessions }
}

// globalThis — чтобы данные не сбрасывались при горячей перезагрузке кода в dev
const g = globalThis as unknown as { demoStore?: DemoStore }
export const demoStore = (g.demoStore ??= seed())
