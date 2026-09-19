import FlashIcon from "@hugeicons/core-free-icons/FlashIcon"
import GlobeIcon from "@hugeicons/core-free-icons/GlobeIcon"
import HelpCircleIcon from "@hugeicons/core-free-icons/HelpCircleIcon"
import LayersIcon from "@hugeicons/core-free-icons/Layers01Icon"
import LockIcon from "@hugeicons/core-free-icons/LockIcon"
import NetworkIcon from "@hugeicons/core-free-icons/NetworkIcon"
import ShieldAlertIcon from "@hugeicons/core-free-icons/ShieldAlertIcon"
import ShieldCheckIcon from "@hugeicons/core-free-icons/ShieldCheckIcon"
import type { IconSvgElement } from "@hugeicons/react"
import { NATType } from "@workspace/nat-detection"

/** Semantic tone used to color a NAT type consistently across the app. */
export type NATTone = "success" | "info" | "warning" | "destructive" | "muted"

export interface NATTypeMeta {
  icon: IconSvgElement
  tone: NATTone
  /** External reference (RFC / Wikipedia) for the "Learn more" link. */
  href?: string
  /** Whether the browser-based detector can actually report this type. */
  detectable: boolean
}

export const NAT_TYPE_META: Record<NATType, NATTypeMeta> = {
  [NATType.NO_NAT]: {
    icon: FlashIcon,
    tone: "success",
    href: "https://www.rfc-editor.org/rfc/rfc4787#section-4.1",
    detectable: true,
  },
  [NATType.CONE_NAT]: {
    icon: NetworkIcon,
    tone: "success",
    href: "https://www.rfc-editor.org/rfc/rfc4787#section-4.1",
    detectable: true,
  },
  [NATType.SYMMETRIC]: {
    icon: LockIcon,
    tone: "destructive",
    href: "https://en.wikipedia.org/wiki/Network_address_translation#Symmetric_NAT",
    detectable: true,
  },
  [NATType.MULTIPLE_LAYERS]: {
    icon: LayersIcon,
    tone: "warning",
    href: "https://www.rfc-editor.org/rfc/rfc6598",
    detectable: true,
  },
  [NATType.FULL_CONE]: {
    icon: GlobeIcon,
    tone: "success",
    href: "https://en.wikipedia.org/wiki/Network_address_translation#Full-cone_NAT",
    detectable: false,
  },
  [NATType.RESTRICTED_CONE]: {
    icon: ShieldCheckIcon,
    tone: "info",
    href: "https://en.wikipedia.org/wiki/Network_address_translation#Restricted-cone_NAT",
    detectable: false,
  },
  [NATType.PORT_RESTRICTED_CONE]: {
    icon: ShieldAlertIcon,
    tone: "warning",
    href: "https://en.wikipedia.org/wiki/Network_address_translation#Port-restricted_cone_NAT",
    detectable: false,
  },
  [NATType.UNKNOWN]: {
    icon: HelpCircleIcon,
    tone: "muted",
    detectable: true,
  },
}

/** Display order on the /nat-types page. */
export const DETECTABLE_NAT_TYPES = [
  NATType.NO_NAT,
  NATType.CONE_NAT,
  NATType.SYMMETRIC,
  NATType.MULTIPLE_LAYERS,
] as const

export const FILTERING_SUBTYPES = [
  NATType.FULL_CONE,
  NATType.RESTRICTED_CONE,
  NATType.PORT_RESTRICTED_CONE,
] as const

export const TONE_TEXT_CLASS: Record<NATTone, string> = {
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
}

/** Tinted icon container (background + text) for a tone. */
export const TONE_SURFACE_CLASS: Record<NATTone, string> = {
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
}
