/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          haze: '#DCEBF7',
          sky: '#B9D4EC',
          rose: '#F3D9E4',
          cream: '#F7EFE3',
          sage: '#98bfa7', // On track (≥ threshold) - muted sage/teal green
          amber: '#d6a858', // Warning (within 5%) - warm amber/dusty gold
          coral: '#e27b87', // Below threshold - soft but clear rose-red
        }
      }
    },
  },
  plugins: [],
}
