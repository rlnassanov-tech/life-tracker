"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { addTransaction, deleteTransaction, updateTransaction } from "@/lib/actions/finance"
import { addDays } from "@/lib/dates"
import { CURRENCY_SYMBOL } from "@/lib/money"
import { toastWithUndo } from "@/lib/undo"
import { cn } from "@/lib/utils"
import { CURRENCIES, type Currency, type FinCategory, type FinKind, type Transaction } from "@/lib/types"
import { t } from "@/messages/ru"

type Props = {
  trigger: React.ReactNode
  categories: FinCategory[] // только активные
  today: string
  currency: Currency // основная валюта
  kind?: FinKind // для новой операции
  transaction?: Transaction // если передана — режим редактирования
}

// Шторка: новый расход/доход или правка операции
export function TransactionDrawer({ trigger, ...props }: Props) {
  const [open, setOpen] = useState(false)
  const kind = props.transaction?.kind ?? props.kind ?? "expense"
  const title = props.transaction ? t.money.editTitle : kind === "expense" ? t.money.newExpense : t.money.newIncome

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        {/* Форма монтируется при каждом открытии — поля сбрасываются сами */}
        <TransactionForm {...props} kind={kind} onDone={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  )
}

function TransactionForm({
  categories,
  today,
  currency: mainCurrency,
  kind,
  transaction,
  onDone,
}: Omit<Props, "trigger"> & { kind: FinKind; onDone: () => void }) {
  const list = categories.filter((c) => c.kind === kind)
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "")
  const [currency, setCurrency] = useState<Currency>(transaction?.currency ?? mainCurrency)
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "")
  const [date, setDate] = useState(transaction?.date ?? today)
  const [note, setNote] = useState(transaction?.note ?? "")
  const [pending, startTransition] = useTransition()
  const yesterday = addDays(today, -1)

  // Основная валюта первой
  const currencies = [mainCurrency, ...CURRENCIES.filter((c) => c !== mainCurrency)]

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId) return toast.error(t.money.category)
    // запятая как разделитель: «1500,50» → 1500.5
    const input = { category_id: categoryId, kind, amount: Number(amount.replace(",", ".")), currency, date, note }
    startTransition(async () => {
      try {
        if (transaction) {
          await updateTransaction(transaction.id, input)
          toast.success(t.money.saved)
        } else {
          const id = await addTransaction(input)
          toastWithUndo(t.money.saved, () => deleteTransaction(id))
        }
        onDone()
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  function remove() {
    if (!transaction || !confirm(t.money.deleteConfirm)) return
    startTransition(async () => {
      await deleteTransaction(transaction.id)
      const { category_id, kind, amount, currency, date, note } = transaction
      toastWithUndo(t.money.deleted, () => addTransaction({ category_id, kind, amount, currency, date, note }))
      onDone()
    })
  }

  return (
    <form onSubmit={submit} className="flex max-h-[75dvh] flex-col gap-5 overflow-y-auto p-4">
      {/* Сумма + валюта */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">{t.money.amount}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="amount"
            inputMode="decimal"
            autoFocus={!transaction}
            required
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            className={cn("h-16 text-center text-3xl font-semibold", kind === "income" && "text-emerald-400")}
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {currencies.map((c) => (
            <Button
              key={c}
              type="button"
              variant={c === currency ? "default" : "outline"}
              onClick={() => setCurrency(c)}
              className="h-10"
            >
              {CURRENCY_SYMBOL[c]} {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Категория: сетка эмодзи */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t.money.category}</span>
        <div className="grid grid-cols-4 gap-2">
          {list.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-xs",
                c.id === categoryId ? "bg-muted" : "border-transparent bg-muted/40 text-muted-foreground"
              )}
              style={c.id === categoryId ? { borderColor: c.color } : undefined}
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="w-full truncate text-center">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Дата */}
      <div className="grid grid-cols-3 gap-2">
        <Button type="button" variant={date === today ? "default" : "outline"} onClick={() => setDate(today)} className="h-11">
          {t.entry.today}
        </Button>
        <Button type="button" variant={date === yesterday ? "default" : "outline"} onClick={() => setDate(yesterday)} className="h-11">
          {t.entry.yesterday}
        </Button>
        <Input type="date" required max={today} value={date} onChange={(e) => setDate(e.target.value)} className="h-11" aria-label={t.entry.date} />
      </div>

      <Input
        placeholder={`${t.money.note} — ${t.money.notePlaceholder.toLowerCase()}`}
        aria-label={t.money.note}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-12 text-base"
      />

      {transaction && (
        <Button type="button" variant="destructive" disabled={pending} onClick={remove} className="h-12">
          {t.money.delete}
        </Button>
      )}
      {/* sticky — «Сохранить» всегда виден, даже если форма длиннее экрана */}
      <div className="sticky bottom-0 -mx-4 -mb-4 bg-popover px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button type="submit" disabled={pending || !categoryId || !amount} className="h-14 w-full text-lg">
          {t.money.save}
        </Button>
      </div>
    </form>
  )
}
