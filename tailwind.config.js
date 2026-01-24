/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{html,js,ts,jsx,tsx}',
    './components/**/*.{html,js,ts,jsx,tsx}',
    './app/**/*.{html,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      color: {
        'mb100': "#E1E4ED",
        'mb300': "#939AC9",

      },
    },
  },
  plugins: [],
}

