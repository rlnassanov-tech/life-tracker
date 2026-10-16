"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { addActivity, deleteActivity, updateActivity } from "@/lib/actions/activities"
import { activityMinutes, addDays, formatMinutes, hhmm } from "@/lib/dates"
import { tagColor } from "@/lib/tags"
import { toastWithUndo } from "@/lib/undo"
import { cn } from "@/lib/utils"
import type { Activity } from "@/lib/types"
import { t } from "@/messages/ru"

export type DiaryData = {
  today: string
  hints: { titles: string[]; tags: string[] }
  lastEnd: string | null // конец последнего занятия сегодня — подставляем как начало нового
}

type Props = DiaryData & {
  trigger?: React.ReactNode
  activity?: Activity // если передано — режим правки
  defaults?: { start: string; end: string } // от таймера
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved?: () => void
}

// Шторка: новая запись в дневник или правка
export function ActivityDrawer({ trigger, open: controlledOpen, onOpenChange, ...props }: Props) {
  const [innerOpen, setInnerOpen] = useState(false)
  const open = controlledOpen ?? innerOpen
  const setOpen = onOpenChange ?? setInnerOpen

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle>{props.activity ? t.diary.editTitle : t.diary.newTitle}</DrawerTitle>
        </DrawerHeader>
        {/* Форма монтируется при каждом открытии — время «сейчас» берётся свежее */}
        <ActivityForm {...props} onDone={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  )
}

// Текущее время, округлённое до 5 минут: «14:37» → «14:35»
function nowRounded() {
  const d = new Date()
  const m = Math.floor(d.getMinutes() / 5) * 5
  return `${String(d.getHours()).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function minusMinutes(time: string, min: number) {
  const total = (Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) - min + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

function ActivityForm({ today, hints, lastEnd, activity, defaults, onSaved, onDone }: Omit<Props, "trigger" | "open" | "onOpenChange"> & { onDone: () => void }) {
  // Время по умолчанию: от таймера → с конца прошлого занятия до «сейчас» → последние полчаса
  const [end, setEnd] = useState(() => (activity ? hhmm(activity.end_time) : defaults?.end ?? nowRounded()))
  const [start, setStart] = useState(() => {
    if (activity) return hhmm(activity.start_time)
    if (defaults) return defaults.start
    const e = nowRounded()
    return lastEnd && hhmm(lastEnd) < e ? hhmm(lastEnd) : minusMinutes(e, 30)
  })
  const [title, setTitle] = useState(activity?.title ?? "")
  const [tag, setTag] = useState(activity?.tag ?? "")
  const [date, setDate] = useState(activity?.date ?? today)
  const [pending, startTransition] = useTransition()
  const yesterday = addDays(today, -1)

  const minutes = start && end && start !== end ? activityMinutes(start, end) : 0
  const titleHints = hints.titles.filter((h) => h !== title && (!title || h.toLowerCase().includes(title.toLowerCase())))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const input = { title, tag: tag || null, date, start_time: start, end_time: end }
    startTransition(async () => {
      try {
        if (activity) {
          await updateActivity(activity.id, input)
          toast.success(t.diary.saved)
        } else {
          const id = await addActivity(input)
          toastWithUndo(t.diary.saved, () => deleteActivity(id))
        }
        onSaved?.()
        onDone()
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  function remove() {
    if (!activity || !confirm(t.diary.deleteConfirm)) return
    startTransition(async () => {
      await deleteActivity(activity.id)
      const { title, tag, date, start_time, end_time } = activity
      toastWithUndo(t.diary.deleted, () => addActivity({ title, tag, date, start_time, end_time }))
      onDone()
    })
  }

  return (
    <form onSubmit={submit} className="flex max-h-[75dvh] flex-col gap-5 overflow-y-auto p-4">
      {/* Чем занимался */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="act-title">{t.diary.what}</Label>
        <Input
          id="act-title"
          required
          autoFocus={!activity}
          placeholder={t.diary.whatPlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12 text-base"
        />
        {titleHints.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {titleHints.slice(0, 5).map((h) => (
              <button key={h} type="button" onClick={() => setTitle(h)} className="rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                {h}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Время с — по */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t.diary.time}</span>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Input type="time" required value={start} onChange={(e) => setStart(e.target.value)} className="h-12 text-center text-lg" aria-label={t.diary.from} />
          <span className="text-muted-foreground">—</span>
          <Input type="time" required value={end} onChange={(e) => setEnd(e.target.value)} className="h-12 text-center text-lg" aria-label={t.diary.to} />
        </div>
        <span className="text-center text-sm text-muted-foreground">{minutes ? formatMinutes(minutes) : "—"}</span>
      </div>

      {/* Метка (необязательно) */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="act-tag">{t.diary.tag}</Label>
        <Input
          id="act-tag"
          placeholder={t.diary.tagPlaceholder}
          value={tag}
          onChange={(e) => setTag(e.target.value.replace(/^#+/, ""))}
          className="h-11"
        />
        {hints.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hints.tags.slice(0, 8).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setTag(tag === h ? "" : h)}
                className={cn("rounded-full border px-3 py-1.5 text-sm", tag === h ? "text-foreground" : "border-transparent bg-muted text-muted-foreground")}
                style={tag === h ? { borderColor: tagColor(h), backgroundColor: `${tagColor(h)}26` } : undefined}
              >
                #{h}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* День */}
      <div className="grid grid-cols-3 gap-2">
        <Button type="button" variant={date === today ? "default" : "outline"} onClick={() => setDate(today)} className="h-11">
          {t.entry.today}
        </Button>
        <Button type="button" variant={date === yesterday ? "default" : "outline"} onClick={() => setDate(yesterday)} className="h-11">
          {t.entry.yesterday}
        </Button>
        <Input type="date" required max={today} value={date} onChange={(e) => setDate(e.target.value)} className="h-11" aria-label={t.entry.date} />
      </div>

      {activity && (
        <Button type="button" variant="destructive" disabled={pending} onClick={remove} className="h-12">
          {t.diary.delete}
        </Button>
      )}
      <div className="sticky bottom-0 -mx-4 -mb-4 bg-popover px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button type="submit" disabled={pending || !title.trim() || !minutes} className="h-14 w-full text-lg">
          {t.diary.save}
        </Button>
      </div>
    </form>
  )
}
