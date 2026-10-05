"use server"

import { revalidatePath } from "next/cache"
import * as db from "@/lib/data/sessions"
import type { SessionInput } from "@/lib/types"

// Server actions для записей. Данные приходят из браузера — им нельзя доверять,
// поэтому сначала проверяем и чистим.
function clean(input: SessionInput): SessionInput {
  const duration_min = Math.round(Number(input.duration_min))
  if (!input.direction_id) throw new Error("Не выбрано направление")
  if (!(duration_min > 0 && duration_min <= 1440)) throw new Error("Длительность от 1 до 1440 минут")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Неверная дата")

  return {
    direction_id: input.direction_id,
    date: input.date,
    duration_min,
    title: input.title?.trim() || null,
    note: input.note?.trim() || null,
  }
}

// После изменения перерисовываем все страницы — суммы есть и на «Сегодня», и на направлении
function refreshAll() {
  revalidatePath("/", "layout")
}

export async function addSession(input: SessionInput) {
  await db.addSession(clean(input))
  refreshAll()
}

export async function updateSession(id: string, input: SessionInput) {
  await db.updateSession(id, clean(input))
  refreshAll()
}

export async function deleteSession(id: string) {
  await db.deleteSession(id)
  refreshAll()
}
