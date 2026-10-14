"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import * as db from "@/lib/data/finance"
import { DEMO, demoProfile } from "@/lib/demo"
import { createClient } from "@/lib/supabase/server"
import { CURRENCIES, type Currency, type FinCategory, type FinKind } from "@/lib/types"

function refreshAll() {
  revalidatePath("/", "layout")
}

function checkCurrency(currency: string): Currency {
  if (!CURRENCIES.includes(currency as Currency)) throw new Error("Неверная валюта")
  return currency as Currency
}

// ---------- Операции ----------

async function clean(input: db.TransactionInput): Promise<db.TransactionInput> {
  const amount = Math.round(Number(input.amount) * 100) / 100
  if (!(amount > 0 && amount < 1e12)) throw new Error("Сумма должна быть больше нуля")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Неверная дата")

  // Тип операции берём из категории — так расход нельзя записать в категорию доходов
  const category = (await db.getFinCategories()).find((c) => c.id === input.category_id)
  if (!category) throw new Error("Не выбрана категория")

  return {
    category_id: category.id,
    kind: category.kind,
    amount,
    currency: checkCurrency(input.currency),
    date: input.date,
    note: input.note?.trim() || null,
  }
}

export async function addTransaction(input: db.TransactionInput) {
  const id = await db.addTransaction(await clean(input))
  refreshAll()
  return id
}

export async function updateTransaction(id: string, input: db.TransactionInput) {
  await db.updateTransaction(id, await clean(input))
  refreshAll()
}

export async function deleteTransaction(id: string) {
  await db.deleteTransaction(id)
  refreshAll()
}

// ---------- Категории ----------

type CategoryInput = Pick<FinCategory, "name" | "icon" | "color" | "monthly_budget">

function cleanCategory(input: CategoryInput, kind: FinKind): CategoryInput {
  const name = input.name.trim().slice(0, 40)
  if (!name) throw new Error("Введи название")
  const budget = Number(input.monthly_budget)
  return {
    name,
    icon: input.icon.trim() || "📦",
    color: /^#[0-9a-f]{6}$/i.test(input.color) ? input.color : "#64748b",
    // лимит только у расходов; 0 или пусто — без лимита
    monthly_budget: kind === "expense" && budget > 0 ? Math.round(budget) : null,
  }
}

export async function createFinCategory(input: CategoryInput & { kind: FinKind }) {
  const kind: FinKind = input.kind === "income" ? "income" : "expense"
  await db.createFinCategory({ ...cleanCategory(input, kind), kind })
  refreshAll()
}

export async function updateFinCategory(id: string, input: CategoryInput) {
  const category = (await db.getFinCategories()).find((c) => c.id === id)
  if (!category) throw new Error("Категория не найдена")
  await db.updateFinCategory(id, cleanCategory(input, category.kind))
  refreshAll()
}

export async function setFinCategoryArchived(id: string, archived: boolean) {
  await db.updateFinCategory(id, { archived })
  refreshAll()
}

// Поменять местами с соседом сверху (-1) или снизу (+1) внутри своего типа
export async function moveFinCategory(id: string, step: -1 | 1) {
  const all = await db.getFinCategories()
  const me = all.find((c) => c.id === id)
  if (!me) return
  const list = all.filter((c) => c.kind === me.kind && !c.archived)
  const i = list.findIndex((c) => c.id === id)
  const j = i + step
  if (j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j], list[i]]
  await Promise.all(list.map((c, index) => (c.sort_order === index ? null : db.updateFinCategory(c.id, { sort_order: index }))))
  refreshAll()
}

// ---------- Основная валюта ----------

export async function setCurrency(currency: string) {
  const value = checkCurrency(currency)
  if (DEMO) {
    demoProfile.currency = value
  } else {
    const supabase = await createClient()
    const { data } = await supabase.auth.getClaims()
    if (!data) redirect("/login")
    const { error } = await supabase.from("profiles").update({ currency: value }).eq("id", data.claims.sub)
    if (error) throw error
  }
  refreshAll()
}
