import { createSystem, defaultConfig, defineConfig, defineRecipe } from "@chakra-ui/react";

/**
 * Chakra tokens reference the same custom properties defined in globals.css
 * (Nocturne design system) instead of duplicating values, so the palette has
 * one source of truth.
 */
const buttonRecipe = defineRecipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    fontWeight: "medium",
    borderRadius: "l2",
    transition: "all 0.15s ease",
    cursor: "pointer",
    _disabled: { opacity: 0.6, cursor: "not-allowed" },
  },
  variants: {
    variant: {
      primary: {
        bg: "accent",
        color: "white",
        _hover: { bg: "accentEmphasis" },
      },
      secondary: {
        borderWidth: "1px",
        borderColor: "border",
        _hover: { bg: "surface2" },
      },
      ghost: {
        color: "text",
        _hover: { bg: "surface2" },
      },
      twitch: {
        bg: "twitch",
        color: "white",
        _hover: { opacity: 0.85 },
      },
      danger: {
        bg: "danger",
        color: "white",
        _hover: { opacity: 0.9 },
      },
    },
    size: {
      sm: { px: "3", py: "1.5", fontSize: "xs" },
      md: { px: "4", py: "2", fontSize: "sm" },
      lg: { px: "5", py: "2.5", fontSize: "md" },
    },
  },
  defaultVariants: {
    variant: "secondary",
    size: "md",
  },
});

const badgeRecipe = defineRecipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    borderRadius: "full",
    px: "2",
    py: "0.5",
    fontSize: "xs",
    fontWeight: "medium",
  },
  variants: {
    tone: {
      neutral: { bg: "surface2", color: "textMuted" },
      online: { bg: "onlineSubtle", color: "online" },
      live: { bg: "liveSubtle", color: "live" },
      warning: { bg: "warningSubtle", color: "warning" },
      danger: { bg: "dangerSubtle", color: "danger" },
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        surface: { value: "var(--color-surface)" },
        surface2: { value: "var(--color-surface-2)" },
        text: { value: "var(--color-text)" },
        textMuted: { value: "var(--color-text-muted)" },
        accent: { value: "var(--color-accent)" },
        accentEmphasis: { value: "var(--color-accent-600)" },
        highlight: { value: "var(--color-accent-700)" },
        twitch: { value: "var(--color-twitch)" },
        danger: { value: "var(--color-danger)" },
        online: { value: "var(--color-online)" },
        warning: { value: "var(--color-warning)" },
        live: { value: "var(--color-live)" },
        onlineSubtle: { value: "color-mix(in srgb, var(--color-online) 20%, transparent)" },
        liveSubtle: { value: "color-mix(in srgb, var(--color-live) 20%, transparent)" },
        warningSubtle: { value: "color-mix(in srgb, var(--color-warning) 20%, transparent)" },
        dangerSubtle: { value: "color-mix(in srgb, var(--color-danger) 20%, transparent)" },
        borderSubtle: { value: "color-mix(in srgb, var(--color-divider) 50%, transparent)" },
        surface2Subtle: { value: "color-mix(in srgb, var(--color-surface-2) 50%, transparent)" },
      },
      radii: {
        sm: { value: "var(--radius-sm)" },
        md: { value: "var(--radius-md)" },
        l2: { value: "var(--radius-md)" },
        lg: { value: "var(--radius-lg)" },
      },
      fonts: {
        heading: { value: "var(--font-heading)" },
        body: { value: "var(--font-body)" },
        mono: { value: "var(--font-mono)" },
      },
    },
    /**
     * Chakra reserves "bg" / "fg" / "border" as its own semantic tokens
     * (used by its preflight globalCss: `html { color: fg; bg: bg }`) with
     * light/dark-mode-conditional values. Defining our own "bg"/"border"
     * tokens under `theme.tokens` collided with those in *name only* and
     * lost — Chakra's light-mode default (white bg, near-black text) won.
     * Overriding the semantic tokens directly, unconditionally (this app
     * has no light/dark toggle), fixes both the collision and every
     * built-in Chakra component that reads "bg"/"fg"/"border" internally.
     */
    semanticTokens: {
      colors: {
        bg: { DEFAULT: { value: "var(--color-bg)" } },
        fg: { DEFAULT: { value: "var(--color-text)" }, muted: { value: "var(--color-text-muted)" } },
        border: { DEFAULT: { value: "var(--color-divider)" }, muted: { value: "var(--color-divider-soft)" } },
      },
    },
    recipes: {
      button: buttonRecipe,
      badge: badgeRecipe,
    },
  },
});

export const system = createSystem(defaultConfig, config);
