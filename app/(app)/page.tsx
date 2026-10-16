import { DiaryDay } from "@/components/diary/diary-day"
import { MetricsBar } from "@/components/metrics-bar"
import { getProfile } from "@/lib/auth"
import { getActivities, getActivityHints } from "@/lib/data/activities"
import { getLastSleep, getMetrics } from "@/lib/data/metrics"
import { formatMinutes } from "@/lib/dates"
import { getToday } from "@/lib/today"
import { t } from "@/messages/ru"

export default async function TodayPage({ searchParams }: PageProps<"/">) {
  const today = await getToday()
  // ?d=2026-10-03 — прошлый день (показатели и дневник). Будущее не пускаем
  const { d } = await searchParams
  const day = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && d < today ? d : today

  // Запросы независимы — запускаем параллельно
  const [profile, metrics, lastSleep, activities, hints] = await Promise.all([
    getProfile(),
    getMetrics(day),
    getLastSleep(),
    getActivities(day, day),
    getActivityHints(),
  ])

  const total = activities.reduce((sum, a) => sum + a.duration_min, 0)
  // Конец последнего занятия — новое по умолчанию начнётся с него
  const lastEnd = activities.length ? activities.reduce((a, b) => (a.end_time > b.end_time ? a : b)).end_time : null

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{t.today.greeting(profile.name!)}</p>
          <h1 className="text-3xl font-semibold">{t.nav.today}</h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums">{formatMinutes(total)}</div>
          <div className="text-xs text-muted-foreground">{t.today.totalHint}</div>
        </div>
      </header>

      {/* key={day}: при смене дня блок создаётся заново, и формы берут значения нового дня */}
      <MetricsBar key={day} date={day} today={today} metrics={metrics} goals={profile} lastSleep={lastSleep} />

      <DiaryDay activities={activities} today={day} hints={hints} lastEnd={lastEnd} />
    </div>
  )
}
