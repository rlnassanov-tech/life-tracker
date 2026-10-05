"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { t } from "@/messages/ru"

// true только в браузере: сервер не знает выбранную тему,
// поэтому подсвечиваем кнопку уже после загрузки страницы
const useMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  return (
    <div className="grid grid-cols-2 gap-2">
      {(["dark", "light"] as const).map((value) => (
        <Button
          key={value}
          variant={mounted && theme === value ? "default" : "outline"}
          onClick={() => setTheme(value)}
          className="h-12 text-base"
        >
          {t.settings[value]}
        </Button>
      ))}
    </div>
  )
}
