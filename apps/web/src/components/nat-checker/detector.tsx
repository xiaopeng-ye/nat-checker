import PlayIcon from "@hugeicons/core-free-icons/PlayIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { m } from "@/paraglide/messages.js"
import { ShimmerButton } from "@/components/magicui/shimmer-button"
import { DetectionState } from "@workspace/nat-detection"
import type { DetectionResult } from "@workspace/nat-detection"
import { ErrorDisplay } from "./error-display"
import { LoadingIndicator } from "./loading-indicator"
import { ResultDisplay } from "./result-display"

export interface NATDetectorProps {
  result: DetectionResult
  onRunDetection: () => void
}

/**
 * Enter-only reveal for each detection state. Keyframes are fine here: the
 * swap is never interrupted, and there is no exit animation to retarget.
 */
const STATE_REVEAL_CLASS =
  "animate-in fade-in-0 slide-in-from-bottom-[6px] duration-250 ease-out-strong motion-reduce:slide-in-from-bottom-0"

export function NATDetector({ result, onRunDetection }: NATDetectorProps) {
  // `key` remounts the wrapper on every state change so the reveal replays.
  return (
    <div key={result.state} className={STATE_REVEAL_CLASS}>
      <DetectorContent result={result} onRunDetection={onRunDetection} />
    </div>
  )
}

function DetectorContent({ result, onRunDetection }: NATDetectorProps) {
  switch (result.state) {
    case DetectionState.IDLE:
      return (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <p className="text-sm text-muted-foreground sm:text-base">
            {m.uiStrings_readyToDetect()}
          </p>
          <ShimmerButton
            onClick={onRunDetection}
            className="gap-2 text-sm font-medium sm:text-base"
          >
            <HugeiconsIcon
              icon={PlayIcon}
              className="size-4"
              aria-hidden="true"
            />
            {m.uiStrings_startDetection()}
          </ShimmerButton>
        </div>
      )
    case DetectionState.DETECTING:
      return <LoadingIndicator />
    case DetectionState.SUCCESS:
      return <ResultDisplay result={result} onRetest={onRunDetection} />
    case DetectionState.ERROR:
      return result.error ? (
        <ErrorDisplay error={result.error} onRetry={onRunDetection} />
      ) : null
  }
}
