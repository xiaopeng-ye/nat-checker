import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import RefreshCwIcon from "@hugeicons/core-free-icons/RefreshCwIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import type { DetectionError } from "@workspace/nat-detection"
import { getErrorMessages } from "@/lib/i18n"
import { m } from "@/paraglide/messages.js"

interface ErrorDisplayProps {
  error: {
    type: DetectionError
    message: string
  }
  onRetry: () => void
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const { title, message, tips } = getErrorMessages(error.type)

  return (
    <div className="w-full space-y-4" role="alert" aria-live="assertive">
      <Alert variant="destructive">
        <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" />
        <AlertTitle className="text-sm sm:text-base">{title}</AlertTitle>
        <AlertDescription className="text-xs sm:text-sm">
          {message}
        </AlertDescription>
      </Alert>

      <section
        className="space-y-2 rounded-lg border bg-card p-3 sm:space-y-3 sm:p-4"
        aria-label={m.uiStrings_troubleshootingTips()}
      >
        <h3 className="text-xs font-medium sm:text-sm">
          {m.uiStrings_troubleshootingTips()}
        </h3>
        <ul className="list-inside list-disc space-y-1 pl-1 text-xs text-muted-foreground sm:text-sm">
          {tips.map((tip) => (
            <li key={tip} className="leading-relaxed">
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <Button
        onClick={onRetry}
        variant="outline"
        className="w-full text-sm sm:text-base"
        aria-label={m.uiStrings_retestNATType()}
      >
        <HugeiconsIcon
          icon={RefreshCwIcon}
          aria-hidden="true"
          data-icon="inline-start"
        />
        {m.uiStrings_retestNATType()}
      </Button>
    </div>
  )
}
