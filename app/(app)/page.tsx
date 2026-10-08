import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DirectionCard } from "@/components/direction-card"
import { MetricsBar } from "@/components/metrics-bar"
import { SessionDrawer } from "@/components/session-drawer"
import { TimerBanner } from "@/components/timer"
import { getProfile } from "@/lib/auth"
import { getDirections } from "@/lib/data/directions"
import { getLastSleep, getMetrics } from "@/lib/data/metrics"
import { getActiveDays, getRecentTitles, getSessionsSince } from "@/lib/data/sessions"
import { addDays, daysBetween, formatMinutes, weekStart } from "@/lib/dates"
import { currentStreak } from "@/lib/streaks"
import { getToday } from "@/lib/today"
import { t } from "@/messages/ru"

export default async function TodayPage({ searchParams }: PageProps<"/">) {
  const today = await getToday()
  // ?d=2026-10-03 — показатели за прошлый день (будущее не пускаем)
  const { d } = await searchParams
  const metricsDate = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && d < today ? d : today

  // Запросы независимы — запускаем параллельно
  const [profile, directions, weekSessions, recentTitles, metrics, lastSleep, activeDays] = await Promise.all([
    getProfile(),
    getDirections(),
    getSessionsSince(weekStart(today)),
    getRecentTitles(),
    getMetrics(metricsDate),
    getLastSleep(),
    getActiveDays(addDays(today, -365)), // дни с записями за год — для серий 🔥
  ])

  const active = directions.filter((d) => !d.archived)

  // Суммы минут по направлениям: за сегодня и за неделю
  const todayMin: Record<string, number> = {}
  const weekMin: Record<string, number> = {}
  for (const s of weekSessions) {
    weekMin[s.direction_id] = (weekMin[s.direction_id] ?? 0) + s.duration_min
    if (s.date === today) todayMin[s.direction_id] = (todayMin[s.direction_id] ?? 0) + s.duration_min
  }
  const totalToday = Object.values(todayMin).reduce((a, b) => a + b, 0)

  const drawer = { directions: active, recentTitles, today }

  // Сколько дней без записей (по последнему активному дню). null — записей не было
  const idleDays = (id: string) => {
    const days = activeDays[id]
    return days?.length ? daysBetween(days.reduce((a, b) => (a > b ? a : b)), today) : null
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{t.today.greeting(profile.name!)}</p>
          <h1 className="text-3xl font-semibold">{t.nav.today}</h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums">{formatMinutes(totalToday)}</div>
          <div className="text-xs text-muted-foreground">{t.today.totalHint}</div>
        </div>
      </header>

      <TimerBanner {...drawer} />

      {/* key={metricsDate}: при смене дня блок создаётся заново, и формы берут значения нового дня */}
      <MetricsBar key={metricsDate} date={metricsDate} today={today} metrics={metrics} goals={profile} lastSleep={lastSleep} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-muted-foreground">{t.today.directions}</h2>
        {active.length === 0 && <p className="text-muted-foreground">{t.today.empty}</p>}
        <div className="grid grid-cols-2 gap-3">
          {active.map((d) => (
            <DirectionCard
              key={d.id}
              direction={d}
              todayMin={todayMin[d.id] ?? 0}
              weekMin={weekMin[d.id] ?? 0}
              streak={currentStreak(activeDays[d.id], today)}
              idleDays={idleDays(d.id)}
              {...drawer}
            />
          ))}
        </div>
      </section>

      {active.length > 0 && (
        <SessionDrawer
          {...drawer}
          trigger={
            <Button className="h-14 text-lg">
              <Plus className="size-5" /> {t.today.addEntry}
            </Button>
          }
        />
      )}
    </div>
  )
}
