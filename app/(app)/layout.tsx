import { redirect } from "next/navigation"
import { getProfile } from "@/lib/auth"
import { TabBar } from "@/components/tab-bar"

// Общая оболочка для всех экранов после входа: контент + нижний таб-бар
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile()
  if (!profile.name) redirect("/onboarding")

  return (
    <>
      <main className="mx-auto w-full max-w-lg px-4 pt-6 pb-28">{children}</main>
      <TabBar />
    </>
  )
}
