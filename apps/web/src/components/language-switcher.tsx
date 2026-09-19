import GlobeIcon from "@hugeicons/core-free-icons/GlobeIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { deLocalizeHref, getLocale, localizeHref } from "@/paraglide/runtime.js"
import type { Locale } from "@/paraglide/runtime.js"

const languageNames: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
}

const LOCALES = [
  "en",
  "zh",
  "de",
  "es",
  "fr",
] as const satisfies readonly Locale[]

/**
 * Switching the locale changes the document language, so a full document
 * navigation is performed to the localized URL (recommended for locale
 * changes — see https://paraglidejs.com/i18n-routing#redirects).
 */
export function LanguageSwitcher() {
  const locale = getLocale()

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) return
    // Use the href helpers: unlike localizeUrl/deLocalizeUrl they accept a
    // relative path such as "/en/nat-types" (deLocalizeUrl would throw
    // "Invalid URL" on it).
    const { pathname, search, hash } = window.location
    const target = localizeHref(deLocalizeHref(pathname + search + hash), {
      locale: newLocale,
    })
    window.location.assign(target)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            aria-label="Change language"
          >
            <HugeiconsIcon icon={GlobeIcon} />
            <span className="hidden sm:inline">{languageNames[locale]}</span>
            <span className="sm:hidden">{locale.toUpperCase()}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => handleLanguageChange(value as Locale)}
        >
          {LOCALES.map((loc) => (
            <DropdownMenuRadioItem key={loc} value={loc} lang={loc}>
              {languageNames[loc]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
