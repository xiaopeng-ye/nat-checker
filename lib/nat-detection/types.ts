/**
 * NAT type classification based on RFC 5780 behavior analysis
 *
 * Detection Methods:
 * - Basic Mode (WebRTC): Can detect CONE_NAT vs SYMMETRIC (browser limitations)
 * - Advanced Mode (Server): Can precisely detect all types including FULL_CONE,
 *   RESTRICTED_CONE, and PORT_RESTRICTED_CONE using RFC 5780 CHANGE-REQUEST
 */
export enum NATType {
  /**
   * Cone NAT (Generic - used when precise subtype cannot be determined)
   * - Consistent external IP:port mapping
   * - Good for most P2P applications
   * - WebRTC basic detection returns this when cone type is detected
   */
  CONE_NAT = "CONE_NAT",

  /**
   * Full Cone NAT (most permissive)
   * - Once external port is mapped, ANY external host can send packets to it
   * - Best for P2P applications
   * - Detection: Requires server-side RFC 5780 Test II
   */
  FULL_CONE = "FULL_CONE",

  /**
   * Restricted Cone NAT (IP-level filtering)
   * - External host must have received a packet from internal host first
   * - Filters by source IP address only (any port from that IP is allowed)
   * - Detection: Requires server-side RFC 5780 Test III
   */
  RESTRICTED_CONE = "RESTRICTED_CONE",

  /**
   * Port-Restricted Cone NAT (IP+Port level filtering)
   * - External host must have received a packet from internal host first
   * - Filters by both source IP AND port (most common home router setting)
   * - Detection: Requires server-side RFC 5780 Test III (negative result)
   */
  PORT_RESTRICTED_CONE = "PORT_RESTRICTED_CONE",

  /**
   * Symmetric NAT - different external port per destination
   * - Most restrictive NAT type
   * - Difficult for P2P, often requires TURN relay
   * - Detection: Port changes when contacting different servers
   */
  SYMMETRIC = "SYMMETRIC",

  /**
   * No NAT - direct public IP assignment
   */
  NO_NAT = "NO_NAT",

  /**
   * Multiple NAT layers (e.g., CGNAT + home router)
   */
  MULTIPLE_LAYERS = "MULTIPLE_LAYERS",
}

/**
 * Detection state machine
 */
export enum DetectionState {
  IDLE = "IDLE",
  DETECTING = "DETECTING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

/**
 * Error types for detection failures
 */
export enum DetectionError {
  STUN_UNREACHABLE = "STUN_UNREACHABLE",
  BROWSER_UNSUPPORTED = "BROWSER_UNSUPPORTED",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  TIMEOUT = "TIMEOUT",
  UNKNOWN = "UNKNOWN",
}

/**
 * IP address information extracted from ICE candidates
 */
export interface IPAddressInfo {
  /** Local IP address (host candidate) - RFC 1918 private or public */
  localIP: string;
  /** Public IP address (server-reflexive candidate) */
  publicIP: string | null;
  /** Port number from server-reflexive candidate */
  publicPort: number | null;
  /** True if local IP is in RFC 1918 private ranges */
  isBehindLocalNAT: boolean;
  /** True if public IP is in RFC 6598 CGNAT range (100.64.0.0/10) */
  isBehindCGNAT: boolean;
}

/**
 * Port mapping behavior analysis
 */
export interface PortMappingInfo {
  /** True if external port stays consistent across bindings */
  isPortConsistent: boolean;
  /** True if external IP stays consistent across bindings */
  isIPConsistent: boolean;
  /** List of (external IP, external port) pairs observed */
  observedMappings: Array<{ ip: string; port: number }>;
}

/**
 * Detection confidence level
 */
export type DetectionConfidence = "high" | "low";

/**
 * Complete detection result
 *
 * Lifecycle: Created when detection starts, updated during ICE gathering,
 * finalized when detection completes or times out.
 *
 * Storage: Exists only in React component state, never persisted.
 */
export interface DetectionResult {
  /** Detection state */
  state: DetectionState;
  /** Classified NAT type (null if detection incomplete/failed) */
  natType: NATType | null;
  /** Timestamp when detection started */
  startedAt: Date;
  /** Timestamp when detection completed (success or error) */
  completedAt: Date | null;
  /** Duration in milliseconds (null if incomplete) */
  durationMs: number | null;
  /** IP address information */
  ipInfo: IPAddressInfo | null;
  /** Port mapping behavior */
  portMapping: PortMappingInfo | null;
  /** Error details if state === ERROR */
  error: {
    type: DetectionError;
    message: string;
  } | null;
  /** Which STUN server succeeded (for debugging) */
  successfulSTUNServer: string | null;
  /** Detection confidence level (based on number of srflx candidates) */
  confidence: DetectionConfidence | null;
  /** Explanation for confidence level */
  confidenceReason: string | null;
  /** Detection method used (basic WebRTC or advanced server-side) */
  detectionMethod?: "basic" | "advanced";
}

/**
 * Check if an IP address is in RFC 1918 private ranges
 * - 10.0.0.0/8
 * - 172.16.0.0/12
 * - 192.168.0.0/16
 */
export function isPrivateIP(ip: string): boolean {
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some(Number.isNaN)) return false;

  // 10.0.0.0/8
  if (octets[0] === 10) return true;
  // 172.16.0.0/12
  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
  // 192.168.0.0/16
  if (octets[0] === 192 && octets[1] === 168) return true;

  return false;
}

/**
 * Check if an IP address is in RFC 6598 CGNAT range
 * - 100.64.0.0/10
 */
export function isCGNATIP(ip: string): boolean {
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some(Number.isNaN)) return false;

  // 100.64.0.0/10 (RFC 6598 CGNAT range)
  if (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127) return true;

  return false;
}

/**
 * Localized string with fallback
 */
export type LocalizedString = {
  en: string;
  zh: string;
};

/**
 * Impact rating for specific application categories
 */
export type ImpactRating = "good" | "fair" | "poor";

/**
 * Application category impact assessment
 */
export interface ApplicationImpact {
  /** Online gaming (matchmaking, hosting servers) */
  gaming: ImpactRating;
  /** Peer-to-peer file sharing (BitTorrent, IPFS) */
  p2p: ImpactRating;
  /** Video/voice calls (WebRTC, VoIP) */
  videoCalls: ImpactRating;
  /** Remote access (SSH, RDP, VPN servers) */
  remoteAccess: ImpactRating;
}

/**
 * Complete educational content for one NAT type
 */
export interface NATTypeEducation {
  type: NATType;

  /** Tier 1: Always visible, concise content */
  tier1: {
    /** Display name (e.g., "Full Cone NAT" / "完全锥型 NAT") */
    name: LocalizedString;
    /** 2-3 sentence plain-language definition */
    definition: LocalizedString;
    /** Impact ratings for application categories */
    impactSummary: ApplicationImpact;
  };

  /** Tier 2: Expandable "Learn More" details */
  tier2: {
    /** Technical explanation of port mapping behavior */
    technicalDetails: LocalizedString;
    /** Real-world example scenarios (3-5 examples) */
    exampleScenarios: LocalizedString[];
    /** Troubleshooting tips for improving connectivity (3-5 tips) */
    troubleshootingTips: LocalizedString[];
    /** Comparison with other NAT types (optional) */
    comparison?: LocalizedString;
  };
}

/**
 * Complete educational content database
 *
 * Storage: Bundled in application code as static JSON, loaded at build time.
 */
export type EducationDatabase = {
  [key in NATType]: NATTypeEducation;
};

/**
 * Supported languages
 */
export type SupportedLanguage = "en" | "zh";

/**
 * Get localized string for current language
 */
export function getLocalizedString(
  str: LocalizedString,
  lang: SupportedLanguage,
): string {
  return str[lang];
}
