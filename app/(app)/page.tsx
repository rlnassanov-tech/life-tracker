import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DirectionCard } from "@/components/direction-card"
import { SessionDrawer } from "@/components/session-drawer"
import { getProfile } from "@/lib/auth"
import { getDirections } from "@/lib/data/directions"
import { getRecentTitles, getSessionsSince } from "@/lib/data/sessions"
import { formatDay, formatMinutes, weekStart } from "@/lib/dates"
import { getToday } from "@/lib/today"
import { t } from "@/messages/ru"

export default async function TodayPage() {
  const today = await getToday()
  // Запросы независимы — запускаем параллельно
  const [profile, directions, weekSessions, recentTitles] = await Promise.all([
    getProfile(),
    getDirections(),
    getSessionsSince(weekStart(today)),
    getRecentTitles(),
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
        <p className="text-sm text-muted-foreground first-letter:uppercase">{formatDay(today)}</p>
        <h1 className="text-2xl font-semibold">{t.today.greeting(profile.name!)}</h1>
        <p className="text-muted-foreground">
          {t.today.todayShort}: {formatMinutes(totalToday)}
        </p>
      </header>

      {/* Сюда на этапе 3 встанут вода / сон / шаги */}

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
