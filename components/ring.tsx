// Кольцо прогресса: серый круг + цветная дуга. Длина дуги = доля от цели.
// Без хуков — работает и в серверных, и в клиентских компонентах.
export function Ring({ value, max, color, center }: { value: number; max: number; color: string; center: string }) {
  const r = 30
  const length = 2 * Math.PI * r
  const part = Math.min(1, max ? value / max : 0)
  return (
    <span className="relative block size-[72px]">
      <svg viewBox="0 0 72 72" className="size-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="7" className="stroke-muted" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${part * length} ${length}`}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
        {center}
      </span>
    </span>
  )
}

// 3200 → «3,2k», 750 → «750»
export const fmtShort = (n: number) =>
  n >= 1000 ? `${(n / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}k` : String(Math.round(n))

// 7.5 часа → «7:30»
export const fmtHours = (h: number) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`

// Цвета колец — одинаковые на всех экранах
export const RING_COLORS = { water: "#38bdf8", sleep: "#818cf8", steps: "#34d399" }
