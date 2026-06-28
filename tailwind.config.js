/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Grafite — base neutra escura da marca Trudon
        graphite: {
          50: '#f6f7f8',
          100: '#eceef0',
          200: '#d4d8dd',
          300: '#aeb6bf',
          400: '#828d9b',
          500: '#647082',
          600: '#4f5a6b',
          700: '#414a58',
          800: '#2b313b',
          900: '#1b1f26',
          950: '#101319',
        },
        // Dourado — acento da marca (extraído do logo)
        gold: {
          50: '#fbf8ef',
          100: '#f5edd3',
          200: '#ead8a3',
          300: '#dfbe6f',
          400: '#d4a648',
          500: '#c8902f',
          600: '#b07523',
          700: '#925a20',
          800: '#784820',
          900: '#653c1e',
          950: '#3a1f0d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 19, 25, 0.06), 0 1px 2px rgba(16, 19, 25, 0.04)',
        'card-hover': '0 8px 24px rgba(16, 19, 25, 0.10)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
