import { DetectionError } from "./types"

/** Error thrown by `detectNAT` for failures it can classify itself. */
export class NATDetectionError extends Error {
  readonly type: DetectionError

  constructor(type: DetectionError, message?: string) {
    super(message ?? type)
    this.name = "NATDetectionError"
    this.type = type
  }
}

/**
 * Map any thrown value to a `DetectionError`. Typed errors are passed through;
 * everything else is classified heuristically from its message.
 */
export function toDetectionError(err: unknown): DetectionError {
  if (err instanceof NATDetectionError) return err.type
  const message = err instanceof Error ? err.message : String(err)
  if (/permission/i.test(message)) return DetectionError.PERMISSION_DENIED
  if (/RTCPeerConnection|not supported/i.test(message)) {
    return DetectionError.BROWSER_UNSUPPORTED
  }
  return DetectionError.UNKNOWN
}
