"use client";

import { useTranslations } from "next-intl";
import { Spinner } from "@/components/ui/spinner";

export function LoadingIndicator() {
  const t = useTranslations("UIStrings");

  return (
    <output
      aria-live="polite"
      aria-label={t("detectingNATType")}
      className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm w-full max-w-2xl px-6"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg leading-none font-semibold">
          <Spinner className="size-4 sm:size-5" aria-hidden="true" />
          <span>{t("detectingNATType")}</span>
        </div>
        <div className="text-muted-foreground text-xs sm:text-sm">
          {t("analyzingNetwork")}
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <div
            className="size-2 rounded-full bg-primary animate-pulse"
            aria-hidden="true"
          />
          <span>{t("gatheringICECandidates")}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {t("detectionTimeInfo")}
        </div>
      </div>
    </output>
  );
}
