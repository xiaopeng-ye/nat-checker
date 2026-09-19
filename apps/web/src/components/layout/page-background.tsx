import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Per-route decorative background. Rendered as the first child of a page so
 * it paints behind everything else without any z-index; the positioned
 * wrapper around <Outlet /> in the root layout is the containing block.
 *
 * - `grid`: animated grid for the sparse, centered tool page.
 * - `glow`: static top glow for dense reading pages, where pattern lines
 *   would compete with card borders and table rules.
 */
export function PageBackground({ variant }: { variant: "grid" | "glow" }) {
  if (variant === "grid") {
    return (
      <AnimatedGridPattern
        numSquares={24}
        maxOpacity={0.12}
        duration={3}
        className="[mask-image:radial-gradient(720px_circle_at_50%_0%,white,transparent)] fill-muted-foreground/25 stroke-muted-foreground/20"
      />
    )
  }

  // Starts above <main> so the glow also sits behind the transparent, sticky
  // header strip; otherwise its top edge shows as a hard line under the nav.
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 -top-24 h-[576px]",
        "bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,var(--tw-gradient-from),transparent_70%)] from-primary/8"
      )}
    />
  )
}
