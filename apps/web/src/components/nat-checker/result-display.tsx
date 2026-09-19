import ArrowRight02Icon from "@hugeicons/core-free-icons/ArrowRight02Icon"
import CircleCheckIcon from "@hugeicons/core-free-icons/CircleCheckIcon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import GlobeIcon from "@hugeicons/core-free-icons/GlobeIcon"
import HelpCircleIcon from "@hugeicons/core-free-icons/HelpCircleIcon"
import RefreshCwIcon from "@hugeicons/core-free-icons/RefreshCwIcon"
import ServerIcon from "@hugeicons/core-free-icons/ServerIcon"
import TriangleAlertIcon from "@hugeicons/core-free-icons/TriangleAlertIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { NumberTicker } from "@/components/magicui/number-ticker"
import { lookupMessage } from "@/lib/i18n"
import { NAT_TYPE_META, TONE_SURFACE_CLASS } from "@/lib/nat-type-meta"
import type { DetectionResult } from "@workspace/nat-detection"
import { NATType } from "@workspace/nat-detection"
import { m } from "@/paraglide/messages.js"
import { NatImpactGrid } from "./nat-impact-grid"
import { NatTypeDetailsItems } from "./nat-type-details"

/**
 * Once-per-visit reveal: each block rises in 50 ms after the previous one.
 * `fill-mode-backwards` keeps a block hidden during its delay; the stagger is
 * decorative and never blocks interaction.
 */
const REVEAL_CLASS =
  "animate-in fade-in-0 slide-in-from-bottom-[6px] duration-250 ease-out-strong fill-mode-backwards motion-reduce:slide-in-from-bottom-0"

interface ResultDisplayProps {
  result: DetectionResult
  onRetest: () => void
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: typeof GlobeIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5 px-4 py-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <HugeiconsIcon icon={icon} className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="font-mono text-base font-semibold tracking-tight break-all tabular-nums sm:text-lg">
        {children}
      </dd>
    </div>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-mono break-all">{children}</dd>
    </div>
  )
}

export function ResultDisplay({ result, onRetest }: ResultDisplayProps) {
  if (!result.natType || !result.ipInfo) {
    return null
  }

  const { natType, ipInfo, portMapping } = result
  const isInconclusive = natType === NATType.UNKNOWN
  const meta = NAT_TYPE_META[natType]
  const duration = result.durationMs ? result.durationMs / 1000 : 0

  const natTypeName = lookupMessage(`natTypes_${natType}_name`) ?? natType
  const natTypeDefinition = lookupMessage(`natTypes_${natType}_definition`)
  const confidenceReasonMessage = result.confidenceReason
    ? lookupMessage(`uiStrings_confidenceReasons_${result.confidenceReason}`)
    : undefined

  const natPresenceText = {
    present: m.uiStrings_natPresent(),
    absent: m.uiStrings_natAbsent(),
    unknown: m.uiStrings_natUnknown(),
  }[ipInfo.natPresence]

  const yesNo = (value: boolean) =>
    value ? m.uiStrings_yes() : m.uiStrings_no()

  return (
    <section className="space-y-8" aria-label={m.uiStrings_detectionComplete()}>
      {/* Header group: status line + hero share one 16px rhythm */}
      <div className="space-y-4">
        {/* Status line */}
        <div
          className={cn(
            REVEAL_CLASS,
            "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <HugeiconsIcon
              icon={isInconclusive ? HelpCircleIcon : CircleCheckIcon}
              className={cn("size-4", !isInconclusive && "text-success")}
              aria-hidden="true"
            />
            {isInconclusive
              ? m.uiStrings_natTypeInconclusive()
              : m.uiStrings_natTypeIdentified()}
          </span>
          <time
            dateTime={result.startedAt.toISOString()}
            className="text-xs tabular-nums"
          >
            {result.startedAt.toLocaleString()}
          </time>
        </div>

        {/* Hero: the NAT type itself */}
        <div
          className={cn(
            REVEAL_CLASS,
            "flex items-start gap-4 delay-50 sm:gap-5"
          )}
        >
          <span
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-xl",
              TONE_SURFACE_CLASS[meta.tone]
            )}
            aria-hidden="true"
          >
            <HugeiconsIcon icon={meta.icon} className="size-7" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              {m.uiStrings_yourResult()}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {natTypeName}
              </h2>
              {result.confidence && (
                <Badge
                  variant={
                    result.confidence === "high" ? "secondary" : "outline"
                  }
                >
                  {result.confidence === "high"
                    ? m.uiStrings_confidenceHigh()
                    : m.uiStrings_confidenceLow()}
                </Badge>
              )}
            </div>
            {natTypeDefinition && (
              <p className="max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
                {natTypeDefinition}
              </p>
            )}
            {confidenceReasonMessage && (
              <p className="max-w-[65ch] text-xs text-muted-foreground">
                {confidenceReasonMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {ipInfo.isBehindCGNAT && (
        <Alert className={cn(REVEAL_CLASS, "delay-100")}>
          <HugeiconsIcon icon={TriangleAlertIcon} className="text-warning" />
          <AlertDescription>{m.uiStrings_cgnatDetected()}</AlertDescription>
        </Alert>
      )}

      {!isInconclusive && (
        <div className={cn(REVEAL_CLASS, "@container space-y-3 delay-100")}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase">
            {m.uiStrings_applicationImpact()}
          </h3>
          <NatImpactGrid natType={natType} />
        </div>
      )}

      {/* Network stats */}
      <dl
        className={cn(
          REVEAL_CLASS,
          "grid divide-y overflow-hidden rounded-lg border bg-muted/40 delay-150 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        )}
      >
        <Stat icon={GlobeIcon} label={m.uiStrings_publicIPAddress()}>
          {ipInfo.publicIP ?? "N/A"}
        </Stat>
        <Stat icon={Clock01Icon} label={m.uiStrings_detectionTime()}>
          <NumberTicker value={duration} decimalPlaces={2} />s
        </Stat>
        {portMapping && (
          <Stat icon={ServerIcon} label={m.uiStrings_reachableServers()}>
            <span title={portMapping.reachableServers.join(", ")}>
              {portMapping.reachableServers.length}
            </span>
          </Stat>
        )}
      </dl>

      <Accordion className={cn(REVEAL_CLASS, "border-t delay-200")}>
        {!isInconclusive && <NatTypeDetailsItems natType={natType} />}
        {portMapping && (
          <AccordionItem value="advanced">
            <AccordionTrigger>{m.uiStrings_advancedDetails()}</AccordionTrigger>
            <AccordionContent>
              <dl className="space-y-2 text-xs sm:text-sm">
                <DetailRow label={m.uiStrings_natPresenceLabel()}>
                  {natPresenceText}
                </DetailRow>
                <DetailRow label={m.uiStrings_localAddress()}>
                  {ipInfo.localAddress ?? "N/A"}
                  {ipInfo.localPort ? `:${ipInfo.localPort}` : ""}
                </DetailRow>
                <DetailRow label={m.uiStrings_publicPort()}>
                  {ipInfo.publicPort ?? "N/A"}
                </DetailRow>
                <DetailRow label={m.uiStrings_portConsistency()}>
                  {yesNo(portMapping.isPortConsistent)}
                </DetailRow>
                <DetailRow label={m.uiStrings_ipConsistency()}>
                  {yesNo(portMapping.isIPConsistent)}
                </DetailRow>
                <div className="space-y-1">
                  <dt className="text-muted-foreground">
                    {m.uiStrings_observedMappings()}
                  </dt>
                  <dd>
                    <ul className="space-y-0.5 font-mono">
                      {portMapping.observedMappings.map((mapping) => (
                        <li
                          key={`${mapping.ip}:${mapping.port}`}
                          className="break-all"
                        >
                          {mapping.ip}:{mapping.port}
                          {mapping.server
                            ? ` (${mapping.server.replace("stun:", "")})`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground">
                    {m.uiStrings_reachableServers()}
                  </dt>
                  <dd>
                    <ul className="space-y-0.5 font-mono">
                      {portMapping.reachableServers.map((server) => (
                        <li key={server} className="break-all">
                          {server.replace("stun:", "")}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      <div
        className={cn(
          REVEAL_CLASS,
          "flex flex-col-reverse gap-3 delay-250 sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        <Link
          to="/nat-types"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "text-muted-foreground"
          )}
        >
          {m.uiStrings_viewAllNATTypes()}
          <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
        </Link>
        <Button onClick={onRetest} variant="outline">
          <HugeiconsIcon
            icon={RefreshCwIcon}
            aria-hidden="true"
            data-icon="inline-start"
          />
          {m.uiStrings_retestNATType()}
        </Button>
      </div>
    </section>
  )
}
