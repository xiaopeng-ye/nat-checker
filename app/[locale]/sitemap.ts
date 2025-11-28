import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/site-config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  return [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: `${BASE_URL}/en`,
          zh: `${BASE_URL}/zh`,
          de: `${BASE_URL}/de`,
          es: `${BASE_URL}/es`,
          fr: `${BASE_URL}/fr`,
        },
      },
    },
    // We could add additional pages here if the app expands
    // For example: educational content, about page, etc.
  ];
}
