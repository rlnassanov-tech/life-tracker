"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Записывает часовой пояс устройства в cookie, чтобы сервер правильно считал «сегодня».
// Если пояс изменился (первый заход, перелёт) — перерисовываем страницу.
export function TimezoneSync() {
  const router = useRouter()

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const current = document.cookie.match(/(?:^|; )tz=([^;]*)/)?.[1]
    if (current && decodeURIComponent(current) === tz) return

    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }, [router])

  return null
}
