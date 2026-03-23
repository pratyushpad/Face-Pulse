/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#0a0a0a',
        surface: '#111111',
        elevated: '#1a1a1a',
        'border-subtle': 'rgba(255,255,255,0.07)',
        'border-default': 'rgba(255,255,255,0.12)',
        'text-primary': '#f5f5f5',
        'text-secondary': '#a3a3a3',
        'text-muted': '#525252',
        accent: '#60a5fa',
        'accent-hover': '#3b82f6',
        danger: '#ef4444',
        success: '#22c55e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      maxWidth: {
        content: '1280px',
      },
      spacing: {
        'nav': '56px',
      },
    },
  },
  plugins: [],
}
