import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DirectionCard } from "@/components/direction-card"
import { MetricsBar } from "@/components/metrics-bar"
import { SessionDrawer } from "@/components/session-drawer"
import { getProfile } from "@/lib/auth"
import { getDirections } from "@/lib/data/directions"
import { getLastSleep, getMetrics } from "@/lib/data/metrics"
import { getRecentTitles, getSessionsSince } from "@/lib/data/sessions"
import { formatMinutes, weekStart } from "@/lib/dates"
import { getToday } from "@/lib/today"
import { t } from "@/messages/ru"

export default async function TodayPage({ searchParams }: PageProps<"/">) {
  const today = await getToday()
  // ?d=2026-10-03 — показатели за прошлый день (будущее не пускаем)
  const { d } = await searchParams
  const metricsDate = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && d < today ? d : today

  // Запросы независимы — запускаем параллельно
  const [profile, directions, weekSessions, recentTitles, metrics, lastSleep] = await Promise.all([
    getProfile(),
    getDirections(),
    getSessionsSince(weekStart(today)),
    getRecentTitles(),
    getMetrics(metricsDate),
    getLastSleep(),
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

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">{t.today.greeting(profile.name!)}</h1>
        <p className="text-muted-foreground">
          {t.today.todayShort}: {formatMinutes(totalToday)}
        </p>
      </header>

      {/* key={metricsDate}: при смене дня блок создаётся заново, и формы берут значения нового дня */}
      <MetricsBar key={metricsDate} date={metricsDate} today={today} metrics={metrics} goals={profile} lastSleep={lastSleep} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-muted-foreground">{t.today.directions}</h2>
        {active.length === 0 && <p className="text-muted-foreground">{t.today.empty}</p>}
        {active.map((d) => (
          <DirectionCard
            key={d.id}
            direction={d}
            todayMin={todayMin[d.id] ?? 0}
            weekMin={weekMin[d.id] ?? 0}
            {...drawer}
          />
        ))}
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
