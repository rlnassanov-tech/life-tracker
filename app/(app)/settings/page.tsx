import { logout } from "@/lib/actions/profile"
import { getProfile } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { DeleteAccountButton } from "@/components/delete-account-button"
import { GoalsForm } from "@/components/goals-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { t } from "@/messages/ru"

export default async function SettingsPage() {
  const profile = await getProfile()

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">{t.nav.settings}</h1>


      <section className="flex flex-col gap-2">
        <h2 className="text-sm text-muted-foreground">{t.settings.goals}</h2>
        <GoalsForm water={profile.water_goal_ml} steps={profile.steps_goal} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm text-muted-foreground">{t.settings.theme}</h2>
        <ThemeToggle />
      </section>

      <form action={logout}>
        <Button type="submit" variant="destructive" className="h-12 w-full text-base">
          {t.settings.logout}
        </Button>
      </form>

      <DeleteAccountButton />
    </div>
  )
}
