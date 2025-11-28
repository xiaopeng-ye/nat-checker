import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // List of all supported locales
  locales: ["en", "zh", "de", "es", "fr"],

  // Default locale (used when no locale matches)
  defaultLocale: "en",

  // Show locale prefix for all locales (e.g. /en, /zh)
  localePrefix: "always",
});
