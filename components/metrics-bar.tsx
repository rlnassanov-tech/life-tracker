"use client"

import { useOptimistic, useState, useTransition } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Droplet, Footprints, Minus, Moon, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { addWater, saveSleep, saveSteps } from "@/lib/actions/metrics"
import { addDays, formatDay, formatMinutes, sleepHours } from "@/lib/dates"
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

      {/* Вода */}
      <div className="flex flex-col gap-3 rounded-2xl bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Droplet className="size-5 text-sky-400" /> {t.metrics.water}
          </div>
          <div>
            <span className="text-xl font-semibold">{fmt(water)}</span>
            <span className="text-sm text-muted-foreground">
              {" "}
              {t.metrics.of} {fmt(goals.water_goal_ml)} {t.metrics.ml}
            </span>
          </div>
        </div>
        <Progress value={water} max={goals.water_goal_ml} className="bg-sky-400" />
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <Button variant="outline" onClick={() => changeWater(-250)} disabled={water === 0} className="h-12 text-base">
            <Minus /> 250
          </Button>
          <Button onClick={() => changeWater(250)} className="h-12 text-base">
            <Plus /> 250 {t.metrics.ml}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SleepDrawer date={date} metrics={metrics} lastSleep={lastSleep} />
        <StepsDrawer date={date} steps={metrics.steps} goal={goals.steps_goal} />
      </div>
    </section>
  )
}

function Progress({ value, max, className }: { value: number; max: number; className: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  // span, а не div — прогресс бывает внутри <button>, а div там по HTML не положен
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-muted">
      <span className={`block h-full rounded-full transition-all ${className}`} style={{ width: `${pct}%` }} />
    </span>
  )
}

// Плитка-кнопка, открывающая шторку. ...rest обязателен: DrawerTrigger передаёт
// через него onClick и служебные атрибуты — без них шторка не откроется
function Tile({
  icon,
  label,
  value,
  sub,
  ...rest
}: { icon: React.ReactNode; label: string; value: string; sub?: React.ReactNode } & React.ComponentProps<"button">) {
  return (
    <button {...rest} className="flex h-full w-full flex-col gap-1 rounded-2xl bg-card p-4 text-left">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon} {label}
      </span>
      <span className="text-lg font-semibold">{value}</span>
      {sub}
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
        <Tile
          icon={<Moon className="size-4 text-indigo-400" />}
          label={t.metrics.sleep}
          value={hours != null ? formatMinutes(Math.round(hours * 60)) : t.metrics.notSet}
          sub={
            metrics.sleep_start &&
            metrics.sleep_end && (
              <span className="text-xs text-muted-foreground">
                {metrics.sleep_start.slice(0, 5)} → {metrics.sleep_end.slice(0, 5)}
              </span>
            )
          }
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
        <Tile
          icon={<Footprints className="size-4 text-emerald-400" />}
          label={t.metrics.steps}
          value={steps ? fmt(steps) : t.metrics.notSet}
          sub={<Progress value={steps} max={goal} className="bg-emerald-400" />}
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
