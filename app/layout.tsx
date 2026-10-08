import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { SwRegister } from "@/components/sw-register"
import { TimezoneSync } from "@/components/timezone-sync"
import { t } from "@/messages/ru"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
})

export const metadata: Metadata = {
  title: t.appName,
  description: t.appDescription,
  applicationName: t.appName,
  // iPhone: открывать с экрана «Домой» как отдельное приложение, без панелей Safari
  appleWebApp: { capable: true, title: t.appName, statusBarStyle: "black-translucent" },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  viewportFit: "cover", // контент под «чёлкой»; отступы задаём через env(safe-area-inset-*)
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning нужен next-themes: класс темы ставится до загрузки React
    <html lang="ru" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster position="top-center" />
          <TimezoneSync />
          <SwRegister />
        </ThemeProvider>
      </body>
    </html>
  )
}
