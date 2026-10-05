import { getProfile } from "@/lib/auth"
import { t } from "@/messages/ru"

export default async function TodayPage() {
  const profile = await getProfile()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t.today.greeting(profile.name!)}</h1>
      <p className="text-muted-foreground">{t.common.soon}</p>
    </div>
  )
}
