import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SessionDrawer } from "@/components/session-drawer"
import { getDirection, getDirections } from "@/lib/data/directions"
import { getDirectionSessions, getRecentTitles } from "@/lib/data/sessions"
import { formatDay, formatMinutes, monthStart, weekStart } from "@/lib/dates"
import { bestStreak, currentStreak } from "@/lib/streaks"
import { getToday } from "@/lib/today"
import type { Session } from "@/lib/types"
import { t } from "@/messages/ru"

export default async function DirectionPage({ params }: PageProps<"/directions/[id]">) {
  const { id } = await params
  const today = await getToday()
  const [direction, directions, sessions, recentTitles] = await Promise.all([
    getDirection(id),
    getDirections(),
    getDirectionSessions(id),
    getRecentTitles(),
  ])
  if (!direction) notFound()

  const sum = (from: string) => sessions.filter((s) => s.date >= from).reduce((a, s) => a + s.duration_min, 0)

  const days = sessions.map((s) => s.date)
  const streak = currentStreak(days, today)
  const best = bestStreak(days)

  // Группируем историю по дням (записи уже отсортированы, свежие сверху)
  const byDay = new Map<string, Session[]>()
  for (const s of sessions) byDay.set(s.date, [...(byDay.get(s.date) ?? []), s])

  const drawer = { directions: directions.filter((d) => !d.archived), recentTitles, today }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/" className="-ml-1 flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> {t.direction.back}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{direction.icon}</span>
          <div>
            <h1 className="text-2xl font-semibold">{direction.name}</h1>
            {direction.archived && <p className="text-sm text-muted-foreground">{t.direction.archived}</p>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {[
          [t.direction.week, sum(weekStart(today))],
          [t.direction.month, sum(monthStart(today))],
        ].map(([label, min]) => (
          <div key={label} className="rounded-2xl bg-card p-4" style={{ borderTop: `3px solid ${direction.color}` }}>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-xl font-semibold">{formatMinutes(min as number)}</div>
          </div>
        ))}
        <div className="col-span-2 flex items-center justify-between rounded-2xl bg-card p-4">
          <span className="text-sm text-muted-foreground">{t.streak.title}</span>
          <span>
            <span className="text-xl font-semibold">
              {streak >= 1 ? "🔥 " : ""}
              {t.streak.days(streak)}
            </span>
            <span className="text-sm text-muted-foreground"> · {t.streak.best(best)}</span>
          </span>
        </div>
      </div>

      {!direction.archived && (
        <SessionDrawer
          {...drawer}
          defaultDirectionId={direction.id}
          trigger={
            <Button className="h-14 text-lg">
              <Plus className="size-5" /> {t.today.addEntry}
            </Button>
          }
        />
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-sm text-muted-foreground">{t.direction.history}</h2>
        {sessions.length === 0 && <p className="text-muted-foreground">{t.direction.empty}</p>}
        {[...byDay].map(([date, list]) => (
          <div key={date} className="flex flex-col gap-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="first-letter:uppercase">{formatDay(date)}</span>
              <span>{formatMinutes(list.reduce((a, s) => a + s.duration_min, 0))}</span>
            </div>
            {list.map((s) => (
              <SessionDrawer
                key={s.id}
                {...drawer}
                session={s}
                trigger={
                  <button className="flex w-full items-start justify-between gap-3 rounded-xl bg-card p-4 text-left">
                    <div className="min-w-0">
                      <div className="truncate">{s.title || "—"}</div>
                      {s.note && <div className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{s.note}</div>}
                    </div>
                    <span className="shrink-0 font-medium">{formatMinutes(s.duration_min)}</span>
                  </button>
                }
              />
            ))}
          </div>
        ))}
      </section>
    </div>
  )
}
