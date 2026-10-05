"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, GraduationCap, House, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/messages/ru"

const tabs = [
  { href: "/", label: t.nav.today, icon: House },
  { href: "/week", label: t.nav.week, icon: CalendarDays },
  { href: "/uni", label: t.nav.uni, icon: GraduationCap },
  { href: "/settings", label: t.nav.settings, icon: Settings },
]

export function TabBar() {
  const pathname = usePathname()

  return (
    // pb-[env(safe-area-inset-bottom)] — отступ под «чёлку» снизу на iPhone
    <nav className="fixed inset-x-0 bottom-0 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-6" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
