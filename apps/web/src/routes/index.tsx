import ShieldCheckIcon from "@hugeicons/core-free-icons/ShieldCheckIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { BorderBeam } from "@/components/magicui/border-beam"
import { ShineBorder } from "@/components/magicui/shine-border"
import { PageBackground } from "@/components/layout/page-background"
import { NATDetector } from "@/components/nat-checker/detector"
import { useNATDetection } from "@/hooks/use-nat-detection"
import { DetectionState } from "@workspace/nat-detection"
import { buildPageHead } from "@/lib/seo"
import { m } from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

export const Route = createFileRoute("/")({
  head: () => buildPageHead({ path: `/${getLocale()}` }),
  component: App,
})

/** Renders the first "NAT" in the localized title as a monospace code token. */
function HighlightedTitle({ title }: { title: string }) {
  const index = title.indexOf("NAT")
  if (index === -1) return title
  return (
    <>
      {title.slice(0, index)}
      <span className="inline-block rounded-md bg-muted px-2 py-1 align-baseline font-mono leading-none tracking-tighter text-(--beam-from)">
        NAT
      </span>
      {title.slice(index + 3)}
    </>
  )
}

function App() {
  const { result, runDetection } = useNATDetection()
  const isDetecting = result.state === DetectionState.DETECTING
  const isSuccess = result.state === DetectionState.SUCCESS
  const isIdle = result.state === DetectionState.IDLE

  return (
    <>
      <PageBackground variant="grid" />
      <div className="container mx-auto max-w-5xl px-4 py-12 sm:py-16">
        {/*
        Hero collapses once the first detection starts. The grid-rows trick
        animates height from auto to 0 without measuring the content.
      */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out-strong motion-reduce:transition-[opacity]",
            isIdle
              ? "mb-10 grid-rows-[1fr] opacity-100"
              : "mb-0 grid-rows-[0fr] opacity-0"
          )}
          aria-hidden={!isIdle}
          inert={!isIdle}
        >
          <header className="mx-auto min-h-0 max-w-2xl space-y-4 overflow-hidden text-center">
            <Badge
              variant="outline"
              className="h-6 gap-1.5 bg-background px-2.5"
            >
              <HugeiconsIcon icon={ShieldCheckIcon} aria-hidden="true" />
              {m.uiStrings_clientSideBadge()}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              <HighlightedTitle title={m.uiStrings_appTitle()} />
            </h1>
            <p className="text-lg leading-relaxed text-balance text-muted-foreground">
              {m.uiStrings_appDescription()}
            </p>
          </header>
        </div>

        {isIdle ? (
          // No card before the first run: the hero and the CTA stand alone.
          <div className="mx-auto max-w-2xl">
            <NATDetector result={result} onRunDetection={runDetection} />
          </div>
        ) : (
          <Card className="relative mx-auto max-w-2xl animate-in duration-250 ease-out-strong fade-in-0 slide-in-from-bottom-[6px] motion-reduce:slide-in-from-bottom-0">
            {isDetecting && (
              <BorderBeam
                size={200}
                duration={8}
                className="animate-in duration-200 ease-out-strong fade-in-0"
              />
            )}
            {isSuccess && (
              <ShineBorder
                className="animate-in duration-200 ease-out-strong fade-in-0"
                shineColor={[
                  "var(--shine-1)",
                  "var(--shine-2)",
                  "var(--shine-3)",
                ]}
              />
            )}
            <CardContent>
              <NATDetector result={result} onRunDetection={runDetection} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
