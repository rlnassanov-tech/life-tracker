import type { Currency, FinCategory, Transaction } from "@/lib/types"

// 54000 → «54 000 ₸», 15 USD → «15 $»
export function formatMoney(amount: number, currency: Currency, signed = false) {
  const text = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(Math.abs(amount))
  if (!signed) return text
  return (amount < 0 ? "−" : "+") + text
}

export const CURRENCY_SYMBOL: Record<Currency, string> = { KZT: "₸", USD: "$", EUR: "€", RUB: "₽" }

// Месяц 'YYYY-MM' → первый и последний день
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}`, days: last }
}

export function shiftMonth(month: string, step: number) {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1 + step, 1))
  return d.toISOString().slice(0, 7)
}

// «октябрь 2026»
export function formatMonth(month: string) {
  return new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(month + "-01T00:00:00Z")
  )
}

// Итоги по валютам: { KZT: { income, expense }, USD: … }
export function totalsByCurrency(list: Transaction[]) {
  const result: Partial<Record<Currency, { income: number; expense: number }>> = {}
  for (const t of list) {
    const row = (result[t.currency] ??= { income: 0, expense: 0 })
    row[t.kind] += Number(t.amount)
  }
  return result
}

// Расходы по категориям в одной валюте, от больших к меньшим
export function expensesByCategory(list: Transaction[], categories: FinCategory[], currency: Currency) {
  const sums: Record<string, number> = {}
  for (const t of list) {
    if (t.kind === "expense" && t.currency === currency) sums[t.category_id] = (sums[t.category_id] ?? 0) + Number(t.amount)
  }
  return categories
    .filter((c) => sums[c.id])
    .map((c) => ({ category: c, amount: sums[c.id] }))
    .sort((a, b) => b.amount - a.amount)
}
