"use server"

import { revalidatePath } from "next/cache"
import * as db from "@/lib/data/activities"
import type { ActivityInput } from "@/lib/types"

// Проверяем и чистим то, что пришло из формы
function clean(input: ActivityInput): ActivityInput {
  const title = input.title.trim().slice(0, 200)
  if (!title) throw new Error("Напиши, чем занимался")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Неверная дата")
  const time = /^\d{2}:\d{2}(:\d{2})?$/
  if (!time.test(input.start_time) || !time.test(input.end_time)) throw new Error("Неверное время")
  if (input.start_time.slice(0, 5) === input.end_time.slice(0, 5)) throw new Error("Начало и конец совпадают")

  // Метка: без «#», пробелов по краям и в нижнем регистре — чтобы «Учёба» и «#учёба» считались одной
  const tag = input.tag?.replace(/^#+/, "").trim().toLowerCase().slice(0, 30) || null

  return { title, tag, date: input.date, start_time: input.start_time, end_time: input.end_time }
}

function refreshAll() {
  revalidatePath("/", "layout")
}

export async function addActivity(input: ActivityInput) {
  const id = await db.addActivity(clean(input))
  refreshAll()
  return id
}

export async function updateActivity(id: string, input: ActivityInput) {
  await db.updateActivity(id, clean(input))
  refreshAll()
}

export async function deleteActivity(id: string) {
  await db.deleteActivity(id)
  refreshAll()
}
