/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0b1220',
          800: '#101a2e',
          700: '#17253f',
        },
      },
    },
  },
  plugins: [],
}
