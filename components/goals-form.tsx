"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveGoals } from "@/lib/actions/profile"
import { t } from "@/messages/ru"

export function GoalsForm({ water, steps }: { water: number; steps: number }) {
  const [waterGoal, setWaterGoal] = useState(String(water))
  const [stepsGoal, setStepsGoal] = useState(String(steps))
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await saveGoals(Number(waterGoal), Number(stepsGoal))
        toast.success(t.settings.saved)
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="water-goal">{t.settings.waterGoal}</Label>
          <Input
            id="water-goal"
            type="number"
            inputMode="numeric"
            min={1}
            step={50}
            required
            value={waterGoal}
            onChange={(e) => setWaterGoal(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="steps-goal">{t.settings.stepsGoal}</Label>
          <Input
            id="steps-goal"
            type="number"
            inputMode="numeric"
            min={1}
            required
            value={stepsGoal}
            onChange={(e) => setStepsGoal(e.target.value)}
            className="h-12 text-base"
          />
        </div>
      </div>
      <Button type="submit" variant="outline" disabled={pending} className="h-12 text-base">
        {t.settings.save}
      </Button>
    </form>
  )
}
