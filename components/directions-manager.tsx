"use client"

import { useState, useTransition } from "react"
import { ChevronDown, ChevronUp, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { createDirection, moveDirection, setArchived, updateDirection } from "@/lib/actions/directions"
import { COLORS } from "@/lib/colors"
import { cn } from "@/lib/utils"
import type { Direction } from "@/lib/types"
import { t } from "@/messages/ru"

const EMOJIS = ["📚", "🎓", "🗣️", "🎹", "💻", "🏃", "🏋️", "🧘", "🎨", "🎸", "✍️", "📖"]

// Настройки направлений: порядок, правка, архив, добавление
export function DirectionsManager({ directions }: { directions: Direction[] }) {
  const [pending, startTransition] = useTransition()
  const active = directions.filter((d) => !d.archived)
  const archived = directions.filter((d) => d.archived)

  const move = (id: string, step: -1 | 1) => startTransition(() => moveDirection(id, step))

  return (
    <div className="flex flex-col gap-3">
      {active.map((d, i) => (
        <div key={d.id} className="flex items-center gap-1 rounded-2xl border-l-4 bg-card p-2" style={{ borderLeftColor: d.color }}>
          <DirectionDrawer
            direction={d}
            trigger={
              <button className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left">
                <span className="text-2xl">{d.icon}</span>
                <span className="truncate">{d.name}</span>
              </button>
            }
          />
          <Button variant="ghost" size="icon-lg" disabled={pending || i === 0} onClick={() => move(d.id, -1)} aria-label={t.settings.up}>
            <ChevronUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            disabled={pending || i === active.length - 1}
            onClick={() => move(d.id, 1)}
            aria-label={t.settings.down}
          >
            <ChevronDown />
          </Button>
        </div>
      ))}

      <DirectionDrawer
        trigger={
          <Button variant="outline" className="h-12 text-base">
            <Plus /> {t.settings.addDirection}
          </Button>
        }
      />

      {archived.length > 0 && (
        <>
          <h3 className="mt-2 text-sm text-muted-foreground">{t.settings.archive}</h3>
          {archived.map((d) => (
            <DirectionDrawer
              key={d.id}
              direction={d}
              trigger={
                <button className="flex items-center gap-3 rounded-2xl bg-card/50 p-4 text-left text-muted-foreground">
                  <span className="text-2xl opacity-60">{d.icon}</span>
                  <span className="truncate">{d.name}</span>
                </button>
              }
            />
          ))}
        </>
      )}
    </div>
  )
}

function DirectionDrawer({ direction, trigger }: { direction?: Direction; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle>{direction ? t.settings.editDirection : t.settings.newDirection}</DrawerTitle>
        </DrawerHeader>
        <DirectionForm direction={direction} onDone={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  )
}

function DirectionForm({ direction, onDone }: { direction?: Direction; onDone: () => void }) {
  const [name, setName] = useState(direction?.name ?? "")
  const [icon, setIcon] = useState(direction?.icon ?? "📚")
  const [color, setColor] = useState(direction?.color ?? COLORS[0])
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action()
        onDone()
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const input = { name, icon, color }
    run(() => (direction ? updateDirection(direction.id, input) : createDirection(input)))
  }

  return (
    <form onSubmit={submit} className="flex max-h-[75dvh] flex-col gap-5 overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t.settings.name}</Label>
        <Input id="name" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="icon">{t.settings.icon}</Label>
        <div className="flex items-center gap-2">
          <Input id="icon" value={icon} maxLength={8} onChange={(e) => setIcon(e.target.value)} className="h-12 w-20 text-center text-2xl" />
          <div className="flex flex-1 gap-1 overflow-x-auto">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setIcon(e)} className="size-11 shrink-0 rounded-lg text-2xl hover:bg-muted">
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t.settings.color}</span>
        <div className="grid grid-cols-5 gap-3">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              className={cn("h-11 rounded-full ring-offset-2 ring-offset-background", c === color && "ring-2 ring-foreground")}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {t.settings.save}
      </Button>
      {direction && (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => setArchived(direction.id, !direction.archived))}
          className="h-12"
        >
          {direction.archived ? t.settings.fromArchive : t.settings.toArchive}
        </Button>
      )}
    </form>
  )
}
