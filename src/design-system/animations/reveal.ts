/**
 * Scroll-triggered reveal animations using IntersectionObserver.
 * Adds/removes a `revealed` class for CSS-driven fade-in effects.
 * Respects the user's prefers-reduced-motion preference.
 */

import { prefersReducedMotion } from './motion';

export interface RevealObserverOptions {
  /** CSS selector for elements to observe. Defaults to `'[data-reveal]'`. */
  selector?: string;
  /** IntersectionObserver root element. Defaults to the viewport (`null`). */
  root?: Element | null;
  /** Root margin string (e.g. `'0px 0px -80px 0px'`). */
  rootMargin?: string;
  /** Visibility threshold (0-1). Defaults to `0.15`. */
  threshold?: number;
  /** If `true`, the reveal class is removed when the element scrolls out of view. Defaults to `false`. */
  resetOnExit?: boolean;
}

/**
 * Creates an `IntersectionObserver` that toggles a `revealed` class on
 * elements matching `options.selector` (default `[data-reveal]`).
 *
 * If the user prefers reduced motion the `revealed` class is applied
 * immediately to every matching element without observing, so content is
 * visible without any animation.
 *
 * Returns a cleanup function that disconnects the observer and can be
 * called in an Astro `<script>` teardown or framework unmount.
 *
 * @example
 * ```ts
 * // In an Astro <script> or island
 * import { createRevealObserver } from '@/design-system/animations/reveal';
 *
 * const cleanup = createRevealObserver({ threshold: 0.2 });
 * // Later: cleanup();
 * ```
 */
export function createRevealObserver(
  options: RevealObserverOptions = {},
): () => void {
  const {
    selector = '[data-reveal]',
    root = null,
    rootMargin = '0px 0px -60px 0px',
    threshold = 0.15,
    resetOnExit = false,
  } = options;

  const elements = document.querySelectorAll<HTMLElement>(selector);

  if (elements.length === 0) {
    return () => {};
  }

  // When reduced motion is preferred, reveal everything immediately.
  if (prefersReducedMotion()) {
    elements.forEach((el) => el.classList.add('revealed'));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          if (!resetOnExit) {
            observer.unobserve(entry.target);
          }
        } else if (resetOnExit) {
          entry.target.classList.remove('revealed');
        }
      }
    },
    { root, rootMargin, threshold },
  );

  elements.forEach((el) => observer.observe(el));

  return () => {
    observer.disconnect();
  };
}
