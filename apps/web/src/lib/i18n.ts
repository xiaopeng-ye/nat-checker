/**
 * Translation helpers on top of the compiled Paraglide messages.
 *
 * Paraglide exposes every message as a compile-time function (`m.key()`).
 * Some parts of the UI need locale-independent *dynamic* lookups (NAT type
 * keyed by an enum value, error type keyed by an enum value, arrays of
 * strings), which these helpers provide.
 *
 * The dynamic lookup goes through an index signature, so a key that does not
 * exist compiles to `undefined` at runtime. The helpers below therefore
 * return `string | undefined` and callers decide how to handle gaps (e.g.
 * shorter lists in some locales).
 */
import { m } from "@/paraglide/messages"
import type { DetectionError } from "@workspace/nat-detection"

/** Every error type has at most 3 tips (PERMISSION_DENIED has 2). */
const MAX_LIST_ITEMS = 3

function messageFn(key: string): (() => string) | undefined {
  const fns = m as unknown as Record<string, (() => string) | undefined>
  const fn = fns[key]
  return typeof fn === "function" ? fn : undefined
}

/**
 * Compile-time-safe dynamic message lookup for enum-keyed messages such as
 * `natTypes_${NATType}_name`, where every enum value is guaranteed to have a
 * corresponding message. Returns undefined only for a missing translation.
 */
export function lookupMessage(key: string): string | undefined {
  return messageFn(key)?.()
}

/** All messages of a numbered list (`${prefix}_0`, `${prefix}_1`, ...). */
export function lookupMessageList(prefix: string, max: number): string[] {
  return Array.from({ length: max }, (_, i) =>
    lookupMessage(`${prefix}_${i}`)
  ).filter((text): text is string => text !== undefined)
}

/** Title/message/tips for a detection error, looked up by error type. */
export function getErrorMessages(type: DetectionError): {
  title: string
  message: string
  tips: string[]
} {
  const title = lookupMessage(`errorMessages_${type}_title`) ?? type
  const message = lookupMessage(`errorMessages_${type}_message`) ?? ""
  const tips = lookupMessageList(`errorMessages_${type}_tip`, MAX_LIST_ITEMS)
  return { title, message, tips }
}
