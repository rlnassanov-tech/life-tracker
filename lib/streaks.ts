import { addDays } from "@/lib/dates"

// Серия = сколько дней подряд были записи.
// Если сегодня ещё не занимался, серия не сгорает: считаем до вчера (до конца дня есть время).
export function currentStreak(days: string[] | undefined, today: string) {
  if (!days?.length) return 0
  const set = new Set(days)
  let day = set.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (set.has(day)) {
    streak++
    day = addDays(day, -1)
  }
  return streak
}

// Самая длинная серия за всё время
export function bestStreak(days: string[] | undefined) {
  if (!days?.length) return 0
  const sorted = [...days].sort()
  let best = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    run = addDays(sorted[i - 1], 1) === sorted[i] ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}
