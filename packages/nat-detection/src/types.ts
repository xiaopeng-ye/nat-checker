/**
 * NAT classification model.
 *
 * What a browser can and cannot observe (RFC 4787 / RFC 5780 terminology):
 *
 * - Mapping behavior (endpoint-independent vs address/port-dependent) CAN be
 *   observed: one local socket talks to several STUN servers and we compare the
 *   external ip:port each server reports.
 * - Filtering behavior (Full Cone / Restricted Cone / Port-Restricted Cone)
 *   CANNOT be observed: it requires receiving unsolicited UDP from a host the
 *   socket never contacted, and WebRTC never surfaces such packets to JS.
 *
 * Therefore detection only ever yields CONE_NAT, SYMMETRIC, NO_NAT,
 * MULTIPLE_LAYERS or UNKNOWN. The cone subtypes remain in the enum purely for
 * the educational pages.
 */
export enum NATType {
  /** Endpoint-independent mapping (any cone subtype). */
  CONE_NAT = "CONE_NAT",
  /** Educational only: not detectable from a browser. */
  FULL_CONE = "FULL_CONE",
  /** Educational only: not detectable from a browser. */
  RESTRICTED_CONE = "RESTRICTED_CONE",
  /** Educational only: not detectable from a browser. */
  PORT_RESTRICTED_CONE = "PORT_RESTRICTED_CONE",
  /** Address- or address-and-port-dependent mapping. */
  SYMMETRIC = "SYMMETRIC",
  /** Host candidate address equals server-reflexive address. */
  NO_NAT = "NO_NAT",
  /** Local NAT plus carrier-grade NAT (RFC 6598) in front of it. */
  MULTIPLE_LAYERS = "MULTIPLE_LAYERS",
  /** Not enough independent STUN servers answered to judge mapping behavior. */
  UNKNOWN = "UNKNOWN",
}

/** NAT types that the detector can actually produce. */
export type DetectableNATType =
  | NATType.CONE_NAT
  | NATType.SYMMETRIC
  | NATType.NO_NAT
  | NATType.MULTIPLE_LAYERS
  | NATType.UNKNOWN

export enum DetectionState {
  IDLE = "IDLE",
  DETECTING = "DETECTING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export enum DetectionError {
  STUN_UNREACHABLE = "STUN_UNREACHABLE",
  BROWSER_UNSUPPORTED = "BROWSER_UNSUPPORTED",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  TIMEOUT = "TIMEOUT",
  UNKNOWN = "UNKNOWN",
}

/**
 * Whether a NAT sits between this host and the STUN servers.
 *
 * "unknown" is common: browsers obfuscate host candidates with mDNS names, and a
 * port-preserving NAT cannot be told apart from no NAT by port comparison alone.
 */
export type NATPresence = "present" | "absent" | "unknown"

export interface IPAddressInfo {
  /** Raw host candidate address: a real IP, or an mDNS name such as "xxxx.local". */
  localAddress: string | null
  /** True when the browser hid the real local IP behind an mDNS name. */
  isLocalAddressObfuscated: boolean
  /** Local UDP port of the socket that produced the server-reflexive mapping. */
  localPort: number | null
  /** External IP as reported by STUN. */
  publicIP: string | null
  /** External port as reported by STUN. */
  publicPort: number | null
  natPresence: NATPresence
  /** True when a visible local IP is in 100.64.0.0/10 (device sits directly on a CGNAT). */
  isBehindCGNAT: boolean
}

/** One server-reflexive mapping observed from a specific local socket. */
export interface ObservedMapping {
  /** STUN server URL that produced the mapping, when the browser reports it. */
  server: string | null
  ip: string
  port: number
  /** Identifies the local socket ("relatedAddress:relatedPort"). */
  base: string
}

export interface PortMappingInfo {
  /**
   * The actual verdict: true when the number of distinct external mappings
   * did not exceed the number of local sockets, i.e. every socket received
   * one mapping regardless of destination (endpoint-independent mapping).
   */
  isMappingConsistent: boolean
  /** Informational: distinct external ports did not exceed the socket count. */
  isPortConsistent: boolean
  /** Informational: distinct external IPs did not exceed the socket count. */
  isIPConsistent: boolean
  /** Distinct mappings observed during the multi-server test. */
  observedMappings: ObservedMapping[]
  /** STUN servers that answered the per-server reachability probe. */
  reachableServers: string[]
}

export type DetectionConfidence = "high" | "low"

/** Machine-readable explanation of the confidence level; translated by the UI. */
export type ConfidenceReason =
  | "MULTIPLE_SERVERS_CONSISTENT"
  | "MULTIPLE_SERVERS_DIVERGENT"
  | "SINGLE_SERVER_ONLY"
  | "NO_MAPPINGS"

/** Raw output of `detectNAT`, before classification. */
export interface DetectionOutput {
  ipInfo: IPAddressInfo
  portMapping: PortMappingInfo
  confidence: DetectionConfidence
  confidenceReason: ConfidenceReason
}

export interface DetectionResult {
  state: DetectionState
  natType: DetectableNATType | null
  startedAt: Date
  completedAt: Date | null
  durationMs: number | null
  ipInfo: IPAddressInfo | null
  portMapping: PortMappingInfo | null
  error: {
    type: DetectionError
    message: string
  } | null
  confidence: DetectionConfidence | null
  confidenceReason: ConfidenceReason | null
}
