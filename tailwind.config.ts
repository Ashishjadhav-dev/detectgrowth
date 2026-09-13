import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f7f8fc",
        surface: "#ffffff",
        elevated: "#fbfbfe",
        border: "#e7e9f2",
        ink: "#141827",
        muted: "#667085",
        subtle: "#98a2b3",
        primary: { DEFAULT: "#5b35e6", hover: "#4f2bce", soft: "#f0edff" },
        success: "#16a36a",
        warning: "#d99000",
        danger: "#d64545",
        info: "#2f6fed",
        sidebar: "#111a2d"
      },
      boxShadow: {
        soft: "0 8px 28px rgba(23, 27, 43, 0.06)",
      },
      borderRadius: {
        xl2: "18px",
      },
      transitionDuration: {
        180: "180ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
