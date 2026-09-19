// Generates the Open Graph images for every localized page into
// public/og/<locale>[-<page>].png (1200 x 630) plus public/og-image.png for
// the default locale. Run via `pnpm og`; the output is committed so the
// static build does not depend on this script.
//
// The layout is a "grid" card: dashed background grid, dashed inset frame
// with corner ticks, brand mark top-left, title + description, and a
// monospace "NAT" token echoing the hero heading on the site.

import { Resvg } from "@resvg/resvg-js"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import satori from "satori"

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), "..")

const WIDTH = 1200
const HEIGHT = 630
const LOCALES = ["en", "zh", "de", "es", "fr"]
const SITE_HOST = new URL(
  process.env.VITE_SITE_URL || "https://nat-checker.kkcloud.org"
).host

/** Pages to render per locale: [file suffix, title key, description key]. */
const PAGES = [
  ["", "uiStrings_appTitle", "uiStrings_appDescription"],
  ["-nat-types", "uiStrings_natTypesTitle", "uiStrings_otherNATTypesDescription"],
]

// Palette mirrors the shadcn light theme tokens plus --beam-from.
const C = {
  bg: "#fafafa",
  fg: "#0a0a0a",
  muted: "#f0f0f0",
  mutedFg: "#707070",
  grid: "#e2e2e2",
  frame: "#b8b8b8",
  accent: "#4f5bd5",
}

const font = (pkg, file) =>
  readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`))

const FONTS = [
  { name: "Inter", weight: 400, data: font("inter", "inter-latin-400-normal.woff") },
  { name: "Inter", weight: 700, data: font("inter", "inter-latin-700-normal.woff") },
  { name: "Inter", weight: 400, data: font("inter", "inter-latin-ext-400-normal.woff") },
  { name: "Inter", weight: 700, data: font("inter", "inter-latin-ext-700-normal.woff") },
  {
    name: "Noto Sans SC",
    weight: 400,
    data: font("noto-sans-sc", "noto-sans-sc-chinese-simplified-400-normal.woff"),
  },
  {
    name: "Noto Sans SC",
    weight: 700,
    data: font("noto-sans-sc", "noto-sans-sc-chinese-simplified-700-normal.woff"),
  },
  {
    name: "JetBrains Mono",
    weight: 700,
    data: font("jetbrains-mono", "jetbrains-mono-latin-700-normal.woff"),
  },
].map((f) => ({ ...f, style: "normal" }))

const LOGO = `data:image/png;base64,${readFileSync(join(root, "public/logo.png")).toString("base64")}`

const h = (type, props, ...children) => ({
  type,
  props: {
    ...props,
    children:
      children.length === 0
        ? undefined
        : children.length === 1
          ? children[0]
          : children,
  },
})

/** Dashed grid lines covering the whole canvas. */
function gridLines(step = 60) {
  const lines = []
  for (let x = step; x < WIDTH; x += step) {
    lines.push(
      h("div", {
        style: {
          position: "absolute",
          left: x,
          top: 0,
          width: 0,
          height: HEIGHT,
          borderLeft: `1px dashed ${C.grid}`,
        },
      })
    )
  }
  for (let y = step; y < HEIGHT; y += step) {
    lines.push(
      h("div", {
        style: {
          position: "absolute",
          top: y,
          left: 0,
          height: 0,
          width: WIDTH,
          borderTop: `1px dashed ${C.grid}`,
        },
      })
    )
  }
  return lines
}

/** Small "+" tick at a frame corner. */
function cornerTick(x, y) {
  const size = 20
  return h(
    "div",
    {
      style: {
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        display: "flex",
      },
    },
    h("div", {
      style: {
        position: "absolute",
        left: size / 2 - 1,
        top: 0,
        width: 2,
        height: size,
        background: C.fg,
      },
    }),
    h("div", {
      style: {
        position: "absolute",
        top: size / 2 - 1,
        left: 0,
        height: 2,
        width: size,
        background: C.fg,
      },
    })
  )
}

function card({ title, description, brand, lang }) {
  const inset = 48
  const cjk = lang === "zh"
  const fontFamily = cjk ? "Noto Sans SC, Inter" : "Inter, Noto Sans SC"

  return h(
    "div",
    {
      lang,
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        position: "relative",
        background: C.bg,
        color: C.fg,
        fontFamily,
      },
    },
    ...gridLines(),
    // Inset dashed frame.
    h("div", {
      style: {
        position: "absolute",
        left: inset,
        top: inset,
        width: WIDTH - inset * 2,
        height: HEIGHT - inset * 2,
        border: `2px dashed ${C.frame}`,
        borderRadius: 4,
      },
    }),
    cornerTick(inset, inset),
    cornerTick(WIDTH - inset, inset),
    cornerTick(inset, HEIGHT - inset),
    cornerTick(WIDTH - inset, HEIGHT - inset),
    // Content.
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: inset,
          top: inset,
          width: WIDTH - inset * 2,
          height: HEIGHT - inset * 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
        },
      },
      // Brand mark.
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 16 } },
        h("img", { src: LOGO, width: 56, height: 56, style: { borderRadius: 12 } }),
        h(
          "div",
          { style: { fontSize: 28, fontWeight: 700, letterSpacing: -0.5 } },
          brand
        )
      ),
      // Title + description.
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 20 } },
        h(
          "div",
          {
            style: {
              fontSize: cjk ? 76 : 72,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: cjk ? 0 : -2.5,
            },
          },
          title
        ),
        h(
          "div",
          {
            style: {
              fontSize: 30,
              lineHeight: 1.4,
              color: C.mutedFg,
              maxWidth: 900,
            },
          },
          description
        )
      ),
      // Footer row: mono token + host.
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          },
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              padding: "6px 14px",
              borderRadius: 10,
              background: C.muted,
              color: C.accent,
              fontFamily: "JetBrains Mono",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: -1,
            },
          },
          "NAT"
        ),
        h(
          "div",
          { style: { fontSize: 22, color: C.mutedFg, letterSpacing: 0.5 } },
          SITE_HOST
        )
      )
    )
  )
}

async function render(node) {
  const svg = await satori(node, { width: WIDTH, height: HEIGHT, fonts: FONTS })
  return new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } })
    .render()
    .asPng()
}

const outDir = join(root, "public/og")
mkdirSync(outDir, { recursive: true })

for (const locale of LOCALES) {
  const messages = JSON.parse(
    readFileSync(join(root, `messages/${locale}.json`), "utf8")
  )
  for (const [suffix, titleKey, descKey] of PAGES) {
    const png = await render(
      card({
        title: messages[titleKey],
        description: messages[descKey],
        brand: messages.uiStrings_appTitle,
        lang: locale,
      })
    )
    const file = join(outDir, `${locale}${suffix}.png`)
    writeFileSync(file, png)
    if (locale === "en" && suffix === "") {
      writeFileSync(join(root, "public/og-image.png"), png)
    }
    console.log(`wrote ${file}`)
  }
}
