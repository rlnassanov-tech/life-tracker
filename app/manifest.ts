import type { MetadataRoute } from "next"
import { t } from "@/messages/ru"

// Web App Manifest — «паспорт» приложения для установки на телефон:
// название под иконкой, иконки, цвета, открывать без адресной строки (standalone)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: t.appName,
    short_name: t.appName,
    description: t.appDescription,
    lang: "ru",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
