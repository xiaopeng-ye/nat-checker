"use client";

import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  GlobeIcon,
  ServerIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { type DetectionResult, NATType } from "@/lib/nat-detection/types";
import { EducationalContent } from "./educational-content";

interface ResultDisplayProps {
  result: DetectionResult;
}

export function ResultDisplay({ result }: ResultDisplayProps) {
  const t = useTranslations("UIStrings");

  // Get NAT type translations - use hooks at top level
  const natTypeKey = result.natType?.toUpperCase() || "";
  const tNatType = useTranslations(`NATTypes.${natTypeKey}` as const);

  if (!result.natType || !result.ipInfo) {
    return null;
  }

  const getNATTypeInfo = (natType: NATType) => {
    const localizedLabel = tNatType("name");
    const localizedDescription = tNatType("definition");

    switch (natType) {
      case NATType.CONE_NAT:
        return {
          label: localizedLabel,
          variant: "default" as const,
          description: localizedDescription,
          color: "text-green-600 dark:text-green-400",
        };
      case NATType.FULL_CONE:
        return {
          label: localizedLabel,
          variant: "default" as const,
          description: localizedDescription,
          color: "text-green-600 dark:text-green-400",
        };
      case NATType.RESTRICTED_CONE:
        return {
          label: localizedLabel,
          variant: "secondary" as const,
          description: localizedDescription,
          color: "text-blue-600 dark:text-blue-400",
        };
      case NATType.PORT_RESTRICTED_CONE:
        return {
          label: localizedLabel,
          variant: "secondary" as const,
          description: localizedDescription,
          color: "text-yellow-600 dark:text-yellow-400",
        };
      case NATType.SYMMETRIC:
        return {
          label: localizedLabel,
          variant: "destructive" as const,
          description: localizedDescription,
          color: "text-red-600 dark:text-red-400",
        };
      case NATType.NO_NAT:
        return {
          label: localizedLabel,
          variant: "default" as const,
          description: localizedDescription,
          color: "text-emerald-600 dark:text-emerald-400",
        };
      case NATType.MULTIPLE_LAYERS:
        return {
          label: localizedLabel,
          variant: "destructive" as const,
          description: localizedDescription,
          color: "text-orange-600 dark:text-orange-400",
        };
    }
  };

  const natTypeInfo = getNATTypeInfo(result.natType);
  const duration = result.durationMs
    ? (result.durationMs / 1000).toFixed(2)
    : "N/A";

  return (
    <div className="w-full max-w-2xl cursor-default">
      <section className="p-6" aria-label={t("detectionComplete")}>
        <CardHeader className="p-0 mb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CheckCircle2Icon
                  className="size-4 sm:size-5 text-green-600"
                  aria-hidden="true"
                />
                {t("detectionComplete")}
              </CardTitle>
              <CardDescription className="text-sm">
                {t("natTypeIdentified")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 p-0">
          {/* NAT Type Badge */}
          <fieldset
            className="space-y-2 border-0 p-0"
            aria-label={t("natTypeLabel")}
          >
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t("natTypeLabel")}
            </h3>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Badge
                variant={natTypeInfo.variant}
                className="text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-1.5"
                aria-label={`NAT Type: ${natTypeInfo.label}`}
              >
                {natTypeInfo.label}
              </Badge>
            </div>
            <p
              className={`text-xs sm:text-sm font-medium ${natTypeInfo.color}`}
            >
              {natTypeInfo.description}
            </p>
          </fieldset>

          <Separator />

          {/* Educational Content */}
          <EducationalContent natType={result.natType} />

          <Separator />

          {/* Network Information */}
          <fieldset
            className="space-y-2 border-0 p-0"
            aria-label={t("publicIPAddress")}
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
              <GlobeIcon className="size-3 sm:size-4" aria-hidden="true" />
              {t("publicIPAddress")}
            </div>
            <div className="font-mono text-sm sm:text-base bg-muted/50 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-center break-all">
              {result.ipInfo.publicIP || "N/A"}
            </div>
            {result.ipInfo.isBehindCGNAT && (
              <p
                className="text-xs text-yellow-600 dark:text-yellow-400 text-center"
                role="alert"
              >
                <span aria-hidden="true">⚠️</span> {t("cgnatDetected")}
              </p>
            )}
          </fieldset>

          <Separator />

          {/* Detection Metadata */}
          <fieldset
            className="grid gap-2 sm:gap-3 text-xs sm:text-sm border-0 p-0"
            aria-label={t("detectionTime")}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ClockIcon className="size-3 sm:size-4" aria-hidden="true" />
                <span>{t("detectionTime")}</span>
              </div>
              <span className="font-medium">
                <NumberTicker value={parseFloat(duration)} decimalPlaces={2} />s
              </span>
            </div>

            {result.successfulSTUNServer && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <ServerIcon
                    className="size-3 sm:size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">
                    {t("stunServerUsed")}
                  </span>
                  <span className="sm:hidden">{t("stunServer")}</span>
                </div>
                <span
                  className="font-mono text-xs truncate max-w-[120px] sm:max-w-[200px]"
                  title={result.successfulSTUNServer}
                >
                  {result.successfulSTUNServer.replace("stun:", "")}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2Icon
                  className="size-3 sm:size-4"
                  aria-hidden="true"
                />
                <span>{t("lastTested")}</span>
              </div>
              <time
                className="text-xs"
                dateTime={result.startedAt.toISOString()}
              >
                {result.startedAt.toLocaleString()}
              </time>
            </div>
          </fieldset>

          {/* Port Mapping Info (Advanced) */}
          {result.portMapping && (
            <>
              <Separator />
              <details
                className="text-xs sm:text-sm"
                aria-label={t("advancedDetails")}
              >
                <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground p-2 rounded hover:bg-muted/50 transition-colors">
                  {t("advancedDetails")}
                </summary>
                <div className="mt-3 space-y-2 text-xs sm:text-sm text-muted-foreground px-2">
                  <div className="flex justify-between gap-2">
                    <strong>Port Consistency:</strong>{" "}
                    <span>
                      {result.portMapping.isPortConsistent ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <strong>IP Consistency:</strong>{" "}
                    <span>
                      {result.portMapping.isIPConsistent ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <strong>Observed Mappings:</strong>{" "}
                    <span>{result.portMapping.observedMappings.length}</span>
                  </div>
                </div>
              </details>
            </>
          )}

          {/* Other NAT Types Guide */}
          <div className="flex justify-center pt-2">
            <Button variant="link" asChild className="text-muted-foreground">
              <Link href="/nat-types">
                {t("viewAllNATTypes")}{" "}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </section>
    </div>
  );
}
