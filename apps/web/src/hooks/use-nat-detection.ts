import { useCallback, useRef, useState } from "react"
import {
  classifyNAT,
  detectNAT,
  DetectionState,
  toDetectionError,
} from "@workspace/nat-detection"
import type { DetectionResult } from "@workspace/nat-detection"

/**
 * Minimum time the "detecting" state stays on screen. Detection against
 * nearby STUN servers often finishes in ~300 ms, which is too short for the
 * progress transcript to be readable; the real result is never delayed by
 * more than this.
 */
const MIN_DETECTING_MS = 1800

function emptyResult(state: DetectionState, startedAt: Date): DetectionResult {
  return {
    state,
    natType: null,
    startedAt,
    completedAt: null,
    durationMs: null,
    ipInfo: null,
    portMapping: null,
    error: null,
    confidence: null,
    confidenceReason: null,
  }
}

export function useNATDetection() {
  const [result, setResult] = useState<DetectionResult>(() =>
    emptyResult(DetectionState.IDLE, new Date())
  )
  // Incremented per run so a superseded run cannot overwrite a newer result.
  const runIdRef = useRef(0)

  const runDetection = useCallback(async () => {
    const runId = ++runIdRef.current
    const startedAt = new Date()
    setResult(emptyResult(DetectionState.DETECTING, startedAt))

    const minDisplay = new Promise<void>((resolve) =>
      setTimeout(resolve, MIN_DETECTING_MS)
    )

    try {
      const { ipInfo, portMapping, confidence, confidenceReason } =
        await detectNAT()
      await minDisplay
      if (runId !== runIdRef.current) return
      const natType = classifyNAT(ipInfo, portMapping, confidenceReason)
      const completedAt = new Date()

      setResult({
        state: DetectionState.SUCCESS,
        natType,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        ipInfo,
        portMapping,
        error: null,
        confidence,
        confidenceReason,
      })
    } catch (err: unknown) {
      await minDisplay
      if (runId !== runIdRef.current) return
      const completedAt = new Date()
      setResult({
        ...emptyResult(DetectionState.ERROR, startedAt),
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        error: {
          type: toDetectionError(err),
          message: err instanceof Error ? err.message : String(err),
        },
      })
    }
  }, [])

  return { result, runDetection }
}
