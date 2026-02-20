/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#07090f',
          secondary: '#0d1117',
          card: '#131920',
          hover: '#1a2230',
          surface: '#161d27',
        },
        accent: {
          primary: '#00dfa2',
          secondary: '#6c5ce7',
          tertiary: '#00b4d8',
          glow: '#00ffbc',
          warning: '#fbbf24',
          danger: '#ff4757',
          success: '#00dfa2',
          hot: '#ff6b6b',
        },
        text: {
          primary: '#e8edf5',
          secondary: '#8b949e',
          muted: '#545d68',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 223, 162, 0.15)' },
          '100%': { boxShadow: '0 0 25px rgba(0, 223, 162, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': `linear-gradient(rgba(0, 223, 162, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 223, 162, 0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [],
};
