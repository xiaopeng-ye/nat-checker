import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/magicui/terminal"
import { Spinner } from "@workspace/ui/components/spinner"
import { m } from "@/paraglide/messages.js"

/**
 * Detection progress rendered as a terminal transcript. The steps are
 * illustrative (the engine runs them concurrently); the real signal is the
 * spinner, which stays until the result replaces this component.
 */
export function LoadingIndicator() {
  return (
    <output
      aria-live="polite"
      aria-label={m.uiStrings_detectingNATType()}
      className="flex w-full flex-col gap-4"
    >
      <div className="flex items-center gap-2 text-base font-semibold sm:text-lg">
        <Spinner className="size-4 sm:size-5" aria-hidden="true" />
        <span>{m.uiStrings_detectingNATType()}</span>
      </div>

      <Terminal startOnView={false} className="max-w-none">
        <TypingAnimation duration={25} startOnView={false}>
          $ nat-checker detect --stun
        </TypingAnimation>
        <AnimatedSpan className="text-success">
          ✔ {m.uiStrings_stepConnectingStun()}
        </AnimatedSpan>
        <AnimatedSpan className="text-success">
          ✔ {m.uiStrings_gatheringICECandidates()}
        </AnimatedSpan>
        <AnimatedSpan className="text-info">
          ➜ {m.uiStrings_stepComparingMappings()}
        </AnimatedSpan>
        <AnimatedSpan className="text-muted-foreground">
          {m.uiStrings_analyzingNetwork()}
        </AnimatedSpan>
      </Terminal>

      <p className="text-xs text-muted-foreground sm:text-sm">
        {m.uiStrings_detectionTimeInfo()}
      </p>
    </output>
  )
}
