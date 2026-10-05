import { logout } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { t } from "@/messages/ru"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t.nav.settings}</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm text-muted-foreground">{t.settings.theme}</h2>
        <ThemeToggle />
      </section>

      <form action={logout}>
        <Button type="submit" variant="destructive" className="h-12 w-full text-base">
          {t.settings.logout}
        </Button>
      </form>
    </div>
  )
}
