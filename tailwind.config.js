/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./login.html",
    "./register.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Baloo Bhaijaan 2', 'sans-serif'],
      },
      colors: {
        'primary': '#FF6B35',
        'secondary': '#F7931E',
        'dark': '#1a1a1a',
        'light': '#f5f5f5',
      },
    },
  },
  plugins: [],
}
