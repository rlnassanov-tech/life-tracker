"use client"

import { useEffect } from "react"

// Регистрирует service worker. Только в production: в разработке он мешал бы видеть свежий код
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {})
  }, [])

  return null
}
