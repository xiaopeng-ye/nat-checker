import { Link } from "@tanstack/react-router"
import { cn } from "@workspace/ui/lib/utils"
import { useEffect, useState } from "react"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@workspace/ui/components/navigation-menu"
import { GithubButton } from "@/components/github-button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { AnimatedThemeToggler } from "@/components/theme-switch"
import { m } from "@/paraglide/messages.js"

const NAV_ITEMS = [
  { to: "/", label: () => m.nav_home(), exact: true },
  { to: "/nat-types", label: () => m.nav_natTypes(), exact: false },
] as const

/** True once the page has been scrolled past the top edge. */
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [threshold])
  return scrolled
}

/**
 * Floating pill header shared by every page: brand, primary navigation and
 * the locale / GitHub / theme controls. It gains a solid background and a
 * shadow once the page is scrolled.
 */
export function SiteHeader() {
  const scrolled = useScrolled()

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:pt-4">
      <div
        className={cn(
          "container mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 rounded-full border px-3 backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300 sm:px-4",
          scrolled
            ? "border-border bg-background/85 shadow-lg shadow-foreground/5"
            : "border-border/60 bg-background/60"
        )}
      >
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
            aria-label={m.uiStrings_appTitle()}
          >
            <img
              src="/logo.png"
              alt=""
              width={24}
              height={24}
              className="size-6 rounded-md"
            />
            <span className="hidden sm:inline">{m.uiStrings_appTitle()}</span>
          </Link>

          <NavigationMenu aria-label="Primary">
            <NavigationMenuList className="gap-1">
              {NAV_ITEMS.map((item) => (
                <NavigationMenuItem key={item.to}>
                  {/* Router Link drives href + active state; data-active is read by the shadcn styles. */}
                  <NavigationMenuLink
                    render={
                      <Link
                        to={item.to}
                        activeOptions={{ exact: item.exact }}
                        activeProps={{ "data-active": true }}
                      />
                    }
                    className="rounded-full px-3 text-muted-foreground data-[active=true]:text-foreground"
                  >
                    {item.label()}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <GithubButton />
          <AnimatedThemeToggler />
        </div>
      </div>
    </header>
  )
}
