/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular'],
      },
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1f2937',
          900: '#0f172a',
        },
        sand: {
          50: '#fef9f3',
          100: '#fdf2e9',
          200: '#f7e5d3',
          300: '#f1d7bd',
          400: '#e7bfa0',
          500: '#d9a678',
          600: '#b88450',
          700: '#8c6438',
          800: '#5f4325',
          900: '#3a2a19',
        },
      },
      boxShadow: {
        'soft': '0 10px 30px -20px rgba(15, 23, 42, 0.45)',
        'lift': '0 18px 45px -30px rgba(15, 23, 42, 0.6)',
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(circle at top, rgba(16, 185, 129, 0.18), transparent 55%)',
      },
    },
  },
  plugins: [],
}
