import { useState, useEffect, useCallback } from 'react';

/**
 * Animated tagline rotator with typing effect.
 * Cycles through role descriptions with a cursor blink.
 */

const TAGLINES = [
  'Threat Researcher',
  'Tool Builder',
  'International Trainer',
  'Published Author',
  'Security Automator',
];

const TYPING_SPEED = 80;
const DELETING_SPEED = 40;
const PAUSE_DURATION = 2500;

export default function TaglineRotator() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const tick = useCallback(() => {
    const fullText = TAGLINES[currentIndex];

    if (isPaused) return;

    if (!isDeleting) {
      // Typing
      if (displayText.length < fullText.length) {
        setDisplayText(fullText.slice(0, displayText.length + 1));
      } else {
        // Finished typing, pause
        setIsPaused(true);
        setTimeout(() => {
          setIsPaused(false);
          setIsDeleting(true);
        }, PAUSE_DURATION);
      }
    } else {
      // Deleting
      if (displayText.length > 0) {
        setDisplayText(displayText.slice(0, -1));
      } else {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % TAGLINES.length);
      }
    }
  }, [currentIndex, displayText, isDeleting, isPaused]);

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayText(TAGLINES[0]);
      return;
    }

    const speed = isDeleting ? DELETING_SPEED : TYPING_SPEED;
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [tick, isDeleting]);

  return (
    <span className="inline-flex items-center" aria-label={TAGLINES[currentIndex]}>
      <span className="bg-gradient-to-r from-accent-primary via-accent-tertiary to-accent-secondary bg-clip-text text-transparent">
        {displayText}
      </span>
      <span
        className="inline-block w-[2px] h-[1.1em] ml-0.5 bg-accent-primary animate-blink"
        aria-hidden="true"
      />
    </span>
  );
}
