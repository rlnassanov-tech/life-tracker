"use server"

import { revalidatePath } from "next/cache"
import * as db from "@/lib/data/uni"
import { GRADE_KINDS, type Grade, type GradeKind } from "@/lib/types"

function checkDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Неверная дата")
}

function cleanName(name: string) {
  const value = name.trim().slice(0, 60)
  if (!value) throw new Error("Введи название")
  return value
}

function refreshAll() {
  revalidatePath("/", "layout")
}

// ---------- Предметы ----------

export async function createSubject(name: string) {
  await db.createSubject(cleanName(name))
  refreshAll()
}

export async function renameSubject(id: string, name: string) {
  await db.updateSubject(id, { name: cleanName(name) })
  refreshAll()
}

export async function setSubjectArchived(id: string, archived: boolean) {
  await db.updateSubject(id, { archived })
  refreshAll()
}

// ---------- Посещаемость ----------

export async function markAttendance(subject_id: string, date: string, attended: boolean) {
  checkDate(date)
  if (!subject_id) throw new Error("Не выбран предмет")
  const id = await db.addAttendance({ subject_id, date, attended: Boolean(attended) })
  refreshAll()
  return id
}

export async function deleteAttendance(id: string) {
  await db.deleteAttendance(id)
  refreshAll()
}

// ---------- Оценки ----------

export async function addGrade(input: Omit<Grade, "id">) {
  checkDate(input.date)
  if (!input.subject_id) throw new Error("Не выбран предмет")
  const grade = Math.round(Number(input.grade) * 100) / 100
  if (!(grade >= 0 && grade <= 100)) throw new Error("Оценка от 0 до 100")
  const kind: GradeKind = GRADE_KINDS.includes(input.kind) ? input.kind : "other"

  const id = await db.addGrade({
    subject_id: input.subject_id,
    date: input.date,
    grade,
    kind,
    note: input.note?.trim() || null,
  })
  refreshAll()
  return id
}

export async function deleteGrade(id: string) {
  await db.deleteGrade(id)
  refreshAll()
}
