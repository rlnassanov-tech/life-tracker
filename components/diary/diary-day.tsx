import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ActivityDrawer, type DiaryData } from "@/components/diary/activity-drawer"
import { ActivityTimer } from "@/components/diary/activity-timer"
import { formatMinutes, hhmm } from "@/lib/dates"
import { tagColor } from "@/lib/tags"
import type { Activity } from "@/lib/types"
import { t } from "@/messages/ru"

// Дневник дня: лента занятий по времени + кнопки «Записать» и «Засечь время»
export function DiaryDay({ activities, ...diary }: DiaryData & { activities: Activity[] }) {
  const total = activities.reduce((sum, a) => sum + a.duration_min, 0)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm text-muted-foreground">{t.diary.title}</h2>
        {total > 0 && <span className="text-sm text-muted-foreground">{t.diary.total(formatMinutes(total))}</span>}
      </div>

      {activities.length === 0 && <p className="text-muted-foreground">{t.diary.empty}</p>}

      {/* Лента: полоска цвета метки слева, время, что делал, метка, длительность */}
      <ol className="flex flex-col gap-2">
        {activities.map((a) => (
          <li key={a.id}>
            <ActivityDrawer
              {...diary}
              activity={a}
              trigger={
                <button
                  className="flex w-full items-start gap-3 rounded-xl border-l-4 bg-card p-3 text-left"
                  style={{ borderLeftColor: tagColor(a.tag) }}
                >
                  <span className="w-[4.5rem] shrink-0 text-sm leading-6 text-muted-foreground tabular-nums">
                    {hhmm(a.start_time)}–{hhmm(a.end_time)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block leading-6">{a.title}</span>
                    {a.tag && (
                      <span className="text-sm" style={{ color: tagColor(a.tag) }}>
                        #{a.tag}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm leading-6 font-medium tabular-nums">{formatMinutes(a.duration_min)}</span>
                </button>
              }
            />
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-2 gap-3">
        <ActivityDrawer
          {...diary}
          trigger={
            <Button className="h-12 text-base">
              <Plus className="size-5" /> {t.diary.add}
            </Button>
          }
        />
        <ActivityTimer {...diary} />
      </div>
    </section>
  )
}
