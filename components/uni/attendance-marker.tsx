"use client"

import { useState, useTransition } from "react"
import { Check, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { deleteAttendance, markAttendance } from "@/lib/actions/uni"
import { addDays } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { Attendance, Subject } from "@/lib/types"
import { t } from "@/messages/ru"

type Props = {
  subjects: Subject[] // только активные
  attendance: Attendance[] // отметки за сегодня и вчера
  today: string
}

// Быстрая отметка пар: выбрал день → нажал «Был» или «Не был» у предмета
export function AttendanceMarker({ subjects, attendance, today }: Props) {
  const [date, setDate] = useState(today)
  const [pending, startTransition] = useTransition()
  const yesterday = addDays(today, -1)

  const marked = attendance.filter((a) => a.date === date)
  const nameOf = (id: string) => subjects.find((s) => s.id === id)?.name ?? "—"

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action()
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">{t.uni.mark}</h2>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {[
            [today, t.entry.today],
            [yesterday, t.entry.yesterday],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setDate(value)}
              className={cn("rounded-md px-3 py-1.5 text-sm", date === value ? "bg-background" : "text-muted-foreground")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {subjects.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate">{s.name}</span>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => markAttendance(s.id, date, true))}
            className="h-12 w-20 text-emerald-400"
            aria-label={`${s.name}: ${t.uni.attended}`}
          >
            <Check className="size-5" /> {t.uni.attended}
          </Button>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => markAttendance(s.id, date, false))}
            className="h-12 w-24 text-red-400"
            aria-label={`${s.name}: ${t.uni.missed}`}
          >
            <X className="size-5" /> {t.uni.missed}
          </Button>
        </div>
      ))}

      {/* Что уже отмечено за выбранный день — нажатие на × удаляет ошибочную отметку */}
      <div className="flex flex-col gap-2 border-t pt-3">
        <span className="text-sm text-muted-foreground">{t.uni.marked}</span>
        {marked.length === 0 ? (
          <span className="text-sm text-muted-foreground">{t.uni.nothingMarked}</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {marked.map((a) => (
              <button
                key={a.id}
                disabled={pending}
                onClick={() => run(() => deleteAttendance(a.id))}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm",
                  a.attended ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                )}
              >
                {a.attended ? <Check className="size-4" /> : <X className="size-4" />}
                {nameOf(a.subject_id)}
                <X className="size-3.5 opacity-60" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
