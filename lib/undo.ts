"use client"

import { toast } from "sonner"
import { t } from "@/messages/ru"

// Тост с кнопкой «Отменить»: 5 секунд, чтобы передумать.
// undo — действие, обратное только что сделанному (удалить созданное, вернуть удалённое…)
export function toastWithUndo(message: string, undo: () => Promise<unknown>) {
  toast.success(message, {
    duration: 5000,
    action: {
      label: t.common.undo,
      onClick: async () => {
        try {
          await undo()
          toast(t.common.undone)
        } catch {
          toast.error(t.common.error)
        }
      },
    },
  })
}
