import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DEMO } from "@/lib/demo"
import { t } from "@/messages/ru"
import { LoginForm } from "./login-form"

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6">
      {DEMO ? (
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold">{t.login.title}</h1>
          <p className="text-muted-foreground">{t.login.demo}</p>
          <Button asChild className="h-12 text-base">
            <Link href="/">{t.login.demoEnter}</Link>
          </Button>
        </div>
      ) : (
        <LoginForm linkError={error === "link"} />
      )}
    </main>
  )
}
