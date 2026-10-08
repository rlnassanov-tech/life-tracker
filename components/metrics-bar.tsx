"use client"

import { useOptimistic, useState, useTransition } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Droplet, Footprints, Minus, Moon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { addWater, saveSleep, saveSteps } from "@/lib/actions/metrics"
import { addDays, formatDay, formatMinutes, sleepHours } from "@/lib/dates"
import { toastWithUndo } from "@/lib/undo"
import { RING_COLORS, Ring, fmtHours, fmtShort } from "@/components/ring"
import type { DailyMetrics } from "@/lib/types"
import { t } from "@/messages/ru"

type Props = {
  date: string // за какой день показываем
  today: string
  metrics: DailyMetrics
  goals: { water_goal_ml: number; steps_goal: number }
  lastSleep: { start: string; end: string } | null
}

const fmt = (n: number) => n.toLocaleString("ru-RU")

// Блок «вода / сон / шаги» вверху экрана «Сегодня»
export function MetricsBar({ date, today, metrics, goals, lastSleep }: Props) {
  const [, startTransition] = useTransition()
  // useOptimistic: число на экране меняется сразу, не дожидаясь ответа сервера
  const [water, addOptimisticWater] = useOptimistic(metrics.water_ml, (cur, delta: number) => Math.max(0, cur + delta))

  function changeWater(delta: number) {
    startTransition(async () => {
      addOptimisticWater(delta)
      try {
        await addWater(date, delta)
        toastWithUndo(t.common.waterAdded(delta), () => addWater(date, -delta))
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  const isToday = date === today
  const dayHref = (d: string) => (d === today ? "/" : `/?d=${d}`)

  return (
    <section className="flex flex-col gap-3">
      {/* Переключатель дня — чтобы внести забытое за прошлые дни */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="icon-lg" aria-label={t.metrics.prevDay}>
          <Link href={dayHref(addDays(date, -1))} scroll={false}>
            <ChevronLeft />
          </Link>
        </Button>
        <div className="text-center text-sm">
          <span className="first-letter:uppercase">{formatDay(date)}</span>
          {!isToday && (
            <Link href="/" className="ml-2 text-muted-foreground underline">
              {t.metrics.backToToday}
            </Link>
          )}
        </div>
        <Button asChild={!isToday} variant="ghost" size="icon-lg" disabled={isToday} aria-label={t.metrics.nextDay}>
          {isToday ? (
            <ChevronRight />
          ) : (
            <Link href={dayHref(addDays(date, 1))} scroll={false}>
              <ChevronRight />
            </Link>
          )}
        </Button>
      </div>

      {/* Три кольца: вода / сон / шаги. Кольцо заполняется к цели дня */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3">
          <Ring value={water} max={goals.water_goal_ml} color={RING_COLORS.water} center={fmtShort(water)} />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Droplet className="size-3.5 text-sky-400" /> {t.metrics.water}
          </span>
          <div className="grid w-full grid-cols-[1fr_2fr] gap-1">
            <Button variant="secondary" onClick={() => changeWater(-250)} disabled={water === 0} className="h-9 px-0" aria-label="−250">
              <Minus />
            </Button>
            <Button onClick={() => changeWater(250)} className="h-9 px-0 text-sm">
              +250
            </Button>
          </div>
        </div>
        <SleepDrawer date={date} metrics={metrics} lastSleep={lastSleep} />
        <StepsDrawer date={date} steps={metrics.steps} goal={goals.steps_goal} />
      </div>
    </section>
  )
}

// Карточка-кнопка с кольцом, открывающая шторку. ...rest обязателен: DrawerTrigger передаёт
// через него onClick и служебные атрибуты — без них шторка не откроется
function RingButton({
  ring,
  label,
  sub,
  ...rest
}: { ring: React.ReactNode; label: React.ReactNode; sub: string } & React.ComponentProps<"button">) {
  return (
    <button {...rest} className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3">
      {ring}
      <span className="flex items-center gap-1 text-xs text-muted-foreground">{label}</span>
      <span className="flex h-9 items-center text-xs text-muted-foreground tabular-nums">{sub}</span>
    </button>
  )
}

function SleepDrawer({ date, metrics, lastSleep }: Pick<Props, "date" | "metrics" | "lastSleep">) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  // По умолчанию: что уже внесено → прошлое время сна → 23:00–07:00
  const [start, setStart] = useState((metrics.sleep_start ?? lastSleep?.start ?? "23:00").slice(0, 5))
  const [end, setEnd] = useState((metrics.sleep_end ?? lastSleep?.end ?? "07:00").slice(0, 5))

  const hours = metrics.sleep_hours
  const preview = start && end ? formatMinutes(Math.round(sleepHours(start, end) * 60)) : ""

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await saveSleep(date, start, end)
        setOpen(false)
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <RingButton
          ring={
            <Ring
              value={hours ?? 0}
              max={8}
              color={RING_COLORS.sleep}
              center={hours != null ? fmtHours(hours) : "—"}
            />
          }
          label={
            <>
              <Moon className="size-3.5 text-indigo-400" /> {t.metrics.sleep}
            </>
          }
          sub={metrics.sleep_start && metrics.sleep_end ? `${metrics.sleep_start.slice(0, 5)}–${metrics.sleep_end.slice(0, 5)}` : t.metrics.notSet}
        />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle>{t.metrics.sleep}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={submit} className="flex flex-col gap-5 p-4">
          <p className="text-sm text-muted-foreground">{t.metrics.sleepHint}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sleep-start">{t.metrics.bedtime}</Label>
              <Input id="sleep-start" type="time" required value={start} onChange={(e) => setStart(e.target.value)} className="h-12 text-base" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sleep-end">{t.metrics.wakeup}</Label>
              <Input id="sleep-end" type="time" required value={end} onChange={(e) => setEnd(e.target.value)} className="h-12 text-base" />
            </div>
          </div>
          <div className="text-center text-2xl font-semibold">{preview}</div>
          <Button type="submit" disabled={pending} className="h-14 text-lg">
            {t.metrics.save}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

function StepsDrawer({ date, steps, goal }: { date: string; steps: number; goal: number }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState(steps ? String(steps) : "")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await saveSteps(date, Number(value))
        setOpen(false)
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <RingButton
          ring={<Ring value={steps} max={goal} color={RING_COLORS.steps} center={steps ? fmtShort(steps) : "—"} />}
          label={
            <>
              <Footprints className="size-3.5 text-emerald-400" /> {t.metrics.steps}
            </>
          }
          sub={`${t.metrics.of} ${fmt(goal)}`}
        />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle>{t.metrics.stepsTitle}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={submit} className="flex flex-col gap-5 p-4">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={200000}
            required
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-14 text-center text-2xl"
          />
          <Button type="submit" disabled={pending} className="h-14 text-lg">
            {t.metrics.save}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
