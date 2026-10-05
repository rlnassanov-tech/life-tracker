"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { createSubject, renameSubject, setSubjectArchived } from "@/lib/actions/uni"
import type { Subject } from "@/lib/types"
import { t } from "@/messages/ru"

// Шторка: новый предмет (subject не передан) или переименование / архив
export function SubjectDrawer({ subject, trigger }: { subject?: Subject; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle>{subject ? t.uni.editSubject : t.uni.newSubject}</DrawerTitle>
        </DrawerHeader>
        <SubjectForm subject={subject} onDone={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  )
}

function SubjectForm({ subject, onDone }: { subject?: Subject; onDone: () => void }) {
  const [name, setName] = useState(subject?.name ?? "")
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action()
        onDone()
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    run(() => (subject ? renameSubject(subject.id, name) : createSubject(name)))
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-4">
      <Input
        required
        autoFocus={!subject}
        maxLength={60}
        placeholder={t.uni.subjectName}
        aria-label={t.uni.subjectName}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-12 text-base"
      />
      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {t.uni.save}
      </Button>
      {subject && (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => setSubjectArchived(subject.id, !subject.archived))}
          className="h-12"
        >
          {subject.archived ? t.uni.fromArchive : t.uni.toArchive}
        </Button>
      )}
    </form>
  )
}
