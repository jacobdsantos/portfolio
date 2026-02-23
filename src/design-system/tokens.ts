/**
 * Design system semantic tokens.
 * Maps directly to the Tailwind config colors defined in tailwind.config.mjs.
 * Use these constants when you need programmatic access to theme values
 * (e.g., in React islands, canvas drawing, or dynamic style computation).
 */

// ---------------------------------------------------------------------------
// Color constants
// ---------------------------------------------------------------------------

export const colors = {
  bg: {
    primary: '#08090e',
    secondary: '#0e1016',
    card: '#12141c',
    hover: '#1a1d28',
    surface: '#161922',
  },
  accent: {
    primary: '#f0a63a',
    secondary: '#8b7cf7',
    tertiary: '#4cc9f0',
    glow: '#ffc857',
    warning: '#eab308',
    danger: '#ff6b6b',
    success: '#34d399',
    hot: '#f87171',
  },
  text: {
    primary: '#f0f0f5',
    secondary: '#8a8f9e',
    muted: '#4d5263',
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing scale (px values following a 4 px base grid)
// ---------------------------------------------------------------------------

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',
} as const;

// ---------------------------------------------------------------------------
// Typography scale
// ---------------------------------------------------------------------------

export const fontFamily = {
  sans: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  display: "'Urbanist', system-ui, sans-serif",
} as const;

export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1' }],
} as const;

export const fontWeight = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

export const shadows = {
  card: '0 0 0 1px rgba(240, 166, 58, 0.04), 0 20px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  cardHover: '0 0 30px -10px rgba(240, 166, 58, 0.1)',
  glow: '0 0 25px rgba(240, 166, 58, 0.3)',
  modal: '0 0 80px -20px rgba(240, 166, 58, 0.15)',
} as const;

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '400ms cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

// ---------------------------------------------------------------------------
// Z-index scale
// ---------------------------------------------------------------------------

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  toast: 60,
  skipLink: 100,
} as const;

// ---------------------------------------------------------------------------
// Breakpoints (matches Tailwind defaults)
// ---------------------------------------------------------------------------

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ---------------------------------------------------------------------------
// Unified semantic tokens object
// ---------------------------------------------------------------------------

export const tokens = {
  colors,
  spacing,
  fontFamily,
  fontSize,
  fontWeight,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
} as const;

export type Tokens = typeof tokens;

export default tokens;
