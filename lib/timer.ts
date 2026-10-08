"use client"

import { useSyncExternalStore } from "react"

// Таймер занятия. Хранится в localStorage, поэтому переживает перезагрузку
// и закрытие вкладки (но живёт на одном устройстве). Одновременно — один таймер.

export type Timer = { directionId: string; startedAt: number }

const KEY = "timer"
const EVENT = "timer-change"

function read(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null // приватный режим / хранилище недоступно
  }
}

export function startTimer(directionId: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ directionId, startedAt: Date.now() }))
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

export function clearTimer() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

// Подписка: своё событие (эта вкладка) + storage (другие вкладки)
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

// Текущий таймер или null. useSyncExternalStore — способ React читать «внешнее» состояние
export function useTimer(): Timer | null {
  const raw = useSyncExternalStore(subscribe, read, () => null)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Timer
  } catch {
    return null
  }
}

// Текущее время в секундах, обновляется раз в секунду (только пока active)
export function useNowSeconds(active: boolean) {
  return useSyncExternalStore(
    (callback) => {
      if (!active) return () => {}
      const id = setInterval(callback, 1000)
      return () => clearInterval(id)
    },
    () => Math.floor(Date.now() / 1000),
    () => 0
  )
}

// 754 сек → «12:34», 3754 → «1:02:34»
export function formatElapsed(seconds: number) {
  const s = Math.max(0, seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`
}

// Сколько минут записать при остановке (минимум 1)
export function elapsedMinutes(timer: Timer) {
  return Math.max(1, Math.round((Date.now() - timer.startedAt) / 60000))
}
