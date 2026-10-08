import Link from "next/link"
import { AlertTriangle, ChevronLeft, ChevronRight, Droplet, Footprints, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RING_COLORS, Ring, fmtHours, fmtShort } from "@/components/ring"
import { getProfile } from "@/lib/auth"
import { getDirections } from "@/lib/data/directions"
import { getMetricsRange } from "@/lib/data/metrics"
import { getLastSessionDates, getSessionsSince } from "@/lib/data/sessions"
import { addDays, daysBetween, formatDayMonth, formatMinutes, formatWeekday, weekStart } from "@/lib/dates"
import { getToday } from "@/lib/today"
import { t } from "@/messages/ru"

const NEGLECT_DAYS = 3 // столько дней без записей = «забросил»

export default async function WeekPage({ searchParams }: PageProps<"/week">) {
  const today = await getToday()
  const currentWeek = weekStart(today)

  // ?w=2026-09-28 — понедельник прошлой недели. Будущие недели не показываем
  const { w } = await searchParams
  const from = typeof w === "string" && /^\d{4}-\d{2}-\d{2}$/.test(w) && w < currentWeek ? weekStart(w) : currentWeek
  const to = addDays(from, 6)
  const isCurrent = from === currentWeek
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i))

  const [profile, directions, sessions, metrics, lastDates] = await Promise.all([
    getProfile(),
    getDirections(),
    getSessionsSince(from, to),
    getMetricsRange(from, to),
    getLastSessionDates(),
  ])

  // ---- Время: по направлениям и по дням ----
  const byDirection: Record<string, number> = {}
  const byDay: Record<string, Record<string, number>> = {} // день → направление → минуты
  for (const s of sessions) {
    byDirection[s.direction_id] = (byDirection[s.direction_id] ?? 0) + s.duration_min
    const day = (byDay[s.date] ??= {})
    day[s.direction_id] = (day[s.direction_id] ?? 0) + s.duration_min
  }
  const total = Object.values(byDirection).reduce((a, b) => a + b, 0)
  const dayTotal = (d: string) => Object.values(byDay[d] ?? {}).reduce((a, b) => a + b, 0)
  const maxDay = Math.max(1, ...days.map(dayTotal))

  // Направления с временем за неделю — от большего к меньшему (архивные тоже, если были записи)
  const ranked = directions.filter((d) => byDirection[d.id]).sort((a, b) => byDirection[b.id] - byDirection[a.id])
  const maxDirection = Math.max(1, ...ranked.map((d) => byDirection[d.id]))

  // ---- Средние показатели (только по дням, где что-то внесено) ----
  const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)
  const sleepValues = metrics.filter((m) => m.sleep_hours != null).map((m) => Number(m.sleep_hours))
  const waterValues = metrics.filter((m) => m.water_ml > 0).map((m) => m.water_ml)
  const stepsValues = metrics.filter((m) => m.steps > 0).map((m) => m.steps)
  // Кольцо заполняется к цели дня: сон — 8 ч, вода и шаги — цели из настроек
  const averages = [
    {
      icon: <Droplet className="size-3.5 text-sky-400" />,
      label: t.week.water,
      value: avg(waterValues),
      goal: profile.water_goal_ml,
      color: RING_COLORS.water,
      center: fmtShort,
      count: waterValues.length,
    },
    {
      icon: <Moon className="size-3.5 text-indigo-400" />,
      label: t.week.sleep,
      value: avg(sleepValues),
      goal: 8,
      color: RING_COLORS.sleep,
      center: fmtHours,
      count: sleepValues.length,
    },
    {
      icon: <Footprints className="size-3.5 text-emerald-400" />,
      label: t.week.steps,
      value: avg(stepsValues),
      goal: profile.steps_goal,
      color: RING_COLORS.steps,
      center: fmtShort,
      count: stepsValues.length,
    },
  ]

  // ---- Заброшенные: активные направления без записей 3+ дня (считаем от сегодня) ----
  const neglected = directions
    .filter((d) => !d.archived)
    .map((d) => ({ ...d, days: lastDates[d.id] ? daysBetween(lastDates[d.id], today) : null }))
    .filter((d) => d.days === null || d.days >= NEGLECT_DAYS)
    .sort((a, b) => (b.days ?? Infinity) - (a.days ?? Infinity))

  return (
    <div className="flex flex-col gap-6">
      {/* Заголовок и переключение недель */}
      <header className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="icon-lg" aria-label={t.week.prev}>
          <Link href={`/week?w=${addDays(from, -7)}`}>
            <ChevronLeft />
          </Link>
        </Button>
        <div className="text-center">
          <h1 className="text-2xl font-semibold">{t.nav.week}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDayMonth(from)} – {formatDayMonth(to)}
            {!isCurrent && (
              <Link href="/week" className="ml-2 underline">
                {t.week.current}
              </Link>
            )}
          </p>
        </div>
        <Button asChild={!isCurrent} variant="ghost" size="icon-lg" disabled={isCurrent} aria-label={t.week.next}>
          {isCurrent ? (
            <ChevronRight />
          ) : (
            <Link href={addDays(from, 7) === currentWeek ? "/week" : `/week?w=${addDays(from, 7)}`}>
              <ChevronRight />
            </Link>
          )}
        </Button>
      </header>

      {/* Подсветка заброшенных — только для текущей недели, иначе сбивает с толку */}
      {isCurrent && neglected.length > 0 && (
        <section className="flex flex-col gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <h2 className="flex items-center gap-2 font-medium text-amber-300">
            <AlertTriangle className="size-4" /> {t.week.neglected}
          </h2>
          {neglected.map((d) => (
            <Link key={d.id} href={`/directions/${d.id}`} className="flex items-center justify-between gap-2">
              <span>
                {d.icon} {d.name}
              </span>
              <span className="text-sm text-amber-200/80">
                {d.days === null ? t.week.never : t.week.neglectedDays(d.days)}
              </span>
            </Link>
          ))}
        </section>
      )}

      {/* Средние за день — кольцами, как на «Сегодня» */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-muted-foreground">{t.week.averages}</h2>
        <div className="grid grid-cols-3 gap-2">
          {averages.map((a) => (
            <div key={a.label} className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3">
              <Ring value={a.value ?? 0} max={a.goal} color={a.color} center={a.value === null ? "—" : a.center(a.value)} />
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {a.icon} {a.label}
              </span>
              <span className="text-xs text-muted-foreground">{t.week.daysWithData(a.count)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-card p-4">
        <div>
          <div className="text-sm text-muted-foreground">{t.week.total}</div>
          <div className="text-2xl font-semibold">{formatMinutes(total)}</div>
        </div>

        {/* Столбики по дням: высота = минуты за день, цветные части = направления */}
        <div className="flex h-36 items-end gap-2">
          {days.map((d) => {
            const dayMin = dayTotal(d)
            return (
              <div key={d} className="flex h-full flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 flex-col justify-end">
                  <div
                    className="flex w-full flex-col-reverse overflow-hidden rounded-md bg-muted"
                    style={{ height: `${Math.max(dayMin ? 4 : 2, (dayMin / maxDay) * 100)}%` }}
                    title={formatMinutes(dayMin)}
                  >
                    {directions
                      .filter((dir) => byDay[d]?.[dir.id])
                      .map((dir) => (
                        <div
                          key={dir.id}
                          style={{ height: `${(byDay[d][dir.id] / dayMin) * 100}%`, backgroundColor: dir.color }}
                        />
                      ))}
                  </div>
                </div>
                <span className={d === today ? "text-xs font-semibold" : "text-xs text-muted-foreground"}>
                  {formatWeekday(d)}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Полосы по направлениям */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-muted-foreground">{t.week.byDirection}</h2>
        {ranked.length === 0 && <p className="text-muted-foreground">{t.week.empty}</p>}
        {ranked.map((d) => (
          <Link key={d.id} href={`/directions/${d.id}`} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>
                {d.icon} {d.name}
              </span>
              <span className="text-muted-foreground">
                {formatMinutes(byDirection[d.id])} · {Math.round((byDirection[d.id] / total) * 100)}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${(byDirection[d.id] / maxDirection) * 100}%`, backgroundColor: d.color }}
              />
            </div>
          </Link>
        ))}
      </section>

    </div>
  )
}
