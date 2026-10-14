import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Minus, Plus, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Ring, fmtShort } from "@/components/ring"
import { TransactionDrawer } from "@/components/finance/transaction-drawer"
import { getProfile } from "@/lib/auth"
import { getFinCategories, getTransactions } from "@/lib/data/finance"
import { formatDay } from "@/lib/dates"
import { expensesByCategory, formatMoney, formatMonth, monthRange, shiftMonth, totalsByCurrency } from "@/lib/money"
import { getToday } from "@/lib/today"
import type { Currency, Transaction } from "@/lib/types"
import { t } from "@/messages/ru"

export default async function MoneyPage({ searchParams }: PageProps<"/money">) {
  const today = await getToday()
  const currentMonth = today.slice(0, 7)

  // ?m=2026-09 — прошлый месяц. Будущие не показываем
  const { m } = await searchParams
  const month = typeof m === "string" && /^\d{4}-\d{2}$/.test(m) && m < currentMonth ? m : currentMonth
  const isCurrent = month === currentMonth
  const { from, to, days } = monthRange(month)
  const prev = monthRange(shiftMonth(month, -1))

  const [profile, categories, list, prevList] = await Promise.all([
    getProfile(),
    getFinCategories(),
    getTransactions(from, to),
    getTransactions(prev.from, prev.to),
  ])
  const main = (profile.currency ?? "KZT") as Currency
  const active = categories.filter((c) => !c.archived)
  const drawer = { categories: active, today, currency: main }

  // ---- Итоги ----
  const totals = totalsByCurrency(list)
  const mainTotals = totals[main] ?? { income: 0, expense: 0 }
  const others = (Object.entries(totals) as [Currency, { income: number; expense: number }][]).filter(([c]) => c !== main)

  // ---- Аналитика (в основной валюте) ----
  const byCategory = expensesByCategory(list, categories, main)
  const maxCategory = Math.max(1, ...byCategory.map((r) => r.amount))

  const perDay: number[] = Array.from({ length: days }, () => 0)
  for (const tx of list) {
    if (tx.kind === "expense" && tx.currency === main) perDay[Number(tx.date.slice(8, 10)) - 1] += tx.amount
  }
  const maxDay = Math.max(1, ...perDay)
  const daysPassed = isCurrent ? Number(today.slice(8, 10)) : days
  const avgPerDay = mainTotals.expense / daysPassed

  // Для текущего месяца сравниваем с тем же числом дней прошлого (1–14 октября vs 1–14 сентября),
  // иначе полмесяца всегда выглядели бы «экономнее» целого прошлого
  const prevSameDays = prevList.filter((tx) => Number(tx.date.slice(8, 10)) <= daysPassed)
  const prevExpense = totalsByCurrency(prevSameDays)[main]?.expense ?? 0
  const vsPrev = prevExpense ? Math.round(((mainTotals.expense - prevExpense) / prevExpense) * 100) : null

  // ---- Бюджеты ----
  const budgets = active
    .filter((c) => c.kind === "expense" && c.monthly_budget)
    .map((c) => ({ category: c, limit: c.monthly_budget!, spent: byCategory.find((r) => r.category.id === c.id)?.amount ?? 0 }))
  const budgetLimit = budgets.reduce((s, b) => s + b.limit, 0)
  const budgetSpent = budgets.reduce((s, b) => s + b.spent, 0)

  // ---- Операции по дням ----
  const byDate = new Map<string, Transaction[]>()
  for (const tx of list) byDate.set(tx.date, [...(byDate.get(tx.date) ?? []), tx])
  const categoryOf = (id: string) => categories.find((c) => c.id === id)

  const balance = mainTotals.income - mainTotals.expense

  return (
    <div className="flex flex-col gap-6">
      {/* Заголовок и переключение месяцев */}
      <header className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="icon-lg" aria-label={t.money.prevMonth}>
          <Link href={`/money?m=${shiftMonth(month, -1)}`}>
            <ChevronLeft />
          </Link>
        </Button>
        <div className="text-center">
          <h1 className="text-2xl font-semibold">{t.nav.money}</h1>
          <p className="text-sm text-muted-foreground">
            {formatMonth(month)}
            {!isCurrent && (
              <Link href="/money" className="ml-2 underline">
                {t.money.current}
              </Link>
            )}
          </p>
        </div>
        <Button asChild={!isCurrent} variant="ghost" size="icon-lg" disabled={isCurrent} aria-label={t.money.nextMonth}>
          {isCurrent ? (
            <ChevronRight />
          ) : (
            <Link href={shiftMonth(month, 1) === currentMonth ? "/money" : `/money?m=${shiftMonth(month, 1)}`}>
              <ChevronRight />
            </Link>
          )}
        </Button>
      </header>

      {/* Остаток месяца */}
      <section className="flex flex-col gap-3 rounded-2xl bg-card p-4">
        <div>
          <div className="text-sm text-muted-foreground">{t.money.balance}</div>
          <div className={`text-3xl font-semibold tabular-nums ${balance < 0 ? "text-red-400" : ""}`}>
            {formatMoney(balance, main, true)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="size-4 text-emerald-400" />
            <span className="text-muted-foreground">{t.money.income}</span>
            <span className="ml-auto font-medium tabular-nums">{formatMoney(mainTotals.income, main)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowDownRight className="size-4 text-red-400" />
            <span className="text-muted-foreground">{t.money.expense}</span>
            <span className="ml-auto font-medium tabular-nums">{formatMoney(mainTotals.expense, main)}</span>
          </div>
        </div>
        {others.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t.money.also}{" "}
            {others
              .flatMap(([c, v]) => [
                v.income ? formatMoney(v.income, c, true) : null,
                v.expense ? formatMoney(-v.expense, c, true) : null,
              ])
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </section>

      {/* Быстрые кнопки */}
      <div className="grid grid-cols-[2fr_1fr] gap-3">
        <TransactionDrawer
          {...drawer}
          kind="expense"
          trigger={
            <Button className="h-14 text-lg">
              <Minus className="size-5" /> {t.money.addExpense}
            </Button>
          }
        />
        <TransactionDrawer
          {...drawer}
          kind="income"
          trigger={
            <Button variant="secondary" className="h-14 text-lg text-emerald-400">
              <Plus className="size-5" /> {t.money.addIncome}
            </Button>
          }
        />
      </div>

      {/* Бюджеты — кольцами */}
      {budgets.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm text-muted-foreground">{t.money.budgets}</h2>
            <span className={`text-sm tabular-nums ${budgetSpent > budgetLimit ? "text-red-400" : "text-muted-foreground"}`}>
              {t.money.budgetsTotal(formatMoney(budgetSpent, main), formatMoney(budgetLimit, main))}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {budgets.map(({ category, limit, spent }) => {
              const over = spent > limit
              return (
                <div key={category.id} className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3">
                  <Ring value={spent} max={limit} color={over ? "#ef4444" : category.color} center={category.icon} />
                  <span className="w-full truncate text-center text-xs">{category.name}</span>
                  <span className={`text-xs tabular-nums ${over ? "text-red-400" : "text-muted-foreground"}`}>
                    {fmtShort(spent)} / {fmtShort(limit)}
                  </span>
                  <span className={`text-[11px] ${over ? "text-red-400" : "text-muted-foreground"}`}>
                    {over ? t.money.over : t.money.left(fmtShort(limit - spent))}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Аналитика */}
      {byCategory.length > 0 && (
        <section className="flex flex-col gap-4 rounded-2xl bg-card p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm text-muted-foreground">{t.money.byDay}</h2>
            <p className="text-sm">
              {t.money.perDay(formatMoney(Math.round(avgPerDay), main))}
              {vsPrev !== null && (
                <span className={vsPrev > 0 ? "text-red-400" : "text-emerald-400"}> · {t.money.vsPrev(vsPrev)}</span>
              )}
            </p>
          </div>
          {/* Столбики трат по дням месяца */}
          <div className="flex h-24 items-end gap-[2px]">
            {perDay.map((sum, i) => (
              <div
                key={i}
                title={`${i + 1}: ${formatMoney(sum, main)}`}
                className={`flex-1 rounded-sm ${i + 1 === Number(today.slice(8, 10)) && isCurrent ? "bg-foreground" : "bg-orange-400/80"}`}
                style={{ height: `${Math.max(sum ? 4 : 1, (sum / maxDay) * 100)}%`, opacity: sum ? 1 : 0.25 }}
              />
            ))}
          </div>

          <h2 className="mt-2 text-sm text-muted-foreground">{t.money.byCategory}</h2>
          {byCategory.map(({ category, amount }) => (
            <div key={category.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {category.icon} {category.name}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {formatMoney(amount, main)} · {Math.round((amount / mainTotals.expense) * 100)}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${(amount / maxCategory) * 100}%`, backgroundColor: category.color }} />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Операции */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-muted-foreground">{t.money.operations}</h2>
          <Link href="/money/categories" className="flex items-center gap-1 text-sm text-muted-foreground">
            <Tags className="size-4" /> {t.money.categories}
          </Link>
        </div>
        {list.length === 0 && <p className="text-muted-foreground">{t.money.empty}</p>}
        {[...byDate].map(([date, items]) => (
          <div key={date} className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground first-letter:uppercase">{formatDay(date)}</span>
            {items.map((tx) => {
              const category = categoryOf(tx.category_id)
              return (
                <TransactionDrawer
                  key={tx.id}
                  {...drawer}
                  categories={categories.filter((c) => !c.archived || c.id === tx.category_id)}
                  transaction={tx}
                  trigger={
                    <button className="flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left">
                      <span className="text-2xl">{category?.icon ?? "❓"}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{category?.name ?? "—"}</span>
                        {tx.note && <span className="block truncate text-sm text-muted-foreground">{tx.note}</span>}
                      </span>
                      <span className={`shrink-0 font-medium tabular-nums ${tx.kind === "income" ? "text-emerald-400" : ""}`}>
                        {formatMoney(tx.kind === "income" ? tx.amount : -tx.amount, tx.currency, true)}
                      </span>
                    </button>
                  }
                />
              )
            })}
          </div>
        ))}
      </section>
    </div>
  )
}
