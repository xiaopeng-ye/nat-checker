import GithubIcon from "@hugeicons/core-free-icons/GithubIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { Separator } from "@workspace/ui/components/separator"
import { LanguageSwitcher } from "@/components/language-switcher"
import { AnimatedThemeToggler } from "@/components/theme-switch"
import { m } from "@/paraglide/messages.js"

const GITHUB_URL = "https://github.com/xiaopeng-ye/nat-checker"

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground"

/**
 * Three-column footer: brand + privacy note, page links, and the locale /
 * theme controls. A bottom strip carries the detection disclaimer and the
 * copyright line.
 */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-[2fr_1fr_1fr]">
          <div className="space-y-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-semibold tracking-tight"
            >
              <img
                src="/logo.png"
                alt=""
                width={24}
                height={24}
                className="size-6 rounded-md"
              />
              {m.uiStrings_appTitle()}
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {m.uiStrings_privacyNote()}
            </p>
          </div>

          <nav aria-label={m.footer_navigation()} className="space-y-3">
            <h2 className="text-sm font-medium">{m.footer_navigation()}</h2>
            <ul className="space-y-2">
              <li>
                <Link to="/" className={linkClass}>
                  {m.nav_home()}
                </Link>
              </li>
              <li>
                <Link to="/nat-types" className={linkClass}>
                  {m.nav_natTypes()}
                </Link>
              </li>
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 ${linkClass}`}
                >
                  <HugeiconsIcon
                    icon={GithubIcon}
                    className="size-4"
                    aria-hidden="true"
                  />
                  {m.footer_sourceCode()}
                </a>
              </li>
            </ul>
          </nav>

          <div className="space-y-3">
            <h2 className="text-sm font-medium">{m.footer_settings()}</h2>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <AnimatedThemeToggler />
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-3 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl">{m.uiStrings_footerInfo()}</p>
          <p className="shrink-0">
            © {new Date().getFullYear()} {m.uiStrings_appTitle()}
          </p>
        </div>
      </div>
    </footer>
  )
}
