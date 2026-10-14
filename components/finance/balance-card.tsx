"use client"

import { useState, useTransition } from "react"
import { Pencil, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { setBalance } from "@/lib/actions/finance"
import { CURRENCY_SYMBOL, formatMoney } from "@/lib/money"
import { CURRENCIES, type Balance, type Currency } from "@/lib/types"
import { t } from "@/messages/ru"

// Карточка «Баланс сейчас». Нажатие — ввести реальную сумму вручную
export function BalanceCard({ balances, currency: main }: { balances: Balance[]; currency: Currency }) {
  const [open, setOpen] = useState(false)
  const mainBalance = balances.find((b) => b.currency === main)
  const others = balances.filter((b) => b.currency !== main)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left">
          <Wallet className="size-6 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-muted-foreground">{t.money.total}</span>
            {mainBalance ? (
              <span className={`block text-3xl font-semibold tabular-nums ${mainBalance.amount < 0 ? "text-red-400" : ""}`}>
                {mainBalance.amount < 0 ? "−" : ""}
                {formatMoney(mainBalance.amount, main)}
              </span>
            ) : (
              <span className="block font-medium">{t.money.totalEmpty}</span>
            )}
            {others.length > 0 && (
              <span className="block text-sm text-muted-foreground tabular-nums">
                {others.map((b) => (b.amount < 0 ? "−" : "") + formatMoney(b.amount, b.currency)).join(" · ")}
              </span>
            )}
          </span>
          <Pencil className="size-4 shrink-0 text-muted-foreground" aria-label={t.money.totalHint} />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle>{t.money.setBalance}</DrawerTitle>
          <DrawerDescription>{t.money.setBalanceHint}</DrawerDescription>
        </DrawerHeader>
        <BalanceForm balances={balances} main={main} onDone={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  )
}

function BalanceForm({ balances, main, onDone }: { balances: Balance[]; main: Currency; onDone: () => void }) {
  const [currency, setCurrency] = useState<Currency>(main)
  const current = balances.find((b) => b.currency === currency)
  // Подставляем текущий баланс выбранной валюты — удобно поправить на пару тысяч
  const [amount, setAmount] = useState(current ? String(current.amount) : "")
  const [pending, startTransition] = useTransition()

  function pickCurrency(c: Currency) {
    setCurrency(c)
    const b = balances.find((b) => b.currency === c)
    setAmount(b ? String(b.amount) : "")
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount.replace(",", ".").replace(/\s/g, ""))
    startTransition(async () => {
      try {
        await setBalance(currency, value)
        toast.success(t.money.saved)
        onDone()
      } catch {
        toast.error(t.common.error)
      }
    })
  }

  const currencies = [main, ...CURRENCIES.filter((c) => c !== main)]

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-4 gap-2">
        {currencies.map((c) => (
          <Button key={c} type="button" variant={c === currency ? "default" : "outline"} onClick={() => pickCurrency(c)} className="h-10">
            {CURRENCY_SYMBOL[c]} {c}
          </Button>
        ))}
      </div>
      <Input
        inputMode="decimal"
        autoFocus
        required
        placeholder="0"
        aria-label={t.money.amount}
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d.,-]/g, ""))}
        className="h-16 text-center text-3xl font-semibold"
      />
      <Button type="submit" disabled={pending || amount === ""} className="h-14 text-lg">
        {t.money.save}
      </Button>
    </form>
  )
}
