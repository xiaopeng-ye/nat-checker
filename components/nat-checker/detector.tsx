"use client";

import { PlayIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Button } from "@/components/ui/button";
import {
  type DetectionResult,
  DetectionState,
} from "@/lib/nat-detection/types";
import { ErrorDisplay } from "./error-display";
import { LoadingIndicator } from "./loading-indicator";
import { ResultDisplay } from "./result-display";

export interface NATDetectorProps {
  result: DetectionResult;
  onRunDetection: () => void;
}

export function NATDetector({ result, onRunDetection }: NATDetectorProps) {
  const t = useTranslations("UIStrings");

  return (
    <main className="space-y-4 sm:space-y-6" aria-label={t("appTitle")}>
      {/* Initial state (shouldn't show for long due to auto-start) */}
      {result.state === DetectionState.IDLE && (
        <div className="flex flex-col items-center gap-3 sm:gap-4 py-8">
          <p className="text-sm sm:text-base text-muted-foreground text-center">
            {t("readyToDetect")}
          </p>
          <ShimmerButton
            onClick={onRunDetection}
            className="gap-2 text-sm sm:text-base shadow-2xl"
            aria-label={t("startDetection")}
          >
            <PlayIcon className="size-3 sm:size-4" aria-hidden="true" />
            <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
              {t("startDetection")}
            </span>
          </ShimmerButton>
        </div>
      )}

      {/* Loading state */}
      {result.state === DetectionState.DETECTING && <LoadingIndicator />}

      {/* Success state */}
      {result.state === DetectionState.SUCCESS && (
        <>
          <ResultDisplay result={result} />
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button
              onClick={onRunDetection}
              variant="outline"
              size="lg"
              className="gap-2 text-sm sm:text-base"
              aria-label={t("retestNATType")}
            >
              <PlayIcon className="size-3 sm:size-4" aria-hidden="true" />
              {t("retestNATType")}
            </Button>
          </div>
        </>
      )}

      {/* Error state */}
      {result.state === DetectionState.ERROR && result.error && (
        <ErrorDisplay error={result.error} onRetry={onRunDetection} />
      )}
    </main>
  );
}
