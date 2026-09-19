import CancelCircleIcon from "@hugeicons/core-free-icons/CancelCircleIcon"
import CircleCheckIcon from "@hugeicons/core-free-icons/CircleCheckIcon"
import GamepadIcon from "@hugeicons/core-free-icons/GamepadIcon"
import ServerIcon from "@hugeicons/core-free-icons/ServerIcon"
import Share08Icon from "@hugeicons/core-free-icons/Share08Icon"
import TriangleAlertIcon from "@hugeicons/core-free-icons/TriangleAlertIcon"
import VideoIcon from "@hugeicons/core-free-icons/Video01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import { cn } from "@workspace/ui/lib/utils"
import type { ImpactRating } from "@/lib/nat-impact"
import { NAT_TYPE_IMPACT } from "@/lib/nat-impact"
import type { NATType } from "@workspace/nat-detection"
import { m } from "@/paraglide/messages.js"

export const IMPACT_RATING_STYLE: Record<
  ImpactRating,
  { icon: IconSvgElement; className: string; label: () => string }
> = {
  good: {
    icon: CircleCheckIcon,
    className: "text-success",
    label: () => m.uiStrings_impactExcellent(),
  },
  fair: {
    icon: TriangleAlertIcon,
    className: "text-warning",
    label: () => m.uiStrings_impactModerate(),
  },
  poor: {
    icon: CancelCircleIcon,
    className: "text-destructive",
    label: () => m.uiStrings_impactLimited(),
  },
}

export const IMPACT_APPLICATIONS = [
  { key: "gaming", icon: GamepadIcon, label: () => m.uiStrings_gaming() },
  { key: "p2p", icon: Share08Icon, label: () => m.uiStrings_p2pFileSharing() },
  { key: "videoCalls", icon: VideoIcon, label: () => m.uiStrings_videoCalls() },
  {
    key: "remoteAccess",
    icon: ServerIcon,
    label: () => m.uiStrings_remoteAccess(),
  },
] as const

export function ImpactRatingLabel({
  rating,
  showText = true,
}: {
  rating: ImpactRating
  showText?: boolean
}) {
  const style = IMPACT_RATING_STYLE[rating]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        style.className
      )}
    >
      <HugeiconsIcon icon={style.icon} className="size-4" aria-hidden="true" />
      <span className={cn(!showText && "sr-only")}>{style.label()}</span>
    </span>
  )
}

/**
 * Four-application impact summary (gaming, P2P, video calls, remote access)
 * for a NAT type. Renders nothing for types without impact data (UNKNOWN).
 *
 * `tiles` (default) renders bordered tiles for the detection result card.
 * `compact` renders borderless rows for nested contexts such as the NAT type
 * cards, where an extra box level would only add lines.
 */
export function NatImpactGrid({
  natType,
  variant = "tiles",
  className,
}: {
  natType: NATType
  variant?: "tiles" | "compact"
  className?: string
}) {
  const impact = NAT_TYPE_IMPACT[natType]
  if (!impact) return null

  if (variant === "compact") {
    return (
      <ul className={cn("divide-y", className)}>
        {IMPACT_APPLICATIONS.map((app) => (
          <li
            key={app.key}
            className="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <HugeiconsIcon
                icon={app.icon}
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="truncate">{app.label()}</span>
            </span>
            <ImpactRatingLabel rating={impact[app.key]} />
          </li>
        ))}
      </ul>
    )
  }

  // Container query: two columns only when the parent is wide enough for the
  // application labels not to truncate.
  return (
    <ul
      className={cn("grid grid-cols-1 gap-3 @[30rem]:grid-cols-2", className)}
    >
      {IMPACT_APPLICATIONS.map((app) => (
        <li
          key={app.key}
          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
        >
          <span className="flex min-w-0 items-center gap-2.5 text-sm">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <HugeiconsIcon icon={app.icon} className="size-4" />
            </span>
            <span className="truncate font-medium">{app.label()}</span>
          </span>
          <ImpactRatingLabel rating={impact[app.key]} />
        </li>
      ))}
    </ul>
  )
}
