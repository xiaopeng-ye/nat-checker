/**
 * Browser-side NAT mapping-behavior detection using WebRTC ICE gathering.
 *
 * Only server-reflexive (srflx) candidates are observable from a browser, so
 * this module answers exactly one question with confidence: does the same
 * local UDP socket receive the SAME external ip:port from every STUN server
 * (endpoint-independent mapping, "cone"), or a DIFFERENT one per server
 * (address/port-dependent mapping, "symmetric")?
 *
 * Two facts about browser ICE shape the algorithm:
 *
 * 1. The ICE agent de-duplicates srflx candidates that share an address. Under
 *    a cone NAT, four STUN servers therefore yield ONE srflx candidate, not
 *    four. A single srflx is the cone signature, not "missing data".
 * 2. A host with several interfaces (Wi-Fi + VPN, Wi-Fi + Ethernet) owns one
 *    UDP socket per interface, and each socket gets its own mapping even
 *    behind a cone NAT. Browsers also blank out raddr/rport on srflx
 *    candidates when host addresses are mDNS-obfuscated, so mappings cannot be
 *    grouped by local socket.
 *
 * Algorithm:
 *
 *   Phase 1 (probe): one RTCPeerConnection per STUN server, in parallel.
 *     Records which servers answer and K = the number of distinct mappings a
 *     single server produces (== number of active local sockets).
 *   Phase 2 (mapping test): one RTCPeerConnection configured with every
 *     reachable server, so each local socket queries all of them.
 *     Distinct mappings <= K  -> endpoint-independent (cone)
 *     Distinct mappings  > K  -> endpoint-dependent (symmetric)
 *
 * Phase 2 needs at least two reachable servers on different public IPs;
 * with fewer the result is reported as inconclusive rather than guessed.
 */

import { NATDetectionError } from "./errors"
import { isCGNATIP, isIPv4, isMDNSName, isPrivateIP } from "./ip"
import { STUN_SERVERS } from "./stun-servers"
import { DetectionError } from "./types"
import type { STUNServer } from "./stun-servers"
import type {
  ConfidenceReason,
  DetectionConfidence,
  DetectionOutput,
  IPAddressInfo,
  NATPresence,
  ObservedMapping,
  PortMappingInfo,
} from "./types"

const DEFAULT_PROBE_TIMEOUT_MS = 5000
const DEFAULT_MAPPING_TIMEOUT_MS = 8000

export interface DetectionLogger {
  debug: (message: string, ...data: unknown[]) => void
  warn: (message: string, ...data: unknown[]) => void
}

export interface DetectNATOptions {
  /** STUN servers to query. Must span several providers / public IPs. */
  servers?: STUNServer[]
  /** Phase 1 per-server gathering timeout. */
  probeTimeoutMs?: number
  /** Phase 2 combined gathering timeout. */
  mappingTimeoutMs?: number
  /** Receives diagnostic output; defaults to `console`. */
  logger?: DetectionLogger | null
}

type IPFamily = "ipv4" | "ipv6"

interface ParsedCandidate {
  type: string | null
  protocol: string | null
  address: string | null
  port: number | null
  relatedAddress: string | null
  relatedPort: number | null
  /** STUN server URL reported by the browser for srflx candidates. */
  url: string | null
}

/**
 * The subset of RTCIceCandidate the parser reads. Every field is optional and
 * nullable: the getters are typed as non-nullable in recent DOM libs, but at
 * runtime they can be null/undefined (older browsers, or fields missing from
 * the candidate SDP). A real RTCIceCandidate is assignable to this type.
 */
export interface CandidateLike {
  candidate?: string | null
  type?: string | null
  protocol?: string | null
  address?: string | null
  port?: number | null
  relatedAddress?: string | null
  relatedPort?: number | null
}

/**
 * Parse an ICE candidate, preferring the typed fields and falling back to the
 * SDP string, which older browsers populate more reliably.
 *
 * SDP form: "candidate:<foundation> <component> <protocol> <priority>
 *            <address> <port> typ <type> [raddr <addr> rport <port>] ..."
 */
export function parseCandidate(
  candidate: CandidateLike,
  url: string | null
): ParsedCandidate {
  const parts = candidate.candidate?.split(" ") ?? []
  const sdpType: string | null =
    parts.length > 7 && parts[6] === "typ" ? (parts[7] ?? null) : null
  const raddrIndex = parts.indexOf("raddr")
  const rportIndex = parts.indexOf("rport")

  const toPort = (value: string | null): number | null => {
    if (value === null) return null
    const n = Number(value)
    return Number.isInteger(n) ? n : null
  }

  const partAt = (i: number): string | null =>
    i >= 0 && i < parts.length ? (parts[i] ?? null) : null

  // Both raddr/rport lookups must be guarded: indexOf() returns -1 when the
  // token is absent and partAt(-1 + 1) would otherwise read the foundation.
  return {
    type: candidate.type ?? sdpType,
    protocol: (candidate.protocol ?? partAt(2))?.toLowerCase() ?? null,
    address: candidate.address ?? partAt(4),
    port: candidate.port ?? toPort(partAt(5)),
    relatedAddress:
      candidate.relatedAddress ??
      (raddrIndex >= 0 ? partAt(raddrIndex + 1) : null),
    relatedPort:
      candidate.relatedPort ??
      (rportIndex >= 0 ? toPort(partAt(rportIndex + 1)) : null),
    url,
  }
}

function familyOf(address: string): IPFamily {
  return isIPv4(address) ? "ipv4" : "ipv6"
}

interface GatherOptions {
  timeoutMs: number
}

/**
 * Run ICE gathering against the given STUN servers and return every candidate
 * seen. Resolves on gathering completion or on timeout, and always closes the
 * connection.
 */
function gatherCandidates(
  urls: string[],
  options: GatherOptions
): Promise<ParsedCandidate[]> {
  return new Promise((resolve, reject) => {
    const pc = new RTCPeerConnection({
      iceServers: urls.map((url) => ({ urls: url })),
    })
    const candidates: ParsedCandidate[] = []
    let settled = false

    const finish = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      pc.close()
      resolve(candidates)
    }

    const timer = setTimeout(finish, options.timeoutMs)

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        finish()
        return
      }
      // `url` is in the WebRTC spec but missing from TypeScript's lib.dom.
      const url = (event as RTCPeerConnectionIceEvent & { url?: string | null })
        .url
      candidates.push(parseCandidate(event.candidate, url ?? null))
    }

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === "complete") finish()
    }

    pc.createDataChannel("nat-detect")
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch((err: unknown) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        pc.close()
        reject(err instanceof Error ? err : new Error(String(err)))
      })
  })
}

function isUdpSrflx(c: ParsedCandidate): boolean {
  return c.type === "srflx" && c.protocol === "udp" && !!c.address && !!c.port
}

function isUdpHost(c: ParsedCandidate): boolean {
  return c.type === "host" && c.protocol === "udp" && !!c.address
}

function mappingKey(c: ParsedCandidate): string {
  return `${c.address}:${c.port}`
}

function toMapping(c: ParsedCandidate): ObservedMapping {
  return {
    server: c.url,
    ip: c.address as string,
    port: c.port as number,
    base: `${c.relatedAddress ?? "?"}:${c.relatedPort ?? 0}`,
  }
}

/** Distinct srflx mappings, keyed by external ip:port. */
function distinctMappings(candidates: ParsedCandidate[]): ObservedMapping[] {
  const seen = new Map<string, ObservedMapping>()
  for (const c of candidates.filter(isUdpSrflx)) {
    const key = mappingKey(c)
    if (!seen.has(key)) seen.set(key, toMapping(c))
  }
  return Array.from(seen.values())
}

interface ProbeResult {
  url: string
  candidates: ParsedCandidate[]
  mappings: ObservedMapping[]
}

/** Phase 1: query each server on its own connection, in parallel. */
async function probeServers(
  servers: STUNServer[],
  timeoutMs: number,
  logger: DetectionLogger | null
): Promise<ProbeResult[]> {
  const results = await Promise.all(
    servers.map(async (server) => {
      try {
        // A cone NAT yields a single srflx per socket, so we cannot know how
        // many to expect; wait for the gathering state to complete instead
        // of stopping at the first one.
        const candidates = await gatherCandidates([server.url], { timeoutMs })
        return {
          url: server.url,
          candidates,
          mappings: distinctMappings(candidates),
        }
      } catch (err) {
        logger?.warn(`STUN probe failed for ${server.url}:`, err)
        return { url: server.url, candidates: [], mappings: [] }
      }
    })
  )
  return results
}

function pickHost(
  candidates: ParsedCandidate[],
  family: IPFamily | null
): ParsedCandidate | null {
  const hosts = candidates.filter(isUdpHost)
  if (family) {
    // mDNS names carry no family; accept them for any family.
    const match = hosts.find((h) => {
      const addr = h.address as string
      return isMDNSName(addr) || familyOf(addr) === family
    })
    if (match) return match
  }
  return hosts[0] ?? null
}

function buildIPInfo(
  host: ParsedCandidate | null,
  primary: ObservedMapping | null,
  mappingCandidates: ParsedCandidate[]
): IPAddressInfo {
  const localAddress = host?.address ?? null
  const obfuscated = localAddress !== null && isMDNSName(localAddress)
  const visibleLocalIP = localAddress && !obfuscated ? localAddress : null

  // Browsers blank raddr/rport on srflx when hosts are obfuscated, so rport is
  // only trusted when non-zero.
  const srflxForPrimary = primary
    ? mappingCandidates.find(
        (c) =>
          isUdpSrflx(c) && mappingKey(c) === `${primary.ip}:${primary.port}`
      )
    : undefined
  // The host candidate's port is not a substitute: with several sockets
  // (IPv4 + IPv6) it may belong to a different socket than the srflx.
  const localPort =
    srflxForPrimary?.relatedPort && srflxForPrimary.relatedPort > 0
      ? srflxForPrimary.relatedPort
      : null

  let natPresence: NATPresence = "unknown"
  if (primary && visibleLocalIP) {
    natPresence = visibleLocalIP === primary.ip ? "absent" : "present"
  } else if (primary && localPort !== null && localPort !== primary.port) {
    // Port was rewritten, so a NAT is definitely in the path. Equal ports
    // prove nothing: port-preserving NATs are common.
    natPresence = "present"
  } else if (!primary && visibleLocalIP) {
    // No srflx at all while the host address is public: the ICE agent drops
    // srflx candidates identical to the host candidate, which is what happens
    // on a directly connected public host.
    natPresence =
      !isPrivateIP(visibleLocalIP) && !isCGNATIP(visibleLocalIP)
        ? "absent"
        : "unknown"
  }

  const publicIP =
    primary?.ip ?? (natPresence === "absent" ? visibleLocalIP : null)

  return {
    localAddress,
    isLocalAddressObfuscated: obfuscated,
    localPort,
    publicIP,
    publicPort: primary?.port ?? null,
    natPresence,
    isBehindCGNAT:
      (visibleLocalIP !== null && isCGNATIP(visibleLocalIP)) ||
      (publicIP !== null && isCGNATIP(publicIP)),
  }
}

/**
 * Main entry point. Throws `NATDetectionError` with BROWSER_UNSUPPORTED or
 * STUN_UNREACHABLE; other failures propagate as-is.
 */
export async function detectNAT(
  options: DetectNATOptions = {}
): Promise<DetectionOutput> {
  const servers = options.servers ?? STUN_SERVERS
  const probeTimeoutMs = options.probeTimeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS
  const mappingTimeoutMs =
    options.mappingTimeoutMs ?? DEFAULT_MAPPING_TIMEOUT_MS
  const logger = options.logger === undefined ? console : options.logger

  if (typeof RTCPeerConnection === "undefined") {
    throw new NATDetectionError(DetectionError.BROWSER_UNSUPPORTED)
  }

  // Phase 1: reachability and per-socket mapping count.
  const probes = await probeServers(servers, probeTimeoutMs, logger)
  const reachable = probes.filter((p) => p.mappings.length > 0)
  const reachableServers = reachable.map((p) => p.url)
  logger?.debug(
    `STUN probe: ${reachable.length}/${probes.length} servers answered`,
    reachable.map((p) => ({ url: p.url, mappings: p.mappings }))
  )

  if (reachable.length === 0) {
    // Possibly a public host whose srflx candidates were suppressed as
    // duplicates of the host candidate. Report that honestly with low
    // confidence; otherwise the servers are unreachable.
    const anyHost = pickHost(
      probes.flatMap((p) => p.candidates),
      "ipv4"
    )
    const ipInfo = buildIPInfo(anyHost, null, [])
    if (ipInfo.natPresence === "absent") {
      return {
        ipInfo,
        portMapping: {
          isMappingConsistent: true,
          isPortConsistent: true,
          isIPConsistent: true,
          observedMappings: [],
          reachableServers: [],
        },
        confidence: "low",
        confidenceReason: "NO_MAPPINGS",
      }
    }
    throw new NATDetectionError(DetectionError.STUN_UNREACHABLE)
  }

  // Prefer IPv4 for the verdict: that is where NAT lives in practice.
  const families = new Set(
    reachable.flatMap((p) => p.mappings.map((m) => familyOf(m.ip)))
  )
  const family: IPFamily = families.has("ipv4") ? "ipv4" : "ipv6"
  const inFamily = (m: ObservedMapping) => familyOf(m.ip) === family

  // K: distinct mappings one server produces == number of active local sockets.
  const socketCount = Math.max(
    1,
    ...reachable.map((p) => p.mappings.filter(inFamily).length)
  )

  // Phase 2: every reachable server from the same sockets.
  const firstReachable = reachable[0]
  if (!firstReachable) {
    throw new NATDetectionError(DetectionError.STUN_UNREACHABLE)
  }
  let mappingCandidates: ParsedCandidate[] = firstReachable.candidates
  let observedMappings: ObservedMapping[] =
    firstReachable.mappings.filter(inFamily)
  // Only true when the verdict really rests on several destinations; the
  // fallback below reuses single-server probe data and must not claim more.
  let multiServer = false
  if (reachable.length >= 2) {
    const combined = await gatherCandidates(reachableServers, {
      timeoutMs: mappingTimeoutMs,
    })
    const combinedMappings = distinctMappings(combined).filter(inFamily)
    if (combinedMappings.length > 0) {
      mappingCandidates = combined
      observedMappings = combinedMappings
      multiServer = true
    } else {
      // The combined run failed where the probes succeeded; fall back to
      // probe data rather than failing the whole detection.
      logger?.warn("Combined STUN run produced no mappings; using probe data")
      mappingCandidates = reachable.flatMap((p) => p.candidates)
    }
  }

  const distinctIPs = new Set(observedMappings.map((m) => m.ip)).size
  const distinctPorts = new Set(observedMappings.map((m) => m.port)).size
  const isMappingConsistent = observedMappings.length <= socketCount

  const portMapping: PortMappingInfo = {
    isMappingConsistent,
    isPortConsistent: distinctPorts <= socketCount,
    isIPConsistent: distinctIPs <= socketCount,
    observedMappings,
    reachableServers,
  }

  let confidence: DetectionConfidence
  let confidenceReason: ConfidenceReason
  if (!multiServer) {
    confidence = "low"
    confidenceReason = "SINGLE_SERVER_ONLY"
  } else {
    confidence = "high"
    confidenceReason = isMappingConsistent
      ? "MULTIPLE_SERVERS_CONSISTENT"
      : "MULTIPLE_SERVERS_DIVERGENT"
  }

  logger?.debug("NAT mapping test", {
    family,
    socketCount,
    observedMappings,
    isMappingConsistent,
    confidence,
    confidenceReason,
  })

  const ipInfo = buildIPInfo(
    pickHost(mappingCandidates, family),
    observedMappings[0] ?? null,
    mappingCandidates
  )

  return { ipInfo, portMapping, confidence, confidenceReason }
}
