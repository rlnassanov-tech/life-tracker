"use client"

import { useState } from "react"
import { Play, Square, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SessionDrawer } from "@/components/session-drawer"
import { clearTimer, elapsedMinutes, formatElapsed, startTimer, useNowSeconds, useTimer, type Timer } from "@/lib/timer"
import type { Direction } from "@/lib/types"
import { t } from "@/messages/ru"

type DrawerData = {
  directions: Direction[]
  recentTitles: Record<string, string[]>
  today: string
}

// «Стоп»: открывает шторку записи с уже посчитанными минутами.
// Таймер очищается только после сохранения — если закрыть шторку, он идёт дальше.
function useStop(timer: Timer | null) {
  const [open, setOpen] = useState(false)
  const [minutes, setMinutes] = useState(0)

  function stop() {
    if (!timer) return
    setMinutes(elapsedMinutes(timer))
    setOpen(true)
  }

  return { open, setOpen, minutes, stop }
}

// Кнопка на карточке направления: ▶ запускает, ⏹ (с временем) останавливает
// compact — маленькая круглая кнопка только с иконкой (для плитки направления)
export function TimerButton({ direction, compact, ...drawer }: DrawerData & { direction: Direction; compact?: boolean }) {
  const timer = useTimer()
  const running = timer?.directionId === direction.id
  const now = useNowSeconds(running)
  const { open, setOpen, minutes, stop } = useStop(timer)

  function start() {
    if (timer) {
      const other = drawer.directions.find((d) => d.id === timer.directionId)
      if (!confirm(t.timer.replaceConfirm(other?.name ?? "?"))) return
    }
    startTimer(direction.id)
  }

  return (
    <>
      <Button
        variant={running ? "default" : "secondary"}
        size="icon"
        onClick={running ? stop : start}
        className={compact ? "size-10 rounded-full" : "h-14 w-16 flex-col gap-0.5 rounded-xl"}
        aria-label={running ? t.timer.stop : t.timer.start}
      >
        {running ? <Square className="size-4" /> : <Play className={compact ? "size-4" : "size-5"} />}
        {running && !compact && (
          <span className="text-xs tabular-nums">{formatElapsed(now - Math.floor(timer.startedAt / 1000))}</span>
        )}
      </Button>
      <SessionDrawer
        {...drawer}
        open={open}
        onOpenChange={setOpen}
        defaultDirectionId={direction.id}
        defaultDuration={minutes}
        onSaved={clearTimer}
      />
    </>
  )
}

// Баннер вверху «Сегодня», пока идёт таймер
export function TimerBanner(drawer: DrawerData) {
  const timer = useTimer()
  const now = useNowSeconds(!!timer)
  const { open, setOpen, minutes, stop } = useStop(timer)
  const direction = drawer.directions.find((d) => d.id === timer?.directionId)

  if (!timer || !direction) return null

  return (
    <div className="flex items-center gap-2 rounded-2xl p-3 pl-4" style={{ backgroundColor: `${direction.color}26` }}>
      <span className="text-2xl">{direction.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{direction.name}</div>
        <div className="text-xl font-semibold tabular-nums">{formatElapsed(now - Math.floor(timer.startedAt / 1000))}</div>
      </div>
      <Button onClick={stop} className="h-12 px-5 text-base">
        <Square className="size-4" /> {t.timer.stop}
      </Button>
      <Button variant="ghost" size="icon-lg" onClick={() => confirm(t.timer.resetConfirm) && clearTimer()} aria-label={t.timer.reset}>
        <X />
      </Button>
      <SessionDrawer
        {...drawer}
        open={open}
        onOpenChange={setOpen}
        defaultDirectionId={direction.id}
        defaultDuration={minutes}
        onSaved={clearTimer}
      />
    </div>
  )
}
