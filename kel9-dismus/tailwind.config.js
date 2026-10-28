/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          500: "#e11d48",
          600: "#be123c",
          700: "#9f1239",
          900: "#881337",
        },
      },
      boxShadow: {
        soft: "0 8px 30px rgba(80, 20, 30, 0.06)",
      },
    },
  },
  plugins: [],
};