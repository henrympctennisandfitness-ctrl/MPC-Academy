import type { Config } from "tailwindcss";

/**
 * MPC Academy design tokens.
 * The whole interface leans on typography + spacing, so colour is deliberately
 * restrained: a deep forest green, a soft gold accent, and near-neutral surfaces.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primary — Deep Forest Green
        brand: {
          DEFAULT: "#0E4D3A",
          dark: "#0A3B2C",
          tint: "#EAF1EE",
        },
        // Accent — Soft Gold (use sparingly)
        gold: {
          DEFAULT: "#D4AF37",
          tint: "#FBF6E7",
        },
        background: "#FAFAFA", // Off white
        surface: "#FFFFFF", // Cards
        ink: "#1C1C1C", // Almost black text
        muted: "#6B7280", // Soft grey text
        line: "#ECECEC", // Hairline borders
      },
      fontFamily: {
        // Wired to the next/font variable defined in app/layout.tsx
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.03), 0 12px 30px -18px rgba(16,24,40,0.12)",
        "card-hover":
          "0 2px 4px rgba(16,24,40,0.04), 0 22px 40px -20px rgba(16,24,40,0.22)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};

export default config;
