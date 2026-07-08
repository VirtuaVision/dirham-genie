/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0B10",
          light: "#14141C",
          lighter: "#1D1D28",
        },
        gold: {
          DEFAULT: "#D4AF37",
          bright: "#F4C430",
          dim: "#8A6D1F",
        },
        cream: "#F5F1E8",
        vvblue: "#1B2A6B",
        deal: {
          green: "#2E9E5B",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        sparkle: {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
        smoke: {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.6" },
          "100%": { transform: "translateY(-40px) scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        sparkle: "sparkle 2.4s ease-in-out infinite",
        smoke: "smoke 3s ease-out infinite",
      },
    },
  },
  plugins: [],
};
