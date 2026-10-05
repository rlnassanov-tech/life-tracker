"use server"

import { revalidatePath } from "next/cache"
import * as db from "@/lib/data/directions"
import type { Direction } from "@/lib/types"

type DirectionInput = Pick<Direction, "name" | "icon" | "color">

function clean(input: DirectionInput): DirectionInput {
  const name = input.name.trim()
  if (!name) throw new Error("Введи название")
  return {
    name: name.slice(0, 40),
    icon: input.icon.trim() || "⭐",
    color: /^#[0-9a-f]{6}$/i.test(input.color) ? input.color : "#3b82f6",
  }
}

export async function createDirection(input: DirectionInput) {
  await db.createDirection(clean(input))
  revalidatePath("/", "layout")
}

export async function updateDirection(id: string, input: DirectionInput) {
  await db.updateDirection(id, clean(input))
  revalidatePath("/", "layout")
}

export async function setArchived(id: string, archived: boolean) {
  await db.updateDirection(id, { archived })
  revalidatePath("/", "layout")
}

// Поменять местами с соседом сверху (-1) или снизу (+1) среди активных направлений
export async function moveDirection(id: string, step: -1 | 1) {
  const active = (await db.getDirections()).filter((d) => !d.archived)
  const i = active.findIndex((d) => d.id === id)
  const j = i + step
  if (i < 0 || j < 0 || j >= active.length) return

  // Переназначаем порядок всем подряд — так он всегда 0, 1, 2… без дублей
  const reordered = [...active]
  ;[reordered[i], reordered[j]] = [reordered[j], reordered[i]]
  await Promise.all(
    reordered.map((d, index) => (d.sort_order === index ? null : db.updateDirection(d.id, { sort_order: index })))
  )
  revalidatePath("/", "layout")
}
