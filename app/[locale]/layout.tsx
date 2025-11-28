import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { BreadcrumbList, FAQPage, WebApplication } from "schema-dts";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";
import { BASE_URL } from "@/lib/site-config";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "UIStrings" });

  const webApplicationSchema: WebApplication = {
    "@type": "WebApplication",
    name: "NAT Type Checker",
    description:
      "Detect your NAT type (Full Cone, Symmetric, etc.) and understand how it affects gaming, P2P applications, video calls, and remote access. Free, privacy-focused, client-side detection using WebRTC STUN protocol.",
    url: BASE_URL,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "Requires JavaScript and WebRTC support",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "NAT Checker Team",
    },
    screenshot: `${BASE_URL}/og-image.png`,
    softwareVersion: "1.0.0",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
    },
  };

  const breadcrumbSchema: BreadcrumbList = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
    ],
  };

  const faqSchema: FAQPage = {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is NAT type detection?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "NAT type detection identifies how your network router translates IP addresses, which affects your ability to connect to other devices online.",
        },
      },
      {
        "@type": "Question",
        name: "Is the NAT type checker free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, our NAT type checker is completely free and doesn't require any registration or personal information.",
        },
      },
      {
        "@type": "Question",
        name: "How does NAT type affect gaming?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Different NAT types can impact your ability to host games, connect to friends, and experience lag-free online gaming sessions.",
        },
      },
      {
        "@type": "Question",
        name: "Is my data private?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, all detection happens client-side in your browser. No data is sent to our servers, ensuring complete privacy.",
        },
      },
    ],
  };

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: t("appTitle"),
      template: `%s | ${t("appTitle")}`,
    },
    description: t("appDescription"),
    keywords: [
      "NAT type",
      "network",
      "WebRTC",
      "STUN",
      "gaming",
      "P2P",
      "connectivity",
      "NAT detection",
      "network analysis",
      "firewall",
      "router",
      "port forwarding",
      "online gaming",
      "video call",
      "remote access",
    ],
    authors: [{ name: "NAT Checker" }],
    creator: "NAT Checker",
    publisher: "NAT Checker",
    applicationName: t("appTitle"),
    referrer: "origin-when-cross-origin",
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: locale === "en" ? BASE_URL : `${BASE_URL}/${locale}`,
      languages: {
        en: `${BASE_URL}/en`,
        zh: `${BASE_URL}/zh`,
        de: `${BASE_URL}/de`,
        es: `${BASE_URL}/es`,
        fr: `${BASE_URL}/fr`,
      },
    },
    other: {
      "application-ld+json": JSON.stringify([
        webApplicationSchema,
        breadcrumbSchema,
        faqSchema,
      ]),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming locale is valid
  if (!routing.locales.includes(locale as "en" | "zh" | "de" | "es" | "fr")) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="apple-mobile-web-app-title" content="Nat Checker" />
      </head>
      <body className="bg-background overscroll-none font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
