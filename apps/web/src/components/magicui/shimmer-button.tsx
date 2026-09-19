import React from "react"
import type { ComponentPropsWithoutRef, CSSProperties } from "react"

import { cn } from "@workspace/ui/lib/utils"

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
  className?: string
  children?: React.ReactNode
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      shimmerColor = "var(--shimmer-fg)",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "100px",
      background = "var(--shimmer-bg)",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden [border-radius:var(--radius)] border border-(--shimmer-fg)/10 px-6 py-3 whitespace-nowrap text-(--shimmer-fg) [background:var(--bg)]",
          "transition-transform duration-160 ease-out-strong active:scale-[0.97]",
          className
        )}
        ref={ref}
        {...props}
      >
        {/* spark container */}
        <div
          className={cn(
            "-z-30 blur-[2px]",
            "[container-type:size] absolute inset-0 overflow-visible"
          )}
        >
          {/* spark */}
          <div className="absolute inset-0 [aspect-ratio:1] h-[100cqh] [border-radius:0] [mask:none] motion-safe:animate-shimmer-slide">
            {/* spark before */}
            <div className="absolute -inset-full w-auto [translate:0_0] rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] motion-safe:animate-spin-around" />
          </div>
        </div>
        {children}

        {/* Highlight */}
        <div
          className={cn(
            "absolute inset-0 size-full",

            "rounded-2xl px-4 py-1.5 text-sm font-medium [box-shadow:inset_0_-8px_10px_color-mix(in_oklch,var(--shimmer-fg)_12%,transparent)]",

            // transition
            "ease transition-[box-shadow] duration-200",

            // on hover
            "group-hover:[box-shadow:inset_0_-6px_10px_color-mix(in_oklch,var(--shimmer-fg)_25%,transparent)]",

            // on click
            "group-active:[box-shadow:inset_0_-10px_10px_color-mix(in_oklch,var(--shimmer-fg)_25%,transparent)]"
          )}
        />

        {/* backdrop */}
        <div
          className={cn(
            "absolute [inset:var(--cut)] -z-20 [border-radius:var(--radius)] [background:var(--bg)]"
          )}
        />
      </button>
    )
  }
)

ShimmerButton.displayName = "ShimmerButton"
