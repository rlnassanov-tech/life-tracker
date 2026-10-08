"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { SessionDrawer } from "@/components/session-drawer"
import { TimerButton } from "@/components/timer"
import { formatMinutes } from "@/lib/dates"
import { formatElapsed, useNowSeconds, useTimer } from "@/lib/timer"
import type { Direction } from "@/lib/types"
import { t } from "@/messages/ru"

type Props = {
  direction: Direction
  todayMin: number
  weekMin: number
  streak: number
  idleDays: number | null // сколько дней без записей (null — записей ещё не было)
  // для шторки записи
  directions: Direction[]
  recentTitles: Record<string, string[]>
  today: string
}

const NEGLECT_DAYS = 3

// Плитка направления (вариант дизайна B).
// Нажатие на плитку — быстрая запись; ▶ — таймер; › — страница направления.
export function DirectionCard({ direction, todayMin, weekMin, streak, idleDays, ...drawer }: Props) {
  const timer = useTimer()
  const running = timer?.directionId === direction.id
  const now = useNowSeconds(running)

  // Главная строка статуса: идёт таймер → заброшено → минуты за сегодня и серия
  let status: React.ReactNode
  if (running) {
    status = <span className="text-orange-400 tabular-nums">⏱ {formatElapsed(now - Math.floor(timer.startedAt / 1000))}</span>
  } else if (idleDays !== null && idleDays >= NEGLECT_DAYS && todayMin === 0) {
    status = <span className="text-amber-400">{t.week.neglectedDays(idleDays)}</span>
  } else {
    status = (
      <span>
        {formatMinutes(todayMin)}
        {streak >= 2 && <span className="text-orange-400"> · 🔥{streak}</span>}
      </span>
    )
  }

  return (
    <div className="relative h-36 rounded-2xl border-t-4 bg-card" style={{ borderTopColor: direction.color }}>
      {/* Невидимая кнопка на всю плитку открывает шторку записи */}
      <SessionDrawer
        {...drawer}
        defaultDirectionId={direction.id}
        trigger={<button className="absolute inset-0 rounded-2xl" aria-label={`${t.today.addEntry}: ${direction.name}`} />}
      />

      {/* pointer-events-none — текст не перехватывает нажатия, они идут в кнопку под ним */}
      <div className="pointer-events-none relative flex h-full flex-col justify-between p-3">
        <span className="text-3xl">{direction.icon}</span>
        <div className="min-w-0">
          <div className="truncate font-medium">{direction.name}</div>
          <div className="text-sm text-muted-foreground">{status}</div>
          <div className="text-xs text-muted-foreground">
            {t.today.weekShort}: {formatMinutes(weekMin)}
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1">
        <TimerButton direction={direction} compact {...drawer} />
        <Link
          href={`/directions/${direction.id}`}
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label={direction.name}
        >
          <ChevronRight className="size-5" />
        </Link>
      </div>
    </div>
  )
}
