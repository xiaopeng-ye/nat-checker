// Site URL used for canonical URLs, hreflang alternates, JSON-LD and the
// sitemap host. Set VITE_SITE_URL in the build environment (see .env.example).
export const SITE_URL =
  import.meta.env.VITE_SITE_URL || "https://nat-checker.kkcloud.org"

// 确保URL格式正确
export function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

export const BASE_URL = normalizeUrl(SITE_URL)

// 生成完整URL的工具函数
export function createUrl(path: string = ""): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${BASE_URL}${cleanPath}`
}
