"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { t } from "@/messages/ru"

// Два шага: 1) вводим email → Supabase шлёт письмо; 2) вводим код из письма.
// Ссылка в том же письме тоже работает (её обрабатывает /auth/confirm).
export function LoginForm({ linkError }: { linkError: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(linkError ? t.login.linkError : "")

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error } = await createClient().auth.signInWithOtp({ email })
    setLoading(false)
    if (error) return setError(error.message)
    setStep("code")
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error } = await createClient().auth.verifyOtp({ email, token: code, type: "email" })
    setLoading(false)
    if (error) return setError(error.message)
    router.replace("/")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">{t.login.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {step === "email" ? t.login.subtitle : t.login.codeSent(email)}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t.login.email}</Label>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder={t.login.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          <Button type="submit" disabled={loading} className="h-12 text-base">
            {loading ? t.login.sending : t.login.send}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">{t.login.code}</Label>
            <Input
              id="code"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="h-12 text-center text-2xl tracking-[0.4em]"
            />
          </div>
          <Button type="submit" disabled={loading} className="h-12 text-base">
            {loading ? t.login.verifying : t.login.verify}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setStep("email")}>
            {t.login.otherEmail}
          </Button>
        </form>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
