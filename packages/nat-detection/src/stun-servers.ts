export interface STUNServer {
  /** STUN URL (e.g. "stun:stun.l.google.com:19302"). */
  url: string
  /** Human-readable label for the UI. */
  label: string
}

/**
 * Default public STUN servers used for detection.
 *
 * Mapping-behavior detection needs the same local socket to reach servers on
 * DIFFERENT public IP addresses, so the list deliberately spans several
 * providers. Multiple hostnames from one provider often resolve to the same
 * anycast IP and would not count as distinct destinations.
 */
export const STUN_SERVERS: STUNServer[] = [
  { url: "stun:stun.l.google.com:19302", label: "Google" },
  { url: "stun:stun.cloudflare.com:3478", label: "Cloudflare" },
  { url: "stun:stun.nextcloud.com:443", label: "Nextcloud" },
  { url: "stun:stun.sipgate.net:3478", label: "sipgate" },
]
