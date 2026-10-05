import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SessionDrawer } from "@/components/session-drawer"
import { formatMinutes } from "@/lib/dates"
import type { Direction } from "@/lib/types"
import { t } from "@/messages/ru"

type Props = {
  direction: Direction
  todayMin: number
  weekMin: number
  // для шторки записи
  directions: Direction[]
  recentTitles: Record<string, string[]>
  today: string
}

export function DirectionCard({ direction, todayMin, weekMin, ...drawer }: Props) {
  return (
    <div
      className="flex items-center gap-2 rounded-2xl border-l-4 bg-card p-2 pl-4"
      style={{ borderLeftColor: direction.color }}
    >
      <Link href={`/directions/${direction.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-2">
        <span className="text-3xl">{direction.icon}</span>
        <div className="min-w-0">
          <div className="truncate font-medium">{direction.name}</div>
          {/* whitespace-nowrap — чтобы строка переносилась только между частями */}
          <div className="text-sm text-muted-foreground">
            <span className="whitespace-nowrap">
              {t.today.todayShort}: {formatMinutes(todayMin)}
            </span>{" "}
            ·{" "}
            <span className="whitespace-nowrap">
              {t.today.weekShort}: {formatMinutes(weekMin)}
            </span>
          </div>
        </div>
      </Link>
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
