/**
 * Motion utilities that respect the user's prefers-reduced-motion setting.
 */

/**
 * Checks whether the user has requested reduced motion via their OS or
 * browser accessibility settings.
 *
 * Returns `true` when reduced motion is preferred **or** when the
 * `matchMedia` API is unavailable (SSR / non-browser environments), so
 * animations degrade safely.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns the supplied `base` duration in milliseconds when motion is
 * allowed, or `0` when the user prefers reduced motion.
 *
 * Usage:
 * ```ts
 * element.style.transitionDuration = `${getTransitionDuration(300)}ms`;
 * ```
 *
 * @param base - The desired transition/animation duration in milliseconds.
 * @returns `base` if motion is allowed, otherwise `0`.
 */
export function getTransitionDuration(base: number): number {
  return prefersReducedMotion() ? 0 : base;
}
