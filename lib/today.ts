import { cookies } from "next/headers"
import { DEFAULT_TZ, todayIn } from "@/lib/dates"

// Сервер не знает часовой пояс телефона, поэтому браузер кладёт его в cookie "tz"
// (см. components/timezone-sync.tsx). Отсюда считаем «сегодня».
export async function getToday() {
  const tz = (await cookies()).get("tz")?.value ?? DEFAULT_TZ
  try {
    return todayIn(tz)
  } catch {
    return todayIn(DEFAULT_TZ) // в cookie мусор
  }
}
