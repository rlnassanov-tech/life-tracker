"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { t } from "@/messages/ru"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="grid grid-cols-2 gap-2">
      {(["dark", "light"] as const).map((value) => (
        <Button
          key={value}
          variant={theme === value ? "default" : "outline"}
          onClick={() => setTheme(value)}
          className="h-12 text-base"
        >
          {t.settings[value]}
        </Button>
      ))}
    </div>
  )
}
