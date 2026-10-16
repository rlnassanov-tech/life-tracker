import Link from "next/link"
import { ChevronLeft, ChevronRight, Droplet, Footprints, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RING_COLORS, Ring, fmtHours, fmtShort } from "@/components/ring"
import { getProfile } from "@/lib/auth"
import { getActivities } from "@/lib/data/activities"
import { getMetricsRange } from "@/lib/data/metrics"
import { addDays, formatDayMonth, formatMinutes, formatWeekday, weekStart } from "@/lib/dates"
import { tagColor } from "@/lib/tags"
import { getToday } from "@/lib/today"
import { t } from "@/messages/ru"

export default async function WeekPage({ searchParams }: PageProps<"/week">) {
  const today = await getToday()
  const currentWeek = weekStart(today)

  // ?w=2026-09-28 — понедельник прошлой недели. Будущие недели не показываем
  const { w } = await searchParams
  const from = typeof w === "string" && /^\d{4}-\d{2}-\d{2}$/.test(w) && w < currentWeek ? weekStart(w) : currentWeek
  const to = addDays(from, 6)
  const isCurrent = from === currentWeek
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i))

  const [profile, activities, metrics] = await Promise.all([
    getProfile(),
    getActivities(from, to),
    getMetricsRange(from, to),
  ])

  // ---- Время: по меткам и по дням (из дневника) ----
  const NO_TAG = "" // ключ для записей без метки
  const byTag: Record<string, number> = {}
  const byDay: Record<string, Record<string, number>> = {} // день → метка → минуты
  for (const a of activities) {
    const tag = a.tag ?? NO_TAG
    byTag[tag] = (byTag[tag] ?? 0) + a.duration_min
    const day = (byDay[a.date] ??= {})
    day[tag] = (day[tag] ?? 0) + a.duration_min
  }
  const total = Object.values(byTag).reduce((x, y) => x + y, 0)
  const dayTotal = (d: string) => Object.values(byDay[d] ?? {}).reduce((x, y) => x + y, 0)
  const maxDay = Math.max(1, ...days.map(dayTotal))

  // Метки от большего времени к меньшему; «без метки» — в конце
  const ranked = Object.keys(byTag).sort((x, y) => (x === NO_TAG ? 1 : y === NO_TAG ? -1 : byTag[y] - byTag[x]))
  const maxTag = Math.max(1, ...ranked.map((tag) => byTag[tag]))
  const tagLabel = (tag: string) => (tag === NO_TAG ? t.diary.noTag : `#${tag}`)

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
                    {ranked
                      .filter((tag) => byDay[d]?.[tag])
                      .map((tag) => (
                        <div
                          key={tag}
                          style={{ height: `${(byDay[d][tag] / dayMin) * 100}%`, backgroundColor: tagColor(tag || null) }}
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

      {/* Полосы по меткам */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-muted-foreground">{t.diary.byTag}</h2>
        {ranked.length === 0 && <p className="text-muted-foreground">{t.week.empty}</p>}
        {ranked.map((tag) => (
          <div key={tag} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: tag ? tagColor(tag) : undefined }}>{tagLabel(tag)}</span>
              <span className="text-muted-foreground">
                {formatMinutes(byTag[tag])} · {Math.round((byTag[tag] / total) * 100)}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${(byTag[tag] / maxTag) * 100}%`, backgroundColor: tagColor(tag || null) }}
              />
            </div>
          </div>
        ))}
      </section>

    </div>
  )
}
