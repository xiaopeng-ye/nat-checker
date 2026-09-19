import { describe, expect, it } from "vitest"
import { isCGNATIP, isIPv4, isMDNSName, isPrivateIP } from "./ip"

describe("isIPv4", () => {
  it("accepts dotted quads", () => {
    expect(isIPv4("0.0.0.0")).toBe(true)
    expect(isIPv4("255.255.255.255")).toBe(true)
  })

  it("rejects malformed input", () => {
    expect(isIPv4("")).toBe(false)
    expect(isIPv4("1.2.3")).toBe(false)
    expect(isIPv4("1.2.3.4.5")).toBe(false)
    expect(isIPv4("1.2.3.256")).toBe(false)
    expect(isIPv4("1.2.3.x")).toBe(false)
    expect(isIPv4("2001:db8::1")).toBe(false)
    expect(isIPv4("abcd.local")).toBe(false)
  })
})

describe("isPrivateIP", () => {
  it("matches RFC 1918 ranges", () => {
    expect(isPrivateIP("10.0.0.1")).toBe(true)
    expect(isPrivateIP("172.16.0.1")).toBe(true)
    expect(isPrivateIP("172.31.255.255")).toBe(true)
    expect(isPrivateIP("192.168.1.1")).toBe(true)
  })

  it("rejects neighbours of the private ranges", () => {
    expect(isPrivateIP("172.15.255.255")).toBe(false)
    expect(isPrivateIP("172.32.0.0")).toBe(false)
    expect(isPrivateIP("192.167.1.1")).toBe(false)
    expect(isPrivateIP("11.0.0.1")).toBe(false)
    expect(isPrivateIP("100.64.0.1")).toBe(false)
  })
})

describe("isCGNATIP", () => {
  it("matches 100.64.0.0/10", () => {
    expect(isCGNATIP("100.64.0.0")).toBe(true)
    expect(isCGNATIP("100.127.255.255")).toBe(true)
    expect(isCGNATIP("100.63.255.255")).toBe(false)
    expect(isCGNATIP("100.128.0.0")).toBe(false)
  })
})

describe("isMDNSName", () => {
  it("detects .local names only", () => {
    expect(isMDNSName("1234abcd-1234.local")).toBe(true)
    expect(isMDNSName("192.168.1.1")).toBe(false)
  })
})
