"use client"

import { useState, useTransition } from "react"
import { CalendarDays, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
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
  transaction?: Transaction // если передана — режим правки
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
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        {/* Форма монтируется при каждом открытии — поля сбрасываются сами */}
        <TransactionForm {...props} kind={kind} title={title} onDone={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  )
}

// 2500 → «2 500» для крупного вывода суммы
const pretty = (raw: string) => {
  if (!raw) return "0"
  const [int, frac] = raw.replace(",", ".").split(".")
  const grouped = Number(int || 0).toLocaleString("ru-RU")
  return frac !== undefined ? `${grouped},${frac}` : grouped
}

function TransactionForm({
  categories,
  today,
  currency: mainCurrency,
  kind,
  title,
  transaction,
  onDone,
}: Omit<Props, "trigger"> & { kind: FinKind; title: string; onDone: () => void }) {
  const list = categories.filter((c) => c.kind === kind)
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "")
  const [currency, setCurrency] = useState<Currency>(transaction?.currency ?? mainCurrency)
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "")
  const [date, setDate] = useState(transaction?.date ?? today)
  const [note, setNote] = useState(transaction?.note ?? "")
  const [pending, startTransition] = useTransition()
  const yesterday = addDays(today, -1)
  const isIncome = kind === "income"

  // Основная валюта первой
  const currencies = [mainCurrency, ...CURRENCIES.filter((c) => c !== mainCurrency)]
  const selected = list.find((c) => c.id === categoryId)

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
    <form onSubmit={submit} className="flex max-h-[80dvh] flex-col gap-6 overflow-y-auto px-5 pt-4">
      {/* Сумма — крупно по центру; поле поверх прозрачное, видно красивое число */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm text-muted-foreground">{title}</span>
        <label className="relative flex w-full items-baseline justify-center gap-2">
          <span
            className={cn(
              "text-5xl font-semibold tabular-nums",
              !amount && "text-muted-foreground/40",
              amount && (isIncome ? "text-emerald-400" : "text-foreground")
            )}
          >
            {isIncome ? "+" : "−"}
            {pretty(amount)}
          </span>
          <span className="text-3xl font-semibold text-muted-foreground">{CURRENCY_SYMBOL[currency]}</span>
          <input
            inputMode="decimal"
            autoFocus={!transaction}
            required
            aria-label={t.money.amount}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            className="absolute inset-0 w-full cursor-text bg-transparent text-transparent caret-transparent outline-none"
          />
        </label>
        {/* Валюта — маленькие таблетки */}
        <div className="flex gap-1 rounded-full bg-muted/50 p-1">
          {currencies.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={cn(
                "rounded-full px-3 py-1 text-sm tabular-nums",
                c === currency ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {CURRENCY_SYMBOL[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Категория — плотная сетка эмодзи */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {list.map((c) => {
          const active = c.id === categoryId
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:bg-muted/60"
              )}
              style={active ? { backgroundColor: `${c.color}33`, boxShadow: `inset 0 0 0 2px ${c.color}` } : undefined}
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="w-full truncate text-center">{c.name}</span>
            </button>
          )
        })}
      </div>

      {/* Заметка — одной строкой */}
      <input
        placeholder={`${t.money.note} — ${t.money.notePlaceholder.toLowerCase()}`}
        aria-label={t.money.note}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="border-b border-border bg-transparent pb-2 text-base outline-none placeholder:text-muted-foreground/60 focus:border-foreground"
      />

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

      {/* Низ: удалить (при правке) + сохранить с подсказкой категории */}
      <div className="sticky bottom-0 -mx-5 flex gap-2 bg-popover px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {transaction && (
          <Button type="button" variant="ghost" size="icon" disabled={pending} onClick={remove} className="size-14 text-destructive" aria-label={t.money.delete}>
            <Trash2 className="size-5" />
          </Button>
        )}
        <Button
          type="submit"
          disabled={pending || !categoryId || !amount}
          className={cn("h-14 flex-1 rounded-xl text-lg", isIncome && "bg-emerald-500 text-white hover:bg-emerald-500/90")}
        >
          {selected ? `${t.money.save} · ${selected.icon} ${selected.name}` : t.money.chooseCategory}
        </Button>
      </div>
    </form>
  )
}
