/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          light: "rgb(var(--color-ink-light) / <alpha-value>)",
          lighter: "rgb(var(--color-ink-lighter) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--color-gold) / <alpha-value>)",
          bright: "rgb(var(--color-gold-bright) / <alpha-value>)",
          dim: "rgb(var(--color-gold-dim) / <alpha-value>)",
        },
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        vvblue: "#1B2A6B",
        deal: {
          green: "rgb(var(--color-deal-green) / <alpha-value>)",
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