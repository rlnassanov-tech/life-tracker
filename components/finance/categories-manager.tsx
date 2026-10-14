"use client"

import { useState, useTransition } from "react"
import { ChevronDown, ChevronUp, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import {
  createFinCategory,
  moveFinCategory,
  setCurrency,
  setFinCategoryArchived,
  updateFinCategory,
} from "@/lib/actions/finance"
import { COLORS } from "@/lib/colors"
import { CURRENCY_SYMBOL, formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import { CURRENCIES, type Currency, type FinCategory, type FinKind } from "@/lib/types"
import { t } from "@/messages/ru"

const EMOJIS = ["🍔", "☕", "🚕", "🏠", "📱", "📚", "💊", "👕", "🎮", "🎁", "✈️", "💳", "💼", "💻", "🎓", "💰"]

// Выбор основной валюты
export function CurrencyPicker({ currency }: { currency: Currency }) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="grid grid-cols-4 gap-2">
      {CURRENCIES.map((c) => (
        <Button
          key={c}
          variant={c === currency ? "default" : "outline"}
          disabled={pending}
          onClick={() => startTransition(() => setCurrency(c))}
          className="h-12"
        >
          {CURRENCY_SYMBOL[c]} {c}
        </Button>
      ))}
    </div>
  )
}

// Список категорий одного типа: порядок, правка, архив, добавление
export function CategoriesManager({
  kind,
  categories,
  currency,
}: {
  kind: FinKind
  categories: FinCategory[]
  currency: Currency
}) {
  const [pending, startTransition] = useTransition()
  const active = categories.filter((c) => c.kind === kind && !c.archived)
  const archived = categories.filter((c) => c.kind === kind && c.archived)
  const move = (id: string, step: -1 | 1) => startTransition(() => moveFinCategory(id, step))

  return (
    <div className="flex flex-col gap-2">
      {active.map((c, i) => (
        <div key={c.id} className="flex items-center gap-1 rounded-2xl border-l-4 bg-card p-2" style={{ borderLeftColor: c.color }}>
          <CategoryDrawer
            kind={kind}
            category={c}
            currency={currency}
            trigger={
              <button className="flex min-w-0 flex-1 items-center gap-3 px-2 py-1 text-left">
                <span className="text-2xl">{c.icon}</span>
                <span className="min-w-0">
                  <span className="block truncate">{c.name}</span>
                  {c.monthly_budget && (
                    <span className="block text-xs text-muted-foreground">
                      {t.money.budget}: {formatMoney(c.monthly_budget, currency)}
                    </span>
                  )}
                </span>
              </button>
            }
          />
          <Button variant="ghost" size="icon-lg" disabled={pending || i === 0} onClick={() => move(c.id, -1)} aria-label={t.settings.up}>
            <ChevronUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            disabled={pending || i === active.length - 1}
            onClick={() => move(c.id, 1)}
            aria-label={t.settings.down}
          >
            <ChevronDown />
          </Button>
        </div>
      ))}

      <CategoryDrawer
        kind={kind}
        currency={currency}
        trigger={
          <Button variant="outline" className="h-12 text-base">
            <Plus /> {t.money.addCategory}
          </Button>
        }
      />

      {archived.length > 0 && (
        <>
          <h3 className="mt-2 text-sm text-muted-foreground">{t.money.archive}</h3>
          {archived.map((c) => (
            <CategoryDrawer
              key={c.id}
              kind={kind}
              category={c}
              currency={currency}
              trigger={
                <button className="flex items-center gap-3 rounded-2xl bg-card/50 p-3 text-left text-muted-foreground">
                  <span className="text-2xl opacity-60">{c.icon}</span>
                  <span className="truncate">{c.name}</span>
                </button>
              }
            />
          ))}
        </>
      )}
    </div>
  )
}

type DrawerProps = { kind: FinKind; category?: FinCategory; currency: Currency; trigger: React.ReactNode }

function CategoryDrawer({ trigger, ...props }: DrawerProps) {
  const [open, setOpen] = useState(false)
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle>{props.category ? t.money.editCategory : t.money.newCategory}</DrawerTitle>
        </DrawerHeader>
        <CategoryForm {...props} onDone={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  )
}

function CategoryForm({ kind, category, currency, onDone }: Omit<DrawerProps, "trigger"> & { onDone: () => void }) {
  const [name, setName] = useState(category?.name ?? "")
  const [icon, setIcon] = useState(category?.icon ?? "📦")
  const [color, setColor] = useState(category?.color ?? COLORS[0])
  const [budget, setBudget] = useState(category?.monthly_budget ? String(category.monthly_budget) : "")
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
    const input = { name, icon, color, monthly_budget: budget ? Number(budget) : null }
    run(() => (category ? updateFinCategory(category.id, input) : createFinCategory({ ...input, kind })))
  }

  return (
    <form onSubmit={submit} className="flex max-h-[75dvh] flex-col gap-5 overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cat-name">{t.money.name}</Label>
        <Input id="cat-name" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cat-icon">{t.money.icon}</Label>
        <div className="flex items-center gap-2">
          <Input id="cat-icon" value={icon} maxLength={8} onChange={(e) => setIcon(e.target.value)} className="h-12 w-20 text-center text-2xl" />
          <div className="flex flex-1 gap-1 overflow-x-auto">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setIcon(e)} className="size-11 shrink-0 rounded-lg text-2xl hover:bg-muted">
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t.money.color}</span>
        <div className="grid grid-cols-5 gap-3">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              className={cn("h-11 rounded-full ring-offset-2 ring-offset-background", c === color && "ring-2 ring-foreground")}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {kind === "expense" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="cat-budget">
            {t.money.budget}, {CURRENCY_SYMBOL[currency]}
          </Label>
          <Input
            id="cat-budget"
            inputMode="numeric"
            placeholder={t.money.budgetHint}
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
            className="h-12 text-base"
          />
        </div>
      )}

      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {t.money.save}
      </Button>
      {category && (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => setFinCategoryArchived(category.id, !category.archived))}
          className="h-12"
        >
          {category.archived ? t.money.fromArchive : t.money.toArchive}
        </Button>
      )}
    </form>
  )
}
