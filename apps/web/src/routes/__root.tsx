import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { buttonVariants } from "@workspace/ui/components/button"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import appCss from "@workspace/ui/globals.css?url"
import { m } from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "theme-color",
        content: "#edc996",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "NAT Checker",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "any",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
        sizes: "180x180",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
    ],
  }),
  notFoundComponent: NotFound,
  component: RootLayout,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <div className="container mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold tracking-tight">
        {m.uiStrings_notFoundTitle()}
      </h1>
      <p className="max-w-md text-muted-foreground">
        {m.uiStrings_notFoundDescription()}
      </p>
      <Link to="/" className={buttonVariants({ variant: "outline" })}>
        {m.uiStrings_backHome()}
      </Link>
    </div>
  )
}

function RootLayout() {
  return (
    <TooltipProvider>
      <div className="flex min-h-svh flex-col">
        <SiteHeader />
        <main className="relative isolate flex-1">
          {/* Positioned containing block for each route's <PageBackground />,
              which renders first inside the route so it paints behind the
              page content without any z-index. */}
          <div className="relative">
            <Outlet />
          </div>
        </main>
        <SiteFooter />
      </div>
    </TooltipProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: next-themes sets the theme class on <html>
    // before hydration.
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="overscroll-none bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
