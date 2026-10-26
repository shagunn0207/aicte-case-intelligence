/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aicte: {
          navy: {
            DEFAULT: '#0f2744',
            light: '#1b3b64',
            dark: '#09182b',
            50: '#f0f5fa',
            100: '#e1ecf5',
            200: '#c3d8ec',
            800: '#1b3b64',
            900: '#0f2744',
            950: '#081423'
          },
          blue: {
            DEFAULT: '#1d5fa8',
            hover: '#154880',
            light: '#e9f1f9',
            border: '#93bce3',
            500: '#1d5fa8',
            600: '#164d89'
          },
          saffron: {
            DEFAULT: '#e66b19',
            light: '#fff4eb',
            border: '#f6ad7b'
          },
          amber: {
            DEFAULT: '#b45309',
            bg: '#fef3c7',
            border: '#fde68a'
          },
          green: {
            DEFAULT: '#047857',
            bg: '#d1fae5',
            border: '#a7f3d0'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}
