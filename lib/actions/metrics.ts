"use server"

import { revalidatePath } from "next/cache"
import * as db from "@/lib/data/metrics"

function checkDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Неверная дата")
}

function checkTime(time: string) {
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) throw new Error("Неверное время")
}

// +250 / −250. Читаем текущее значение и сохраняем новое (не ниже нуля)
export async function addWater(date: string, delta: number) {
  checkDate(date)
  const current = await db.getMetrics(date)
  const water_ml = Math.min(20000, Math.max(0, current.water_ml + Math.round(delta)))
  await db.saveMetrics(date, { water_ml })
  revalidatePath("/", "layout")
}

export async function saveSleep(date: string, start: string, end: string) {
  checkDate(date)
  checkTime(start)
  checkTime(end)
  await db.saveMetrics(date, { sleep_start: start, sleep_end: end })
  revalidatePath("/", "layout")
}

export async function saveSteps(date: string, steps: number) {
  checkDate(date)
  const value = Math.round(Number(steps))
  if (!(value >= 0 && value <= 200000)) throw new Error("Неверное число шагов")
  await db.saveMetrics(date, { steps: value })
  revalidatePath("/", "layout")
}
