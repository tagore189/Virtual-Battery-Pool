/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        grid: {
          dark: "#0a0e17",
          card: "#121824",
          border: "#1e293b",
          accent: "#38bdf8",
        },
        energy: {
          charge: "#10b981",    // Green
          discharge: "#ef4444", // Red
          idle: "#f59e0b",      // Amber
          fault: "#dc2626",     // Crimson
        }
      }
    },
  },
  plugins: [],
}
