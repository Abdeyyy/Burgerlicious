/** @type {import('tailwindcss').Config} */
export default {
  // Bagian "content" ini sangat penting untuk Tailwind. 
  // Tailwind akan membaca/mencari semua file yang terdaftar di bawah ini, lalu memindai class CSS apa saja yang kita ketik (misal: bg-red-500, pt-20).
  // Setelah itu, barulah Tailwind akan membangkitkan/meng-generate file output.css dengan class-class yang terdeteksi saja.
  content: [
    "./index.html",
    "./login.html",
    "./register.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    // Penambahan instruksi pindai khusus untuk folder pages tempat kita memisahkan about.html, menu.html, dll.
    "./public/pages/**/*.html",
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
