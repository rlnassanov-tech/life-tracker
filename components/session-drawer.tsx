"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { addSession, deleteSession, updateSession } from "@/lib/actions/sessions"
import { addDays } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { Direction, Session } from "@/lib/types"
import { t } from "@/messages/ru"

const PRESETS = [15, 30, 45, 60, 90]

type Props = {
  trigger: React.ReactNode
  directions: Direction[]
  recentTitles: Record<string, string[]>
  today: string
  defaultDirectionId?: string
  session?: Session // если передана — режим редактирования
}

// Шторка снизу для новой записи или правки существующей
export function SessionDrawer({ trigger, ...props }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle>{props.session ? t.entry.editTitle : t.entry.newTitle}</DrawerTitle>
        </DrawerHeader>
        {/* Форма монтируется заново при каждом открытии, поэтому поля сбрасываются сами */}
        <SessionForm {...props} onDone={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  )
}

function SessionForm({
  directions,
  recentTitles,
  today,
  defaultDirectionId,
  session,
  onDone,
}: Omit<Props, "trigger"> & { onDone: () => void }) {
  const [directionId, setDirectionId] = useState(session?.direction_id ?? defaultDirectionId ?? directions[0]?.id)
  const [duration, setDuration] = useState(session ? String(session.duration_min) : "")
  const [title, setTitle] = useState(session?.title ?? "")
  const [note, setNote] = useState(session?.note ?? "")
  const [showNote, setShowNote] = useState(!!session?.note)
  const [date, setDate] = useState(session?.date ?? today)
  const [pending, startTransition] = useTransition()

  const yesterday = addDays(today, -1)
  const suggestions = (recentTitles[directionId] ?? []).filter((s) => s !== title)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const input = { direction_id: directionId, date, duration_min: Number(duration), title, note }
    startTransition(async () => {
      try {
        if (session) await updateSession(session.id, input)
        else await addSession(input)
        toast.success(t.entry.saved)
        onDone()
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  function remove() {
    if (!session || !confirm(t.entry.deleteConfirm)) return
    startTransition(async () => {
      await deleteSession(session.id)
      toast.success(t.entry.deleted)
      onDone()
    })
  }

  return (
    <form onSubmit={submit} className="flex max-h-[75dvh] flex-col gap-5 overflow-y-auto p-4">
      {/* Направление: горизонтальная лента «чипсов» */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {directions.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDirectionId(d.id)}
            className={cn(
              "flex h-11 shrink-0 items-center gap-2 rounded-full border-2 px-4 text-sm",
              d.id === directionId ? "bg-muted" : "border-transparent bg-muted/40 text-muted-foreground"
            )}
            style={d.id === directionId ? { borderColor: d.color } : undefined}
          >
            <span className="text-lg">{d.icon}</span>
            {d.name}
          </button>
        ))}
      </div>

      {/* Длительность: пресеты + ручной ввод */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="duration">{t.entry.duration}</Label>
        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p}
              type="button"
              variant={Number(duration) === p ? "default" : "outline"}
              onClick={() => setDuration(String(p))}
              className="h-12 text-base"
            >
              {p}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            id="duration"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            required
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="h-12 text-base"
          />
          <span className="text-muted-foreground">{t.entry.minutes}</span>
        </div>
      </div>

      {/* Что делал + подсказки из прошлых записей */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t.entry.what}</Label>
        <Input
          id="title"
          placeholder={t.entry.whatPlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12 text-base"
        />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTitle(s)}
                className="rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {showNote ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="note">{t.entry.note}</Label>
          <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="text-base" />
        </div>
      ) : (
        <button type="button" onClick={() => setShowNote(true)} className="self-start text-sm text-muted-foreground">
          {t.entry.addNote}
        </button>
      )}

      {/* Дата: сегодня / вчера / любая */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="date">{t.entry.date}</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button type="button" variant={date === today ? "default" : "outline"} onClick={() => setDate(today)} className="h-11">
            {t.entry.today}
          </Button>
          <Button
            type="button"
            variant={date === yesterday ? "default" : "outline"}
            onClick={() => setDate(yesterday)}
            className="h-11"
          >
            {t.entry.yesterday}
          </Button>
          <Input
            id="date"
            type="date"
            required
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <Button type="submit" disabled={pending || !directionId} className="h-14 text-lg">
        {t.entry.save}
      </Button>
      {session && (
        <Button type="button" variant="destructive" disabled={pending} onClick={remove} className="h-12">
          {t.entry.delete}
        </Button>
      )}
    </form>
  )
}
