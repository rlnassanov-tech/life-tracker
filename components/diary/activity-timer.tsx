"use client"

import { useState } from "react"
import { Play, Square, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ActivityDrawer, type DiaryData } from "@/components/diary/activity-drawer"
import { clearTimer, formatElapsed, startTimer, useNowSeconds, useTimer } from "@/lib/timer"
import { t } from "@/messages/ru"

const toHHMM = (ms: number) => {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

// «Засечь время»: старт сейчас → стоп открывает шторку записи с уже заполненным «с — по»
export function ActivityTimer(diary: DiaryData) {
  const timer = useTimer()
  const now = useNowSeconds(!!timer)
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<{ start: string; end: string } | null>(null)

  function stop() {
    if (!timer) return
    setRange({ start: toHHMM(timer.startedAt), end: toHHMM(Date.now()) })
    setOpen(true)
  }

  return (
    <>
      {timer ? (
        <div className="flex items-center gap-2 rounded-2xl bg-orange-500/15 p-3 pl-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm text-muted-foreground">
              {t.diary.timerSince} {toHHMM(timer.startedAt)}
            </div>
            <div className="text-2xl font-semibold tabular-nums">{formatElapsed(now - Math.floor(timer.startedAt / 1000))}</div>
          </div>
          <Button onClick={stop} className="h-12 px-5 text-base">
            <Square className="size-4" /> {t.timer.stop}
          </Button>
          <Button variant="ghost" size="icon-lg" onClick={() => confirm(t.timer.resetConfirm) && clearTimer()} aria-label={t.timer.reset}>
            <X />
          </Button>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => startTimer()} className="h-12 text-base">
          <Play className="size-4" /> {t.diary.timerStart}
        </Button>
      )}
      {range && (
        <ActivityDrawer {...diary} open={open} onOpenChange={setOpen} defaults={range} onSaved={clearTimer} />
      )}
    </>
  )
}
