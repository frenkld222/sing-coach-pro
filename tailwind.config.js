/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        pulseBeat: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '70%': { transform: 'scale(1.25)', opacity: '0.35' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      animation: {
        pulseBeat: 'pulseBeat 600ms ease-out'
      }
    },
  },
  plugins: [],
};
