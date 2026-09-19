import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { deLocalizeUrl, localizeUrl } from "./paraglide/runtime.js"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,

    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    // Paraglide URL-based i18n routing: the router works on canonical
    // unprefixed paths internally while the browser sees /en, /zh, ... paths.
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url),
    },
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
