import type { Attendance, Grade } from "@/lib/types"

// Буквенная оценка по 100-балльной шкале (как в вузах Казахстана)
const LETTERS: [number, string][] = [
  [95, "A"], [90, "A-"], [85, "B+"], [80, "B"], [75, "B-"], [70, "C+"],
  [65, "C"], [60, "C-"], [55, "D+"], [50, "D"], [0, "F"],
]

export function letter(grade: number) {
  return LETTERS.find(([min]) => grade >= min)![1]
}

// Цвет процента посещаемости: зелёный ≥ 80, жёлтый ≥ 60, иначе красный
export function percentColor(percent: number | null) {
  if (percent === null) return "text-muted-foreground"
  if (percent >= 80) return "text-emerald-400"
  if (percent >= 60) return "text-yellow-400"
  return "text-red-400"
}

// Сводка по предмету: посещаемость и средний балл
export function subjectStats(attendance: Attendance[], grades: Grade[]) {
  const attended = attendance.filter((a) => a.attended).length
  const total = attendance.length
  const avg = grades.length ? grades.reduce((s, g) => s + Number(g.grade), 0) / grades.length : null
  return {
    attended,
    total,
    percent: total ? Math.round((attended / total) * 100) : null,
    avg: avg === null ? null : Math.round(avg * 10) / 10,
  }
}
