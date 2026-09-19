import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { lookupMessage } from "@/lib/i18n"
import { NAT_TYPE_META, TONE_SURFACE_CLASS } from "@/lib/nat-type-meta"
import type { NATType } from "@workspace/nat-detection"
import { m } from "@/paraglide/messages.js"
import { NatImpactGrid } from "./nat-impact-grid"
import { NatTypeDetails } from "./nat-type-details"

export function NatTypeCard({
  natType,
  className,
}: {
  natType: NATType
  className?: string
}) {
  const meta = NAT_TYPE_META[natType]
  const name = lookupMessage(`natTypes_${natType}_name`) ?? natType
  const definition = lookupMessage(`natTypes_${natType}_definition`)

  return (
    <Card className={className} id={natType}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              TONE_SURFACE_CLASS[meta.tone]
            )}
            aria-hidden="true"
          >
            <HugeiconsIcon icon={meta.icon} className="size-5" />
          </span>
          <div className="min-w-0 space-y-1.5">
            <CardTitle className="text-lg leading-tight">
              <h3>{name}</h3>
            </CardTitle>
            <Badge variant={meta.detectable ? "secondary" : "outline"}>
              {meta.detectable
                ? m.uiStrings_badgeDetectable()
                : m.uiStrings_badgeEducational()}
            </Badge>
          </div>
        </div>
        <CardDescription className="leading-relaxed">
          {definition}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NatImpactGrid natType={natType} variant="compact" />
        <NatTypeDetails natType={natType} />
      </CardContent>
      {meta.href && (
        <CardFooter className="border-t">
          <a
            href={meta.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2.5 text-muted-foreground"
            )}
          >
            {m.uiStrings_learnMore()}
            <HugeiconsIcon icon={ArrowUpRight01Icon} data-icon="inline-end" />
          </a>
        </CardFooter>
      )}
    </Card>
  )
}
