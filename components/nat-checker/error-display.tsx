"use client";

import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { DetectionError } from "@/lib/nat-detection/types";

interface ErrorDisplayProps {
  error: {
    type: DetectionError;
    message: string;
  };
  onRetry: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const tError = useTranslations("ErrorMessages");
  const tUI = useTranslations("UIStrings");

  const errorType = error.type || "UNKNOWN";
  const title = tError(`${errorType}.title`);
  const message = tError(`${errorType}.message`);
  const tips = tError.raw(`${errorType}.tips`) as string[];

  return (
    <div
      className="w-full max-w-2xl space-y-4"
      role="alert"
      aria-live="assertive"
    >
      <Alert variant="destructive">
        <AlertCircleIcon className="size-4" aria-hidden="true" />
        <AlertTitle className="text-sm sm:text-base">{title}</AlertTitle>
        <AlertDescription className="text-xs sm:text-sm">
          {message}
        </AlertDescription>
      </Alert>

      <section
        className="rounded-lg border bg-card p-3 sm:p-4 space-y-2 sm:space-y-3"
        aria-label={tUI("troubleshootingTips")}
      >
        <h3 className="font-medium text-xs sm:text-sm">
          {tUI("troubleshootingTips")}
        </h3>
        <ul className="list-inside list-disc text-xs sm:text-sm text-muted-foreground space-y-1 pl-1">
          {tips.map((tip) => (
            <li key={tip} className="leading-relaxed">
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <Button
        onClick={onRetry}
        variant="outline"
        className="w-full text-sm sm:text-base"
        aria-label={tUI("retestNATType")}
      >
        <RefreshCwIcon className="size-3 sm:size-4 mr-2" aria-hidden="true" />
        {tUI("retestNATType")}
      </Button>
    </div>
  );
}
