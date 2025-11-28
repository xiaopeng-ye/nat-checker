/**
 * STUN server entry
 */
export interface STUNServer {
  /** STUN URL (e.g., "stun:stun.l.google.com:19302") */
  url: string;
  /** Human-readable label for debugging */
  label: string;
  /** Priority (lower = try first) */
  priority: number;
}

/**
 * STUN server list with fallback chain
 *
 * Usage: Try servers in priority order (1, 2, 3, ...) until one succeeds.
 * Timeout: 5 seconds per server, 15 seconds total (FR-008a).
 */
export const STUN_SERVERS: STUNServer[] = [
  {
    url: "stun:stun.l.google.com:19302",
    label: "Google STUN (Primary)",
    priority: 1,
  },
  {
    url: "stun:stun1.l.google.com:19302",
    label: "Google STUN (Backup)",
    priority: 2,
  },
  {
    url: "stun:stun.stunprotocol.org:3478",
    label: "STUNProtocol.org",
    priority: 3,
  },
  {
    url: "stun:stun.voip.blackberry.com:3478",
    label: "Blackberry VoIP",
    priority: 4,
  },
];
