import type { Config } from "tailwindcss";
import { THEME } from "./src/config/theme";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: THEME.colors.primary,
          dark: THEME.colors.primaryDark,
          light: THEME.colors.primaryLight,
          foreground: THEME.colors.text,
        },
        navy: {
          DEFAULT: THEME.colors.navy,
          light: THEME.colors.navyLight,
        },
        surface: THEME.colors.surface,
        card: {
          DEFAULT: THEME.colors.card,
          foreground: THEME.colors.text,
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: THEME.colors.text,
        },
        secondary: {
          DEFAULT: "#F1F5F9",
          foreground: THEME.colors.text,
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: THEME.colors.textMuted,
        },
        accent: {
          DEFAULT: THEME.colors.primaryLight,
          foreground: THEME.colors.text,
        },
        destructive: {
          DEFAULT: THEME.colors.error,
          foreground: "#FFFFFF",
        },
        success: THEME.colors.success,
        warning: THEME.colors.warning,
        info: THEME.colors.info,
        "text-primary": THEME.colors.text,
        "text-muted": THEME.colors.textMuted,
        "text-inverse": THEME.colors.textInverse,
      },
      fontFamily: {
        heading: ["Sora", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        sans: ["DM Sans", "sans-serif"],
      },
      borderRadius: {
        lg: THEME.borderRadius.lg,
        md: THEME.borderRadius.md,
        sm: THEME.borderRadius.sm,
        xl: THEME.borderRadius.xl,
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shake: "shake 0.4s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
