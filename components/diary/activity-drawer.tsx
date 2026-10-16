"use client"

import { useState, useTransition } from "react"
import { ArrowRight, CalendarDays, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
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
      {/* mx-auto max-w-lg — на компьютере шторка не растягивается на весь экран */}
      <DrawerContent className="mx-auto w-full max-w-lg">
        <DrawerTitle className="sr-only">{props.activity ? t.diary.editTitle : t.diary.newTitle}</DrawerTitle>
        {/* Форма монтируется при каждом открытии — время «сейчас» берётся свежее */}
        <ActivityForm {...props} onDone={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  )
}

// ---- Время ----

const toMin = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
const fromMin = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

// Текущее время, округлённое до 5 минут: «14:37» → «14:35»
function nowRounded() {
  const d = new Date()
  return fromMin(d.getHours() * 60 + Math.floor(d.getMinutes() / 5) * 5)
}

// Быстрые длительности: нажал — начало = конец − столько
const DURATIONS = [15, 30, 45, 60, 90, 120]
const durationLabel = (min: number) => (min < 60 ? `${min} мин` : min % 60 ? `${min / 60} ч`.replace(".", ",") : `${min / 60} ч`)

function ActivityForm({
  today,
  hints,
  lastEnd,
  activity,
  defaults,
  onSaved,
  onDone,
}: Omit<Props, "trigger" | "open" | "onOpenChange"> & { onDone: () => void }) {
  // Время по умолчанию: от таймера → с конца прошлого занятия до «сейчас» → последние полчаса
  const [end, setEnd] = useState(() => (activity ? hhmm(activity.end_time) : defaults?.end ?? nowRounded()))
  const [start, setStart] = useState(() => {
    if (activity) return hhmm(activity.start_time)
    if (defaults) return defaults.start
    const e = nowRounded()
    return lastEnd && hhmm(lastEnd) < e ? hhmm(lastEnd) : fromMin(toMin(e) - 30)
  })
  const [title, setTitle] = useState(activity?.title ?? "")
  const [tag, setTag] = useState(activity?.tag ?? "")
  const [newTag, setNewTag] = useState(false) // показываем поле «своя метка»
  const [date, setDate] = useState(activity?.date ?? today)
  const [pending, startTransition] = useTransition()
  const yesterday = addDays(today, -1)

  const minutes = start && end && start !== end ? activityMinutes(start, end) : 0
  const titleHints = hints.titles.filter((h) => h !== title && (!title || h.toLowerCase().includes(title.toLowerCase())))
  // Метки-подсказки + текущая, если её ещё нет в списке (новая)
  const tagList = tag && !hints.tags.includes(tag) ? [tag, ...hints.tags] : hints.tags

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
    <form onSubmit={submit} className="flex max-h-[80dvh] flex-col gap-6 overflow-y-auto px-5 pt-4">
      {/* Что делал — крупно, как заголовок */}
      <div className="flex flex-col gap-3">
        <textarea
          required
          rows={1}
          autoFocus={!activity}
          placeholder={t.diary.newTitle}
          aria-label={t.diary.what}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          // Enter — сохранить (а не перенос строки)
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.form?.requestSubmit())}
          className="field-sizing-content w-full resize-none bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground/60"
        />
        {titleHints.length > 0 && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
            {titleHints.slice(0, 6).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setTitle(h)}
                className="shrink-0 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                {h}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Метка — сразу под названием: «что делал» и «к чему относится» рядом */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {tagList.map((h) => {
            const active = tag === h
            return (
              <button
                key={h}
                type="button"
                onClick={() => setTag(active ? "" : h)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active ? "text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                )}
                style={active ? { borderColor: tagColor(h), backgroundColor: `${tagColor(h)}33` } : undefined}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: tagColor(h) }} />
                {h}
              </button>
            )
          })}
          {newTag ? (
            <input
              autoFocus
              placeholder={t.diary.tagPlaceholder}
              onChange={(e) => setTag(e.target.value.replace(/^#+/, "").toLowerCase())}
              onBlur={() => setNewTag(false)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), setNewTag(false))}
              className="w-36 rounded-full border border-dashed border-border bg-transparent px-3 py-1.5 text-sm outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setNewTag(true)}
              className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              + {t.diary.newTag}
            </button>
          )}
        </div>
      </div>

      {/* Время: большая карточка «с → по» + длительность */}
      <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-4">
        <div className="flex items-center justify-between gap-2">
          <TimeField label={t.diary.from} value={start} onChange={setStart} />
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ArrowRight className="size-5" />
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums", minutes ? "bg-foreground text-background" : "bg-muted")}>
              {minutes ? formatMinutes(minutes) : "—"}
            </span>
          </div>
          <TimeField label={t.diary.to} value={end} onChange={setEnd} align="right" />
        </div>
        {/* Быстрые длительности: двигают начало, конец остаётся */}
        <div className="grid grid-cols-6 gap-1.5">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setStart(fromMin(toMin(end) - d))}
              className={cn(
                "rounded-lg py-2 text-xs font-medium transition-colors",
                minutes === d ? "bg-foreground text-background" : "bg-background/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {durationLabel(d)}
            </button>
          ))}
        </div>
      </div>

      {/* День: компактный переключатель */}
      <div className="flex items-center gap-1 self-start rounded-full bg-muted/50 p-1">
        {[
          [today, t.entry.today],
          [yesterday, t.entry.yesterday],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setDate(value)}
            className={cn("rounded-full px-4 py-1.5 text-sm", date === value ? "bg-foreground text-background" : "text-muted-foreground")}
          >
            {label}
          </button>
        ))}
        <label
          className={cn(
            "relative flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm",
            date !== today && date !== yesterday ? "bg-foreground text-background" : "text-muted-foreground"
          )}
        >
          <CalendarDays className="size-4" />
          {date !== today && date !== yesterday && date.slice(8, 10) + "." + date.slice(5, 7)}
          {/* Нативный выбор даты, растянутый на кнопку и прозрачный */}
          <input
            type="date"
            max={today}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label={t.entry.date}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>

      {/* Низ: удалить (при правке) + сохранить, всегда виден */}
      <div className="sticky bottom-0 -mx-5 flex gap-2 bg-popover px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {activity && (
          <Button type="button" variant="ghost" size="icon" disabled={pending} onClick={remove} className="size-14 text-destructive" aria-label={t.diary.delete}>
            <Trash2 className="size-5" />
          </Button>
        )}
        <Button type="submit" disabled={pending || !title.trim() || !minutes} className="h-14 flex-1 rounded-xl text-lg">
          {t.diary.save}
        </Button>
      </div>
    </form>
  )
}

// Крупное поле времени: подпись сверху, цифры крупно, нативный выбор времени
function TimeField({ label, value, onChange, align = "left" }: { label: string; value: string; onChange: (v: string) => void; align?: "left" | "right" }) {
  return (
    <label className={cn("flex flex-col gap-0.5", align === "right" && "items-end")}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="time"
        required
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className={cn(
          "w-[6.5rem] bg-transparent text-4xl font-semibold tabular-nums outline-none [&::-webkit-calendar-picker-indicator]:hidden",
          align === "right" && "text-right"
        )}
      />
    </label>
  )
}
