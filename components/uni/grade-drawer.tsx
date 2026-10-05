"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { addGrade } from "@/lib/actions/uni"
import { addDays } from "@/lib/dates"
import { letter } from "@/lib/grades"
import { cn } from "@/lib/utils"
import { GRADE_KINDS, type GradeKind, type Subject } from "@/lib/types"
import { t } from "@/messages/ru"

type Props = {
  trigger: React.ReactNode
  subjects: Subject[]
  today: string
  defaultSubjectId?: string
}

export function GradeDrawer({ trigger, ...props }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle>{t.uni.addGrade}</DrawerTitle>
        </DrawerHeader>
        <GradeForm {...props} onDone={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  )
}

function GradeForm({ subjects, today, defaultSubjectId, onDone }: Omit<Props, "trigger"> & { onDone: () => void }) {
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? subjects[0]?.id)
  const [grade, setGrade] = useState("")
  const [kind, setKind] = useState<GradeKind>("srs")
  const [date, setDate] = useState(today)
  const [note, setNote] = useState("")
  const [pending, startTransition] = useTransition()
  const yesterday = addDays(today, -1)

  const value = Number(grade)
  const hint = grade !== "" && value >= 0 && value <= 100 ? letter(value) : ""

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await addGrade({ subject_id: subjectId, date, grade: value, kind, note })
        toast.success(t.entry.saved)
        onDone()
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  return (
    <form onSubmit={submit} className="flex max-h-[75dvh] flex-col gap-5 overflow-y-auto p-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {subjects.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSubjectId(s.id)}
            className={cn(
              "h-11 shrink-0 rounded-full border-2 px-4 text-sm",
              s.id === subjectId ? "border-foreground bg-muted" : "border-transparent bg-muted/40 text-muted-foreground"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="grade">{t.uni.grade}</Label>
        <div className="flex items-center gap-3">
          <Input
            id="grade"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="any"
            required
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="h-14 text-center text-2xl"
          />
          <span className="w-12 text-center text-2xl font-semibold">{hint}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t.uni.kind}</span>
        <div className="flex flex-wrap gap-2">
          {GRADE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                k === kind ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {t.uni.kinds[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button type="button" variant={date === today ? "default" : "outline"} onClick={() => setDate(today)} className="h-11">
          {t.entry.today}
        </Button>
        <Button type="button" variant={date === yesterday ? "default" : "outline"} onClick={() => setDate(yesterday)} className="h-11">
          {t.entry.yesterday}
        </Button>
        <Input type="date" required max={today} value={date} onChange={(e) => setDate(e.target.value)} className="h-11" aria-label={t.entry.date} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="grade-note">{t.uni.note}</Label>
        <Textarea id="grade-note" value={note} onChange={(e) => setNote(e.target.value)} className="text-base" />
      </div>

      <Button type="submit" disabled={pending || !subjectId} className="h-14 text-lg">
        {t.uni.save}
      </Button>
    </form>
  )
}
