import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SessionDrawer } from "@/components/session-drawer"
import { TimerButton } from "@/components/timer"
import { formatMinutes } from "@/lib/dates"
import type { Direction } from "@/lib/types"
import { t } from "@/messages/ru"

type Props = {
  direction: Direction
  todayMin: number
  weekMin: number
  streak: number
  // для шторки записи
  directions: Direction[]
  recentTitles: Record<string, string[]>
  today: string
}

export function DirectionCard({ direction, todayMin, weekMin, streak, ...drawer }: Props) {
  return (
    <div
      className="flex items-center gap-2 rounded-2xl border-l-4 bg-card p-2 pl-4"
      style={{ borderLeftColor: direction.color }}
    >
      <Link href={`/directions/${direction.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-2">
        <span className="text-3xl">{direction.icon}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{direction.name}</span>
            {/* Серия показывается с двух дней подряд */}
            {streak >= 2 && (
              <span className="shrink-0 text-sm text-orange-400" title={t.streak.hint(streak)}>
                🔥 {streak}
              </span>
            )}
          </div>
          {/* flex-wrap + nowrap: части переносятся целиком, а не посреди фразы */}
          <div className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">
              {t.today.todayShort}: {formatMinutes(todayMin)}
            </span>
            <span className="whitespace-nowrap">
              {t.today.weekShort}: {formatMinutes(weekMin)}
            </span>
          </div>
        </div>
      </Link>
      <TimerButton direction={direction} {...drawer} />
      <SessionDrawer
        {...drawer}
        defaultDirectionId={direction.id}
        trigger={
          <Button variant="secondary" size="icon" className="size-14 rounded-xl" aria-label={t.today.addEntry}>
            <Plus className="size-6" />
          </Button>
        }
      />
    </div>
  )
}
