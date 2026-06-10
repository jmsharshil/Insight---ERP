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
        border: THEME.colors.border,
        input: THEME.colors.grayXLight,
        ring: THEME.colors.primary,
        background: THEME.colors.surface,
        foreground: THEME.colors.text,
        primary: {
          DEFAULT: THEME.colors.primary,
          dark: THEME.colors.primaryDark,
          light: THEME.colors.primaryLight,
          foreground: THEME.colors.black,
        },
        gray: {
          DEFAULT: THEME.colors.gray,
          light: THEME.colors.grayLight,
          dark: THEME.colors.grayDark,
        },
        navy: {
          DEFAULT: THEME.colors.navy,
        },
        surface: THEME.colors.surface,
        sidebar: THEME.colors.sidebar,
        "sidebar-active": THEME.colors.sidebarActive,
        card: {
          DEFAULT: THEME.colors.card,
          foreground: THEME.colors.text,
        },
        popover: {
          DEFAULT: THEME.colors.card,
          foreground: THEME.colors.text,
        },
        secondary: {
          DEFAULT: THEME.colors.grayXLight,
          foreground: THEME.colors.gray,
        },
        muted: {
          DEFAULT: THEME.colors.grayXLight,
          foreground: THEME.colors.textMuted,
        },
        accent: {
          DEFAULT: THEME.colors.primaryLight,
          foreground: THEME.colors.black,
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
