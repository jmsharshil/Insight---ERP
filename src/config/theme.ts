// SINGLE SOURCE OF TRUTH for all design tokens — Saprae Color System.
export const THEME = {
  colors: {
    // ── Primary accent (orange) ──────────────────────────────────────────
    primary: "#F7A900",
    primaryDark: "#D4900A",
    primaryLight: "#FFF3CC",

    // ── Core gray scale (dominant neutral) ──────────────────────────────
    gray: "#585a5c",          // dominant neutral — muted text, labels, captions
    grayLight: "#8a8c8e",     // placeholders, nav icons on dark bg
    grayXLight: "#e8e9ea",    // borders, input strokes, dividers
    grayDark: "#2e3032",      // sidebar bg, dark surfaces, hover states

    // ── High-emphasis accents (use sparingly) ───────────────────────────
    navy: "#002147",          // reserved for hero banners ONLY (max 2-3 uses)
    black: "#000000",         // body 0text & headings on white/light surfaces

    // ── Surface & layout ────────────────────────────────────────────────
    surface: "#F4F5F5",       // page background (off-white)
    card: "#FFFFFF",
    sidebar: "#2e3032",       // dark gray sidebar
    sidebarActive: "#F7A900", // active item uses primary orange

    // ── Semantic text ───────────────────────────────────────────────────
    text: "#000000",          // primary body text on light surfaces
    textMuted: "#585a5c",     // captions, secondary text (= gray)
    textInverse: "#FFFFFF",   // text on dark/colored backgrounds

    // ── UI chrome ───────────────────────────────────────────────────────
    border: "#e8e9ea",        // = grayXLight
    divider: "#e8e9ea",

    // ── Status colours (unchanged) ──────────────────────────────────────
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