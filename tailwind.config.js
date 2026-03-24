/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-ember': {
          50: '#fef3e2',
          100: '#fde4c3',
          200: '#fbc987',
          300: '#f9a84b',
          400: '#f78728',
          500: '#f56505',
          600: '#ea5504',
          700: '#c44306',
          800: '#993409',
          900: '#7f2c0a',
          950: '#461403',
        },
      },
    },
  },
  plugins: [],
}
