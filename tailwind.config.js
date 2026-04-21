export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-rubik)", "sans-serif"],
        rubik: ["var(--font-rubik)", "sans-serif"],
      },
      colors: {
        primary: "#4E81C2",
        primaryHover: "#3A6BA8",
      },
      fontSize: {
        "h1-lg": ["42px", { lineHeight: "1.1" }],
        h1: ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "h1-sm": ["28px", { lineHeight: "1.2" }],
        h2: ["24px", { lineHeight: "1.3" }],
        h3: ["20px", { lineHeight: "1.4" }],
        "h3-sm": ["16px", { lineHeight: "1.4" }],
        "body-lg": ["14px", { lineHeight: "1.5" }],
        body: ["13px", { lineHeight: "1.5" }],
        "body-sm": ["12px", { lineHeight: "1.5" }],
        label: ["11px", { lineHeight: "1.2" }],
        caption: ["10px", { lineHeight: "1.4" }],
        micro: ["9px", { lineHeight: "1.4" }],
      },
      keyframes: {
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};