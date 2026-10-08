// Генерирует иконки приложения «Ритм» из SVG. Запуск: node scripts/generate-icons.mjs
// Рисунок — три кольца (вода / сон / шаги), как на главном экране.
import sharp from "sharp"
import { mkdirSync } from "node:fs"

const BG = "#0a0a0a"
const RINGS = [
  { r: 196, color: "#38bdf8", part: 0.72 },
  { r: 138, color: "#818cf8", part: 0.86 },
  { r: 80, color: "#34d399", part: 0.6 },
]

// padding — доля холста под «безопасную зону» (для maskable нужна побольше)
function svg(padding) {
  const scale = 1 - padding * 2
  const arcs = RINGS.map(({ r, color, part }) => {
    const len = 2 * Math.PI * r
    return `
      <circle cx="256" cy="256" r="${r}" fill="none" stroke="#262626" stroke-width="44"/>
      <circle cx="256" cy="256" r="${r}" fill="none" stroke="${color}" stroke-width="44"
        stroke-linecap="round" stroke-dasharray="${part * len} ${len}" transform="rotate(-90 256 256)"/>`
  }).join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${BG}"/>
    <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">${arcs}</g>
  </svg>`
}

const out = async (file, size, padding) =>
  sharp(Buffer.from(svg(padding))).resize(size, size).png().toFile(file)

mkdirSync("public/icons", { recursive: true })
await out("public/icons/icon-192.png", 192, 0.06)
await out("public/icons/icon-512.png", 512, 0.06)
await out("public/icons/maskable-512.png", 512, 0.16) // Android обрезает края в круг/скруглённый квадрат
await out("app/apple-icon.png", 180, 0.1)
await out("app/icon.png", 64, 0.04)
console.log("Иконки готовы")
