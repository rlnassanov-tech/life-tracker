import { t } from "@/messages/ru"

export default function UniPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t.nav.uni}</h1>
      <p className="text-muted-foreground">{t.common.soon}</p>
    </div>
  )
}
