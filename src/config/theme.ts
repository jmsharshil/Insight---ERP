// SINGLE SOURCE OF TRUTH for all design tokens.
export const THEME = {
  colors: {
    primary: "#F7A900",
    primaryDark: "#D4900A",
    primaryLight: "#FFF3CC",
    navy: "#002147",
    navyLight: "#003366",
    surface: "#F7F7F7",
    card: "#FFFFFF",
    text: "#000000DB",
    textMuted: "#6B7280",
    textInverse: "#FFFFFF",
    border: "#E5E7EB",
    success: "#16A34A",
    warning: "#F59E0B",
    error: "#DC2626",
    info: "#2563EB",
  },
  sidebar: { width: "260px", collapsedWidth: "72px" },
  topbar: { height: "64px" },
  borderRadius: { sm: "6px", md: "10px", lg: "14px", xl: "20px" },
  fontFamily: {
    heading: '"Sora", sans-serif',
    body: '"DM Sans", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  animation: {
    pageTransition: { duration: 0.3, ease: "easeInOut" as const },
    sidebarTransition: { duration: 0.25, ease: "easeInOut" as const },
    cardEntrance: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
    staggerDelay: 0.07,
  },
} as const;

export type ThemeColors = typeof THEME.colors;
