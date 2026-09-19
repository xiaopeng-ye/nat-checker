import { paraglideVitePlugin } from "@inlang/paraglide-js"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import tailwindcss from "@tailwindcss/vite"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { defineConfig, loadEnv } from "vite"
import type { Plugin } from "vite"
import viteReact from "@vitejs/plugin-react"

const LOCALES = ["en", "zh", "de", "es", "fr"] as const

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const siteUrl = normalizeUrl(
    env.VITE_SITE_URL ||
      process.env.VITE_SITE_URL ||
      "https://nat-checker.kkcloud.org"
  )

  const localizedPath = (locale: string, path = ""): string => {
    const clean = path.replace(/^\/+/, "")
    return `/${locale}${clean ? `/${clean}` : ""}`
  }

  const alternateRefsFor = (path = "") =>
    LOCALES.map((locale) => ({
      href: `${siteUrl}${localizedPath(locale, path)}`,
      hreflang: locale,
    }))

  const pages = [
    ...LOCALES.map((locale) => ({
      path: localizedPath(locale),
      sitemap: {
        changefreq: "weekly" as const,
        priority: 1,
        lastmod: new Date(),
        alternateRefs: alternateRefsFor(),
      },
    })),
    ...LOCALES.map((locale) => ({
      path: localizedPath(locale, "nat-types"),
      sitemap: {
        changefreq: "weekly" as const,
        priority: 1,
        lastmod: new Date(),
        alternateRefs: alternateRefsFor("nat-types"),
      },
    })),
  ]

  // Writes dist/client/robots.txt with the env-specific sitemap URL.
  const robotsTxtPlugin = (): Plugin => ({
    name: "nat-checker:robots-txt",
    closeBundle() {
      const clientDir = join(import.meta.dirname, "dist/client")
      if (!existsSync(clientDir)) return
      mkdirSync(clientDir, { recursive: true })
      writeFileSync(
        join(clientDir, "robots.txt"),
        [
          "User-agent: *",
          "Allow: /",
          "Disallow: /api/",
          "",
          "User-agent: Googlebot",
          "Allow: /",
          "Crawl-delay: 1",
          "",
          "User-agent: Bingbot",
          "Allow: /",
          "Crawl-delay: 2",
          "",
          "User-agent: Slurp",
          "Allow: /",
          "Crawl-delay: 2",
          "",
          `Sitemap: ${siteUrl}/sitemap.xml`,
          "",
        ].join("\n")
      )
    },
  })

  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      devtools(),
      tailwindcss(),
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./src/paraglide",
        outputStructure: "message-modules",
        cookieName: "PARAGLIDE_LOCALE",
        strategy: ["url", "cookie", "preferredLanguage", "baseLocale"],
        // Every locale is URL-prefixed (/en, /zh, ...); the unprefixed "/" is
        // a static browser-language redirector, not a route.
        urlPatterns: [
          {
            pattern: "/",
            localized: LOCALES.map(
              (locale) => [locale, `/${locale}`] as [string, string]
            ),
          },
          {
            pattern: "/:path(.*)?",
            localized: LOCALES.map(
              (locale) => [locale, `/${locale}/:path(.*)?`] as [string, string]
            ),
          },
        ],
      }),
      tanstackStart({
        // Fully static output for Cloudflare Pages: every localized page is
        // prerendered into dist/client. The unprefixed "/" is intentionally
        // not prerendered — public/index.html handles browser-language
        // redirection instead.
        prerender: {
          enabled: true,
          autoStaticPathsDiscovery: false,
          crawlLinks: false,
        },
        pages,
        sitemap: {
          enabled: true,
          host: siteUrl,
          outputPath: "sitemap.xml",
        },
      }),
      viteReact(),
      robotsTxtPlugin(),
    ],
  }
})
