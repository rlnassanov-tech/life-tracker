"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { deleteAccount } from "@/lib/actions/profile"
import { t } from "@/messages/ru"

export function DeleteAccountButton() {
  const [pending, startTransition] = useTransition()

  function remove() {
    if (!confirm(t.settings.deleteConfirm)) return
    startTransition(async () => {
      try {
        await deleteAccount()
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  return (
    <Button variant="ghost" disabled={pending} onClick={remove} className="h-12 w-full text-base text-destructive">
      {t.settings.deleteAccount}
    </Button>
  )
}
