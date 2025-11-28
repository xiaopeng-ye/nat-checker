"use client";

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  GamepadIcon,
  ServerIcon,
  ShareIcon,
  VideoIcon,
  XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import type { NATType } from "@/lib/nat-detection/types";

type ImpactRating = "good" | "fair" | "poor";

interface ImpactSummaryProps {
  natType: NATType;
}

function ImpactSummary({ natType }: ImpactSummaryProps) {
  const t = useTranslations("UIStrings");
  const natTypeKey = natType.toUpperCase();
  const tNatType = useTranslations(`NATTypes.${natTypeKey}` as const);

  // Get impact ratings from translations
  const impact = {
    gaming: tNatType("impactSummary.gaming") as ImpactRating,
    p2p: tNatType("impactSummary.p2p") as ImpactRating,
    videoCalls: tNatType("impactSummary.videoCalls") as ImpactRating,
    remoteAccess: tNatType("impactSummary.remoteAccess") as ImpactRating,
  };

  const getImpactIcon = (rating: ImpactRating) => {
    switch (rating) {
      case "good":
        return (
          <CheckCircle2Icon className="size-4 text-green-600 dark:text-green-400" />
        );
      case "fair":
        return (
          <AlertTriangleIcon className="size-4 text-yellow-600 dark:text-yellow-400" />
        );
      case "poor":
        return (
          <XCircleIcon className="size-4 text-red-600 dark:text-red-400" />
        );
    }
  };

  const getImpactLabel = (rating: ImpactRating) => {
    switch (rating) {
      case "good":
        return {
          text: t("impactExcellent"),
          color: "text-green-600 dark:text-green-400",
        };
      case "fair":
        return {
          text: t("impactModerate"),
          color: "text-yellow-600 dark:text-yellow-400",
        };
      case "poor":
        return {
          text: t("impactLimited"),
          color: "text-red-600 dark:text-red-400",
        };
    }
  };

  const items = [
    {
      key: "gaming",
      icon: GamepadIcon,
      label: t("gaming"),
      rating: impact.gaming,
    },
    {
      key: "p2p",
      icon: ShareIcon,
      label: t("p2pFileSharing"),
      rating: impact.p2p,
    },
    {
      key: "videoCalls",
      icon: VideoIcon,
      label: t("videoCalls"),
      rating: impact.videoCalls,
    },
    {
      key: "remoteAccess",
      icon: ServerIcon,
      label: t("remoteAccess"),
      rating: impact.remoteAccess,
    },
  ];

  return (
    <ul className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 list-none">
      {items.map((item) => {
        const Icon = item.icon;
        const impactLabel = getImpactLabel(item.rating);

        return (
          <li
            key={item.key}
            className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Icon
                className="size-3 sm:size-4 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <span className="text-xs sm:text-sm font-medium truncate">
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {getImpactIcon(item.rating)}
              <span
                className={`text-xs font-medium ${impactLabel.color} hidden sm:inline`}
              >
                {impactLabel.text}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

interface EducationalContentProps {
  natType: NATType;
}

export function EducationalContent({ natType }: EducationalContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations("UIStrings");
  const natTypeKey = natType.toUpperCase();
  const tNat = useTranslations(`NATTypes.${natTypeKey}` as const);

  // Assuming 3 example scenarios and 3 troubleshooting tips per NAT type
  const exampleScenarios = [0, 1, 2];
  const troubleshootingTips = [0, 1, 2];

  return (
    <section
      className="space-y-3 sm:space-y-4"
      aria-label={t("applicationImpact")}
    >
      {/* Tier 1: Always visible */}
      <div className="space-y-2 sm:space-y-3">
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {tNat("definition")}
        </p>

        <div>
          <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
            {t("applicationImpact")}
          </h4>
          <ImpactSummary natType={natType} />
        </div>
      </div>

      <Separator />

      {/* Tier 2: Expandable "Learn More" */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between hover:bg-muted/50 text-xs sm:text-sm p-2 sm:p-3"
            aria-expanded={isExpanded}
            aria-label={
              isExpanded ? t("hideAdditionalInfo") : t("showAdditionalInfo")
            }
          >
            <span className="font-medium">{t("learnMore")}</span>
            <ChevronDownIcon
              className={`size-3 sm:size-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
          {/* Technical Details */}
          <div className="space-y-1.5 sm:space-y-2">
            <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
              <span
                className="size-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              {t("technicalDetails")}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-2.5 sm:pl-3.5">
              {tNat("technicalDetails")}
            </p>
          </div>

          {/* Example Scenarios */}
          <div className="space-y-1.5 sm:space-y-2">
            <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
              <span
                className="size-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              {t("realWorldExamples")}
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 pl-2.5 sm:pl-3.5">
              {exampleScenarios.map((index) => (
                <li
                  key={index}
                  className="text-xs sm:text-sm text-muted-foreground leading-relaxed"
                >
                  • {tNat(`exampleScenarios.${index}` as const)}
                </li>
              ))}
            </ul>
          </div>

          {/* Troubleshooting Tips */}
          <div className="space-y-1.5 sm:space-y-2">
            <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
              <span
                className="size-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              {t("troubleshootingTips")}
            </h4>
            <ol className="space-y-1.5 sm:space-y-2 pl-2.5 sm:pl-3.5 list-decimal list-inside">
              {troubleshootingTips.map((index) => (
                <li
                  key={index}
                  className="text-xs sm:text-sm text-muted-foreground leading-relaxed"
                >
                  {tNat(`troubleshootingTips.${index}` as const)}
                </li>
              ))}
            </ol>
          </div>

          {/* Comparison */}
          <div className="space-y-1.5 sm:space-y-2">
            <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
              <span
                className="size-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              {t("comparison")}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-2.5 sm:pl-3.5">
              {tNat("comparison")}
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
