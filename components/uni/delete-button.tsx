"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteAttendance, deleteGrade } from "@/lib/actions/uni"
import { t } from "@/messages/ru"

// Кнопка-корзина для строк на странице предмета
export function DeleteButton({ kind, id }: { kind: "grade" | "attendance"; id: string }) {
  const [pending, startTransition] = useTransition()

  function remove() {
    if (!confirm(t.uni.deleteConfirm)) return
    startTransition(() => (kind === "grade" ? deleteGrade(id) : deleteAttendance(id)))
  }

  return (
    <Button variant="ghost" size="icon-lg" disabled={pending} onClick={remove} aria-label={t.entry.delete}>
      <Trash2 className="text-muted-foreground" />
    </Button>
  )
}
