import { useRef } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import type { MotionProps, UseInViewOptions, Variants } from "motion/react"

type MarginType = UseInViewOptions["margin"]

interface BlurFadeProps extends MotionProps {
  children: React.ReactNode
  className?: string
  variant?: {
    hidden: { y: number }
    visible: { y: number }
  }
  duration?: number
  delay?: number
  offset?: number
  direction?: "up" | "down" | "left" | "right"
  inView?: boolean
  inViewMargin?: MarginType
  blur?: string
}

const getFilter = (v: Variants[string]) =>
  typeof v === "function" ? undefined : v.filter

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  offset = 6,
  direction = "down",
  inView = false,
  inViewMargin = "-50px",
  blur = "6px",
  ...props
}: BlurFadeProps) {
  const ref = useRef(null)
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin })
  const isInView = !inView || inViewResult
  // Reduced motion keeps the fade, drops the offset and the blur.
  const reducedMotion = useReducedMotion()
  const axis = direction === "left" || direction === "right" ? "X" : "Y"
  const sign = direction === "right" || direction === "down" ? -1 : 1
  const hiddenTransform = reducedMotion
    ? "none"
    : `translate${axis}(${sign * offset}px)`
  const hiddenBlur = reducedMotion ? "0px" : blur
  const defaultVariants: Variants = {
    hidden: {
      transform: hiddenTransform,
      opacity: 0,
      filter: `blur(${hiddenBlur})`,
    },
    visible: {
      transform: "none",
      opacity: 1,
      filter: `blur(0px)`,
    },
  }
  const combinedVariants = variant ?? defaultVariants

  const hiddenFilter = getFilter(combinedVariants.hidden)
  const visibleFilter = getFilter(combinedVariants.visible)

  const shouldTransitionFilter =
    hiddenFilter != null &&
    visibleFilter != null &&
    hiddenFilter !== visibleFilter

  // No AnimatePresence: the element never leaves the tree, so an exit
  // animation would never run.
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={combinedVariants}
      transition={{
        delay: 0.04 + delay,
        duration,
        ease: [0.23, 1, 0.32, 1],
        ...(shouldTransitionFilter ? { filter: { duration } } : {}),
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
