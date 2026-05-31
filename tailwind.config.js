/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        studio: {
          ink: "#071426",
          navy: "#0a2342",
          panel: "#0d2c4f",
          line: "#1f73a8",
          blue: "#43b8ff",
          teal: "#26d6a3",
          gold: "#f6b84a",
          warning: "#f97316",
          rose: "#e96d8a"
        }
      },
      fontFamily: {
        interface: [
          "Inter",
          "Noto Sans Thai",
          "Tahoma",
          "system-ui",
          "sans-serif"
        ]
      },
      boxShadow: {
        pixel: "4px 4px 0 #03101f",
        glow: "0 0 24px rgba(67, 184, 255, 0.18)"
      }
    }
  },
  plugins: []
};
