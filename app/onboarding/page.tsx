import { redirect } from "next/navigation"
import { getProfile } from "@/lib/auth"
import { saveName } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { t } from "@/messages/ru"

export default async function OnboardingPage() {
  const profile = await getProfile()
  if (profile.name) redirect("/")

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6">
      <form action={saveName} className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold">{t.onboarding.title}</h1>
        <Input name="name" required autoFocus aria-label={t.onboarding.name} className="h-12 text-base" />
        <Button type="submit" className="h-12 text-base">
          {t.onboarding.save}
        </Button>
      </form>
    </main>
  )
}
