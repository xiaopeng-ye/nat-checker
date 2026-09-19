import { NATType } from "@workspace/nat-detection"

/**
 * Non-translated semantic ratings shown in the educational content.
 *
 * These values are the same in every locale (they are machine-read as
 * "good" | "fair" | "poor" and rendered as icons), so they live in code
 * instead of the translation files.
 */
export type ImpactRating = "good" | "fair" | "poor"

export const NAT_TYPE_IMPACT: Partial<
  Record<
    NATType,
    Record<"gaming" | "p2p" | "videoCalls" | "remoteAccess", ImpactRating>
  >
> = {
  [NATType.CONE_NAT]: {
    gaming: "good",
    p2p: "good",
    videoCalls: "good",
    remoteAccess: "fair",
  },
  [NATType.FULL_CONE]: {
    gaming: "good",
    p2p: "good",
    videoCalls: "good",
    remoteAccess: "good",
  },
  [NATType.RESTRICTED_CONE]: {
    gaming: "good",
    p2p: "good",
    videoCalls: "good",
    remoteAccess: "fair",
  },
  [NATType.PORT_RESTRICTED_CONE]: {
    gaming: "good",
    p2p: "good",
    videoCalls: "good",
    remoteAccess: "fair",
  },
  [NATType.SYMMETRIC]: {
    gaming: "poor",
    p2p: "poor",
    videoCalls: "fair",
    remoteAccess: "poor",
  },
  [NATType.NO_NAT]: {
    gaming: "good",
    p2p: "good",
    videoCalls: "good",
    remoteAccess: "good",
  },
  [NATType.MULTIPLE_LAYERS]: {
    gaming: "poor",
    p2p: "poor",
    videoCalls: "fair",
    remoteAccess: "poor",
  },
}
