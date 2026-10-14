import "server-only"
import { createClient } from "@/lib/supabase/server"
import { DEMO } from "@/lib/demo"
import { demoStore } from "@/lib/data/demo-store"
import type { Balance, Currency, FinCategory, Transaction } from "@/lib/types"

// Запросы для вкладки «Деньги»: категории и операции

const CAT_COLUMNS = "id, name, icon, color, kind, monthly_budget, archived, sort_order"
const TX_COLUMNS = "id, category_id, kind, amount, currency, date, note"

// numeric из Postgres может прийти строкой — приводим к числу
const toCategory = (c: FinCategory): FinCategory => ({
  ...c,
  monthly_budget: c.monthly_budget == null ? null : Number(c.monthly_budget),
})
const toTransaction = (t: Transaction): Transaction => ({ ...t, amount: Number(t.amount) })

// ---------- Категории ----------

export async function getFinCategories(): Promise<FinCategory[]> {
  if (DEMO) return [...demoStore.finCategories].sort((a, b) => a.sort_order - b.sort_order)

  const supabase = await createClient()
  const { data, error } = await supabase.from("fin_categories").select(CAT_COLUMNS).order("sort_order").order("created_at")
  if (error) throw error
  return data.map(toCategory)
}

type CategoryInput = Pick<FinCategory, "name" | "icon" | "color" | "kind" | "monthly_budget">

export async function createFinCategory(input: CategoryInput) {
  const all = await getFinCategories()
  const sort_order = Math.max(-1, ...all.filter((c) => c.kind === input.kind).map((c) => c.sort_order)) + 1

  if (DEMO) {
    demoStore.finCategories.push({ ...input, id: crypto.randomUUID(), archived: false, sort_order })
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("fin_categories").insert({ ...input, sort_order })
  if (error) throw error
}

export async function updateFinCategory(
  id: string,
  patch: Partial<Pick<FinCategory, "name" | "icon" | "color" | "monthly_budget" | "archived" | "sort_order">>
) {
  if (DEMO) {
    const c = demoStore.finCategories.find((c) => c.id === id)
    if (c) Object.assign(c, patch)
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("fin_categories").update(patch).eq("id", id)
  if (error) throw error
}

// ---------- Операции ----------

// Операции за период, свежие сверху
export async function getTransactions(from: string, to: string): Promise<Transaction[]> {
  if (DEMO) {
    return [...demoStore.transactions]
      .reverse()
      .filter((t) => t.date >= from && t.date <= to)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transactions")
    .select(TX_COLUMNS)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) throw error
  return data.map(toTransaction)
}

export type TransactionInput = Omit<Transaction, "id">

// Возвращает id новой операции — для «Отменить»
export async function addTransaction(input: TransactionInput) {
  if (DEMO) {
    const id = crypto.randomUUID()
    demoStore.transactions.push({ ...input, id, created_at: new Date().toISOString() })
    return id
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from("transactions").insert(input).select("id").single()
  if (error) throw error
  return data.id as string
}

export async function updateTransaction(id: string, input: TransactionInput) {
  if (DEMO) {
    const t = demoStore.transactions.find((t) => t.id === id)
    if (t) Object.assign(t, input)
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("transactions").update(input).eq("id", id)
  if (error) throw error
}

export async function deleteTransaction(id: string) {
  if (DEMO) {
    demoStore.transactions = demoStore.transactions.filter((t) => t.id !== id)
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) throw error
}

// ---------- Баланс ----------

// Текущий баланс по каждой валюте, где он введён:
// введённая сумма + доходы − расходы по операциям, добавленным после ввода
export async function getBalances(): Promise<Balance[]> {
  if (DEMO) {
    return demoStore.balances.map((b) => {
      const delta = demoStore.transactions
        .filter((t) => t.currency === b.currency && t.created_at && t.created_at > b.as_of)
        .reduce((sum, t) => sum + (t.kind === "income" ? t.amount : -t.amount), 0)
      return { currency: b.currency, amount: b.amount + delta, as_of: b.as_of }
    })
  }

  const supabase = await createClient()
  const { data: rows, error } = await supabase.from("balances").select("currency, amount, as_of")
  if (error) throw error

  return Promise.all(
    rows.map(async (b) => {
      const { data: after, error } = await supabase
        .from("transactions")
        .select("kind, amount")
        .eq("currency", b.currency)
        .gt("created_at", b.as_of)
      if (error) throw error
      const delta = after.reduce((sum, t) => sum + (t.kind === "income" ? Number(t.amount) : -Number(t.amount)), 0)
      return { currency: b.currency as Currency, amount: Number(b.amount) + delta, as_of: b.as_of }
    })
  )
}

// Ввести баланс вручную: «сейчас у меня X» — отсчёт начинается заново
export async function setBalance(currency: Currency, amount: number) {
  const as_of = new Date().toISOString()

  if (DEMO) {
    const row = demoStore.balances.find((b) => b.currency === currency)
    if (row) Object.assign(row, { amount, as_of })
    else demoStore.balances.push({ currency, amount, as_of })
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("balances").upsert({ currency, amount, as_of }, { onConflict: "user_id,currency" })
  if (error) throw error
}
