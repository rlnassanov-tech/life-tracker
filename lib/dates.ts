// Работа с датами. Все даты — строки 'YYYY-MM-DD' без времени,
// поэтому их можно сравнивать как строки: '2026-10-05' < '2026-10-12'.

export const DEFAULT_TZ = "Asia/Almaty"

// Сегодняшняя дата в часовом поясе пользователя
export function todayIn(timeZone: string) {
  // Локаль en-CA форматирует дату как YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date())
}

// Арифметика в UTC, чтобы переход на летнее время не сдвигал дни
function toUTC(date: string) {
  return new Date(date + "T00:00:00Z")
}

export function addDays(date: string, days: number) {
  const d = toUTC(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// Понедельник недели, в которую входит date
export function weekStart(date: string) {
  const day = toUTC(date).getUTCDay() // 0 = вс, 1 = пн …
  return addDays(date, -((day + 6) % 7))
}

export function monthStart(date: string) {
  return date.slice(0, 8) + "01"
}

// «пн, 5 окт»
export function formatDay(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(toUTC(date))
}

// 95 → «1 ч 35 мин», 40 → «40 мин», 0 → «0 мин»
export function formatMinutes(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}
