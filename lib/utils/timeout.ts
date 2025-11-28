/**
 * Wraps a promise with a timeout
 *
 * @param promise - The promise to wrap
 * @param ms - Timeout in milliseconds
 * @param errorMessage - Error message to throw on timeout
 * @returns Promise that rejects if timeout is exceeded
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetch('https://api.example.com'),
 *   5000,
 *   'Request timed out after 5 seconds'
 * );
 * ```
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms),
    ),
  ]);
}
