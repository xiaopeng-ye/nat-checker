import { describe, expect, it } from "vitest"
import { classifyNAT } from "./classifier"
import { NATType } from "./types"
import type { IPAddressInfo, PortMappingInfo } from "./types"

function ipInfo(overrides: Partial<IPAddressInfo> = {}): IPAddressInfo {
  return {
    localAddress: "192.168.1.10",
    isLocalAddressObfuscated: false,
    localPort: 50000,
    publicIP: "203.0.113.5",
    publicPort: 50000,
    natPresence: "present",
    isBehindCGNAT: false,
    ...overrides,
  }
}

function portMapping(
  overrides: Partial<PortMappingInfo> = {}
): PortMappingInfo {
  return {
    isMappingConsistent: true,
    isPortConsistent: true,
    isIPConsistent: true,
    observedMappings: [],
    reachableServers: ["stun:a", "stun:b"],
    ...overrides,
  }
}

describe("classifyNAT", () => {
  it("returns NO_NAT whenever NAT is known to be absent", () => {
    expect(
      classifyNAT(
        ipInfo({ natPresence: "absent" }),
        portMapping(),
        "NO_MAPPINGS"
      )
    ).toBe(NATType.NO_NAT)
  })

  it("returns UNKNOWN when only one server answered", () => {
    expect(classifyNAT(ipInfo(), portMapping(), "SINGLE_SERVER_ONLY")).toBe(
      NATType.UNKNOWN
    )
    expect(classifyNAT(ipInfo(), portMapping(), "NO_MAPPINGS")).toBe(
      NATType.UNKNOWN
    )
  })

  it("returns SYMMETRIC on divergent mappings", () => {
    expect(
      classifyNAT(
        ipInfo(),
        portMapping({ isMappingConsistent: false }),
        "MULTIPLE_SERVERS_DIVERGENT"
      )
    ).toBe(NATType.SYMMETRIC)
  })

  it("does not rely on the informational ip/port flags", () => {
    // Symmetric NAT with a single public IP: IP flag stays true, but the
    // mapping verdict is what counts.
    expect(
      classifyNAT(
        ipInfo(),
        portMapping({
          isMappingConsistent: false,
          isIPConsistent: true,
          isPortConsistent: false,
        }),
        "MULTIPLE_SERVERS_DIVERGENT"
      )
    ).toBe(NATType.SYMMETRIC)
  })

  it("returns CONE_NAT on consistent mappings", () => {
    expect(
      classifyNAT(ipInfo(), portMapping(), "MULTIPLE_SERVERS_CONSISTENT")
    ).toBe(NATType.CONE_NAT)
  })

  it("returns MULTIPLE_LAYERS when the external address is itself internal", () => {
    expect(
      classifyNAT(
        ipInfo({ publicIP: "100.64.3.4" }),
        portMapping(),
        "MULTIPLE_SERVERS_CONSISTENT"
      )
    ).toBe(NATType.MULTIPLE_LAYERS)
    expect(
      classifyNAT(
        ipInfo({ publicIP: "10.1.2.3" }),
        portMapping(),
        "MULTIPLE_SERVERS_CONSISTENT"
      )
    ).toBe(NATType.MULTIPLE_LAYERS)
  })

  it("does not claim MULTIPLE_LAYERS when the local address is obfuscated", () => {
    expect(
      classifyNAT(
        ipInfo({
          publicIP: "100.64.3.4",
          localAddress: "abcd.local",
          isLocalAddressObfuscated: true,
        }),
        portMapping(),
        "MULTIPLE_SERVERS_CONSISTENT"
      )
    ).toBe(NATType.CONE_NAT)
  })
})
