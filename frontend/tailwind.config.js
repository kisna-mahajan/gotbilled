/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#111111",
          700: "#333333",
          500: "#666666",
          300: "#999999",
          200: "#cccccc",
          100: "#e5e5e5",
          50: "#f5f5f5",
        },
        pop: {
          red: "#e63946",
          green: "#2a9d8f",
          amber: "#e9c46a",
          blue: "#457b9d",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
