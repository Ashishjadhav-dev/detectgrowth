import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f2ee",
        surface: "#ffffff",
        elevated: "#f8f7f4",
        border: "#dedbd4",
        ink: "#242420",
        muted: "#6b6a63",
        subtle: "#9c9a90",
        primary: { DEFAULT: "#5f6f52", hover: "#4d5b42", soft: "#e9eee5" },
        success: "#4f8061",
        warning: "#a97932",
        danger: "#b45a52",
        info: "#567a91",
        sidebar: "#ffffff"
      },
      boxShadow: {
        soft: "0 8px 28px rgba(55, 52, 44, 0.06)",
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
