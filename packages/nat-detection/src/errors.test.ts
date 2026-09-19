import { describe, expect, it } from "vitest"
import { NATDetectionError, toDetectionError } from "./errors"
import { DetectionError } from "./types"

describe("toDetectionError", () => {
  it("passes typed errors through", () => {
    expect(
      toDetectionError(new NATDetectionError(DetectionError.STUN_UNREACHABLE))
    ).toBe(DetectionError.STUN_UNREACHABLE)
  })

  it("classifies foreign errors by message", () => {
    expect(toDetectionError(new Error("Permission denied"))).toBe(
      DetectionError.PERMISSION_DENIED
    )
    expect(
      toDetectionError(new Error("RTCPeerConnection is not defined"))
    ).toBe(DetectionError.BROWSER_UNSUPPORTED)
    expect(toDetectionError("boom")).toBe(DetectionError.UNKNOWN)
  })
})
