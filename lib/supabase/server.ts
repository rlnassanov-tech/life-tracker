import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Клиент Supabase для серверного кода: страницы, server actions, route handlers.
// Сессия пользователя хранится в cookies, поэтому клиент читает их из запроса.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Вызов из серверного компонента: там cookies менять нельзя.
            // Не страшно — сессию обновляет proxy.ts на каждом запросе.
          }
        },
      },
    }
  )
}
