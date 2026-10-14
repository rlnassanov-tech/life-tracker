import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { CategoriesManager, CurrencyPicker } from "@/components/finance/categories-manager"
import { getProfile } from "@/lib/auth"
import { getFinCategories } from "@/lib/data/finance"
import type { Currency } from "@/lib/types"
import { t } from "@/messages/ru"

export default async function CategoriesPage() {
  const [profile, categories] = await Promise.all([getProfile(), getFinCategories()])
  const currency = (profile.currency ?? "KZT") as Currency

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link href="/money" className="-ml-1 flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> {t.money.back}
        </Link>
        <h1 className="text-2xl font-semibold">{t.money.categories}</h1>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm text-muted-foreground">{t.money.mainCurrency}</h2>
        <CurrencyPicker currency={currency} />
        <p className="text-xs text-muted-foreground">{t.money.mainCurrencyHint}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm text-muted-foreground">{t.money.expenseCategories}</h2>
        <CategoriesManager kind="expense" categories={categories} currency={currency} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm text-muted-foreground">{t.money.incomeCategories}</h2>
        <CategoriesManager kind="income" categories={categories} currency={currency} />
      </section>
    </div>
  )
}
