"use client"

import Moon02Icon from "@hugeicons/core-free-icons/Moon02Icon"
import Sun03Icon from "@hugeicons/core-free-icons/Sun03Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTheme } from "next-themes"
import { useCallback, useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export type TransitionVariant =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "rectangle"
  | "star"

interface AnimatedThemeTogglerProps extends Omit<
  React.ComponentPropsWithoutRef<"button">,
  "style"
> {
  duration?: number
  variant?: TransitionVariant
  /** When true, the transition expands from the viewport center instead of the button center. */
  fromCenter?: boolean
  style?: React.CSSProperties
}

const VT_FLAG = "magicuiThemeVt"
const VT_DURATION_VAR = "--magicui-theme-toggle-vt-duration"
const VT_CLIP_FROM_VAR = "--magicui-theme-vt-clip-from"

function polygonCollapsed(point: string, vertexCount: number): string {
  const pairs = Array.from({ length: vertexCount }, () => point).join(", ")
  return `polygon(${pairs})`
}

// All coordinates are percentages of the snapshot reference box: Chrome
// renders absolute px clip-path coordinates on ::view-transition-new(root)
// unscaled on fractional display scales (e.g. Windows 150%) for the first
// transition after load, so px values land at the wrong position.
function getThemeTransitionClipPaths(
  variant: TransitionVariant,
  cx: number,
  cy: number,
  maxRadius: number,
  viewportWidth: number,
  viewportHeight: number
): [string, string] {
  const toX = (x: number) => `${(x / viewportWidth) * 100}%`
  const toY = (y: number) => `${(y / viewportHeight) * 100}%`
  const point = (x: number, y: number) => `${toX(x)} ${toY(y)}`
  // circle() percentage radii resolve against hypot(w, h) / sqrt(2) of the reference box.
  const toRadius = (r: number) =>
    `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`

  switch (variant) {
    case "square": {
      const halfW = Math.max(cx, viewportWidth - cx)
      const halfH = Math.max(cy, viewportHeight - cy)
      const halfSide = Math.max(halfW, halfH) * 1.05
      const end = [
        point(cx - halfSide, cy - halfSide),
        point(cx + halfSide, cy - halfSide),
        point(cx + halfSide, cy + halfSide),
        point(cx - halfSide, cy + halfSide),
      ].join(", ")
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`]
    }
    case "triangle": {
      const scale = maxRadius * 2.2
      const dx = (Math.sqrt(3) / 2) * scale
      const verts = [
        point(cx, cy - scale),
        point(cx + dx, cy + 0.5 * scale),
        point(cx - dx, cy + 0.5 * scale),
      ].join(", ")
      return [polygonCollapsed(point(cx, cy), 3), `polygon(${verts})`]
    }
    case "diamond": {
      // Slightly larger than the circle radius so axis-aligned coverage matches the circle reveal.
      const R = maxRadius * Math.SQRT2
      const end = [
        point(cx, cy - R),
        point(cx + R, cy),
        point(cx, cy + R),
        point(cx - R, cy),
      ].join(", ")
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`]
    }
    case "hexagon": {
      const R = maxRadius * Math.SQRT2
      const verts: string[] = []
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3
        verts.push(point(cx + R * Math.cos(a), cy + R * Math.sin(a)))
      }
      return [
        polygonCollapsed(point(cx, cy), 6),
        `polygon(${verts.join(", ")})`,
      ]
    }
    case "rectangle": {
      const halfW = Math.max(cx, viewportWidth - cx)
      const halfH = Math.max(cy, viewportHeight - cy)
      const end = [
        point(cx - halfW, cy - halfH),
        point(cx + halfW, cy - halfH),
        point(cx + halfW, cy + halfH),
        point(cx - halfW, cy + halfH),
      ].join(", ")
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`]
    }
    case "star": {
      // Small overscan so the last frames never leave a 1px seam before the transition group ends.
      const R = maxRadius * Math.SQRT2 * 1.03
      const innerRatio = 0.42
      const starPolygon = (radius: number) => {
        const verts: string[] = []
        for (let i = 0; i < 5; i++) {
          const outerA = -Math.PI / 2 + (i * 2 * Math.PI) / 5
          verts.push(
            point(
              cx + radius * Math.cos(outerA),
              cy + radius * Math.sin(outerA)
            )
          )
          const innerA = outerA + Math.PI / 5
          verts.push(
            point(
              cx + radius * innerRatio * Math.cos(innerA),
              cy + radius * innerRatio * Math.sin(innerA)
            )
          )
        }
        return `polygon(${verts.join(", ")})`
      }
      const startR = Math.max(2, R * 0.025)
      return [starPolygon(startR), starPolygon(R)]
    }
    default:
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ]
  }
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  variant = "circle",
  fromCenter = false,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isTransitioningRef = useRef(false)
  const activeAnimRef = useRef<Animation | null>(null)

  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    setMounted(true)
  }, [])

  const cancelAnim = useCallback(() => {
    activeAnimRef.current?.cancel()
    activeAnimRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      cancelAnim()
      const root = document.documentElement
      if (root.dataset[VT_FLAG] !== "active") return
      delete root.dataset[VT_FLAG]
      root.style.removeProperty(VT_DURATION_VAR)
      root.style.removeProperty(VT_CLIP_FROM_VAR)
    }
  }, [cancelAnim])

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current
    const root = document.documentElement
    if (
      !button ||
      isTransitioningRef.current ||
      root.dataset[VT_FLAG] === "active"
    )
      return

    const newTheme = isDark ? "light" : "dark"

    const applyTheme = () => {
      // Toggle the class (and color-scheme) synchronously so the View
      // Transitions API snapshots the new theme inside the callback;
      // next-themes owns persistence and syncs useTheme() subscribers.
      root.classList.toggle("dark", newTheme === "dark")
      root.style.colorScheme = newTheme
      setTheme(newTheme)
    }

    if (typeof document.startViewTransition !== "function") {
      applyTheme()
      return
    }

    // innerWidth/innerHeight (not visualViewport): percentages must resolve
    // against the snapshot reference box, which includes classic scrollbars.
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x: number
    let y: number
    if (fromCenter) {
      x = viewportWidth / 2
      y = viewportHeight / 2
    } else {
      const { top, left, width, height } = button.getBoundingClientRect()
      x = left + width / 2
      y = top + height / 2
    }

    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    )

    const clipPath = getThemeTransitionClipPaths(
      variant,
      x,
      y,
      maxRadius,
      viewportWidth,
      viewportHeight
    )

    root.dataset[VT_FLAG] = "active"
    root.style.setProperty(VT_DURATION_VAR, `${duration}ms`)
    // Pin the collapsed clip-path via CSS so Firefox does not paint the new
    // theme unclipped between snapshot and the ready.then() JS animation.
    root.style.setProperty(VT_CLIP_FROM_VAR, clipPath[0])

    const cleanup = () => {
      isTransitioningRef.current = false
      delete root.dataset[VT_FLAG]
      root.style.removeProperty(VT_DURATION_VAR)
      root.style.removeProperty(VT_CLIP_FROM_VAR)
      cancelAnim()
    }

    isTransitioningRef.current = true
    const transition = document.startViewTransition(() => {
      flushSync(applyTheme)
    })
    transition.finished.finally(cleanup).catch(() => {})

    transition.ready
      .then(() => {
        activeAnimRef.current = root.animate(
          { clipPath },
          {
            duration,
            // Star: linear avoids easing overshoot that fights polygon interpolation at t→1.
            easing: variant === "star" ? "linear" : "ease-in-out",
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)",
          }
        )
      })
      .catch(() => {})
  }, [isDark, setTheme, duration, variant, fromCenter, cancelAnim])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon-sm"
        className={cn("rounded-full", className)}
        disabled
        {...props}
      >
        <HugeiconsIcon icon={Sun03Icon} />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      ref={buttonRef}
      variant="outline"
      size="icon-sm"
      onClick={toggleTheme}
      className={cn("rounded-full", className)}
      aria-label="Toggle theme"
      {...props}
    >
      {isDark ? (
        <HugeiconsIcon icon={Sun03Icon} />
      ) : (
        <HugeiconsIcon icon={Moon02Icon} />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
