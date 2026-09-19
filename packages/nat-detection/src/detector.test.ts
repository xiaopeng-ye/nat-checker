import { afterEach, describe, expect, it, vi } from "vitest"
import { detectNAT, parseCandidate } from "./detector"
import { NATDetectionError } from "./errors"
import { DetectionError } from "./types"
import type { STUNServer } from "./stun-servers"

const SERVERS: STUNServer[] = [
  { url: "stun:a.example:3478", label: "A" },
  { url: "stun:b.example:3478", label: "B" },
  { url: "stun:c.example:3478", label: "C" },
]

interface FakeSocket {
  local: string
  port: number
}

/**
 * Describes how the fake NAT answers: given a local socket and a STUN server,
 * return the external ip:port, or null when the server is unreachable.
 */
type Mapper = (
  socket: FakeSocket,
  server: string
) => { ip: string; port: number } | null

interface FakeEvent {
  candidate: { candidate: string } | null
  url?: string
}

/**
 * Minimal RTCPeerConnection stand-in that reproduces the two browser
 * behaviours the detector relies on: one UDP socket per interface, and
 * de-duplication of srflx candidates that share an address.
 */
function installFakeRTC(sockets: FakeSocket[], mapper: Mapper) {
  const instances: string[][] = []

  class FakeRTCPeerConnection {
    iceGatheringState = "new"
    onicecandidate: ((e: FakeEvent) => void) | null = null
    onicegatheringstatechange: (() => void) | null = null
    private readonly urls: string[]

    constructor(config: { iceServers: { urls: string }[] }) {
      this.urls = config.iceServers.map((s) => s.urls)
      instances.push(this.urls)
    }

    createDataChannel() {}

    createOffer() {
      return Promise.resolve({})
    }

    setLocalDescription() {
      queueMicrotask(() => this.gather())
      return Promise.resolve()
    }

    close() {}

    private gather() {
      this.iceGatheringState = "gathering"
      for (const socket of sockets) {
        this.onicecandidate?.({
          candidate: {
            candidate: `candidate:1 1 udp 2122260223 ${socket.local} ${socket.port} typ host`,
          },
        })
        const seen = new Set<string>()
        for (const url of this.urls) {
          const mapped = mapper(socket, url)
          if (!mapped) continue
          const key = `${mapped.ip}:${mapped.port}`
          if (seen.has(key)) continue
          seen.add(key)
          // Like Chrome: never emit an srflx identical to the host candidate.
          if (mapped.ip === socket.local && mapped.port === socket.port) {
            continue
          }
          this.onicecandidate?.({
            candidate: {
              candidate: `candidate:2 1 udp 1686052607 ${mapped.ip} ${mapped.port} typ srflx raddr ${socket.local} rport ${socket.port}`,
            },
            url,
          })
        }
      }
      this.onicecandidate?.({ candidate: null })
      this.iceGatheringState = "complete"
      this.onicegatheringstatechange?.()
    }
  }

  vi.stubGlobal("RTCPeerConnection", FakeRTCPeerConnection)
  return { instances }
}

const silent = { debug: () => {}, warn: () => {} }
const run = () => detectNAT({ servers: SERVERS, logger: silent })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("parseCandidate", () => {
  it("parses host candidates without raddr/rport", () => {
    const parsed = parseCandidate(
      { candidate: "candidate:1 1 udp 2122260223 192.168.1.2 50000 typ host" },
      null
    )
    expect(parsed).toMatchObject({
      type: "host",
      protocol: "udp",
      address: "192.168.1.2",
      port: 50000,
      relatedAddress: null,
      relatedPort: null,
    })
  })

  it("parses srflx candidates with raddr/rport", () => {
    const parsed = parseCandidate(
      {
        candidate:
          "candidate:2 1 UDP 1686052607 203.0.113.5 61000 typ srflx raddr 192.168.1.2 rport 50000 generation 0",
      },
      "stun:a.example:3478"
    )
    expect(parsed).toEqual({
      type: "srflx",
      protocol: "udp",
      address: "203.0.113.5",
      port: 61000,
      relatedAddress: "192.168.1.2",
      relatedPort: 50000,
      url: "stun:a.example:3478",
    })
  })

  it("prefers typed fields over the SDP string", () => {
    const parsed = parseCandidate(
      {
        candidate: "candidate:1 1 udp 1 1.1.1.1 1 typ host",
        type: "srflx",
        address: "9.9.9.9",
        port: 9,
        relatedAddress: "10.0.0.1",
        relatedPort: 10,
      },
      null
    )
    expect(parsed).toMatchObject({
      type: "srflx",
      address: "9.9.9.9",
      port: 9,
      relatedAddress: "10.0.0.1",
      relatedPort: 10,
    })
  })
})

describe("detectNAT", () => {
  it("throws BROWSER_UNSUPPORTED without RTCPeerConnection", async () => {
    vi.stubGlobal("RTCPeerConnection", undefined)
    await expect(run()).rejects.toMatchObject({
      type: DetectionError.BROWSER_UNSUPPORTED,
    })
  })

  it("detects a cone NAT (same mapping from every server)", async () => {
    installFakeRTC([{ local: "192.168.1.2", port: 50000 }], () => ({
      ip: "203.0.113.5",
      port: 61000,
    }))
    const out = await run()

    expect(out.confidence).toBe("high")
    expect(out.confidenceReason).toBe("MULTIPLE_SERVERS_CONSISTENT")
    expect(out.portMapping.isMappingConsistent).toBe(true)
    expect(out.portMapping.observedMappings).toHaveLength(1)
    expect(out.portMapping.reachableServers).toEqual(SERVERS.map((s) => s.url))
    expect(out.ipInfo).toMatchObject({
      localAddress: "192.168.1.2",
      localPort: 50000,
      publicIP: "203.0.113.5",
      publicPort: 61000,
      natPresence: "present",
      isBehindCGNAT: false,
    })
  })

  it("detects a symmetric NAT (one mapping per destination)", async () => {
    let next = 61000
    const table = new Map<string, number>()
    installFakeRTC([{ local: "192.168.1.2", port: 50000 }], (_, server) => {
      if (!table.has(server)) table.set(server, next++)
      return { ip: "203.0.113.5", port: table.get(server) as number }
    })
    const out = await run()

    expect(out.confidence).toBe("high")
    expect(out.confidenceReason).toBe("MULTIPLE_SERVERS_DIVERGENT")
    expect(out.portMapping.isMappingConsistent).toBe(false)
    expect(out.portMapping.observedMappings).toHaveLength(3)
    // Informational flags reflect what was actually observed.
    expect(out.portMapping.isIPConsistent).toBe(true)
    expect(out.portMapping.isPortConsistent).toBe(false)
  })

  it("does not mistake multiple interfaces for a symmetric NAT", async () => {
    installFakeRTC(
      [
        { local: "192.168.1.2", port: 50000 },
        { local: "10.8.0.2", port: 50001 },
      ],
      (socket) =>
        socket.local === "192.168.1.2"
          ? { ip: "203.0.113.5", port: 61000 }
          : { ip: "198.51.100.9", port: 62000 }
    )
    const out = await run()

    expect(out.confidenceReason).toBe("MULTIPLE_SERVERS_CONSISTENT")
    expect(out.portMapping.isMappingConsistent).toBe(true)
    expect(out.portMapping.observedMappings).toHaveLength(2)
  })

  it("reports low confidence when only one server answers", async () => {
    installFakeRTC([{ local: "192.168.1.2", port: 50000 }], (_, server) =>
      server === SERVERS[0]?.url ? { ip: "203.0.113.5", port: 61000 } : null
    )
    const out = await run()

    expect(out.confidence).toBe("low")
    expect(out.confidenceReason).toBe("SINGLE_SERVER_ONLY")
    expect(out.portMapping.reachableServers).toEqual([SERVERS[0]?.url])
  })

  it("reports low confidence when the combined run yields nothing", async () => {
    // Servers answer individually but not when combined into one connection.
    const { instances } = installFakeRTC(
      [{ local: "192.168.1.2", port: 50000 }],
      () => {
        const combined = instances[instances.length - 1]
        if (combined && combined.length > 1) return null
        return { ip: "203.0.113.5", port: 61000 }
      }
    )
    const out = await run()

    expect(out.confidence).toBe("low")
    expect(out.confidenceReason).toBe("SINGLE_SERVER_ONLY")
    expect(out.portMapping.observedMappings).toHaveLength(1)
  })

  it("throws STUN_UNREACHABLE when nothing answers behind a private address", async () => {
    installFakeRTC([{ local: "192.168.1.2", port: 50000 }], () => null)
    await expect(run()).rejects.toBeInstanceOf(NATDetectionError)
    await expect(run()).rejects.toMatchObject({
      type: DetectionError.STUN_UNREACHABLE,
    })
  })

  it("reports NO_NAT for a public host whose srflx equals its host candidate", async () => {
    // Chrome suppresses the srflx, so no server looks reachable.
    installFakeRTC([{ local: "203.0.113.5", port: 50000 }], (socket) => ({
      ip: socket.local,
      port: socket.port,
    }))
    const out = await run()

    expect(out.confidenceReason).toBe("NO_MAPPINGS")
    expect(out.ipInfo.natPresence).toBe("absent")
    expect(out.ipInfo.publicIP).toBe("203.0.113.5")
  })

  it("flags CGNAT when the local address is in 100.64/10", async () => {
    installFakeRTC([{ local: "100.72.1.2", port: 50000 }], () => ({
      ip: "203.0.113.5",
      port: 61000,
    }))
    const out = await run()
    expect(out.ipInfo.isBehindCGNAT).toBe(true)
    expect(out.ipInfo.natPresence).toBe("present")
  })

  it("prefers IPv4 when both families are present", async () => {
    installFakeRTC(
      [
        { local: "192.168.1.2", port: 50000 },
        { local: "2001:db8::2", port: 50001 },
      ],
      (socket) =>
        socket.local === "192.168.1.2"
          ? { ip: "203.0.113.5", port: 61000 }
          : { ip: "2001:db8::2", port: 50001 }
    )
    const out = await run()

    expect(out.portMapping.observedMappings).toEqual([
      expect.objectContaining({ ip: "203.0.113.5", port: 61000 }),
    ])
    expect(out.ipInfo.localAddress).toBe("192.168.1.2")
  })
})
