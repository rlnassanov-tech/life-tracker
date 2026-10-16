import { COLORS } from "@/lib/colors"

// Цвет метки: одна и та же метка всегда получает один и тот же цвет из палитры
export function tagColor(tag: string | null) {
  if (!tag) return "#64748b" // без метки — серый
  let hash = 0
  for (const ch of tag) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return COLORS[hash % COLORS.length]
}
