import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineRecipe,
} from "@chakra-ui/react";

/**
 * Chakra tokens point at the custom properties in globals.css rather than
 * duplicating values, so the "Console" palette has exactly one source of
 * truth. Read that file first — it documents the four rules this system is
 * built on (accent as light, red means on air, depth without shadows, mono
 * means machine syntax).
 */

const buttonRecipe = defineRecipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    fontFamily: "body",
    fontWeight: "medium",
    lineHeight: "1",
    borderRadius: "sm",
    borderWidth: "1px",
    borderColor: "transparent",
    cursor: "pointer",
    whiteSpace: "nowrap",
    /* Buttons answer a click, so they may move — but only on color, and
       fast enough to feel mechanical rather than animated. */
    transition: "background-color 0.12s ease, border-color 0.12s ease",
    _disabled: {
      opacity: 0.45,
      cursor: "not-allowed",
      _hover: { bg: "inherit" },
    },
  },
  variants: {
    variant: {
      /* The one place violet is allowed to fill: a small, singular primary
         action. Same fill as `twitch` on purpose — the app accent and the
         Twitch brand are the same violet, so a primary action and a Twitch
         action look identical because they are the same thing. */
      primary: {
        bg: "signal",
        color: "white",
        _hover: { bg: "signalLit" },
        _disabled: { bg: "signal" },
      },
      twitch: {
        bg: "signal",
        color: "white",
        _hover: { bg: "signalLit" },
      },
      secondary: {
        bg: "transparent",
        borderColor: "edge",
        color: "text",
        _hover: { bg: "lift", borderColor: "faint" },
      },
      ghost: {
        bg: "transparent",
        color: "engrave",
        _hover: { bg: "tintHover", color: "text" },
      },
      /* Destructive is an outline, never a red fill — tally red is reserved
         for the on-air lamp, and a page full of red buttons would blunt it. */
      danger: {
        bg: "transparent",
        borderColor: "edge",
        color: "danger",
        _hover: { bg: "dangerTint", borderColor: "dangerEdge" },
      },
    },
    size: {
      sm: { h: "28px", px: "2.5", fontSize: "xs", gap: "1.5" },
      md: { h: "34px", px: "3.5", fontSize: "md" },
      lg: { h: "42px", px: "5", fontSize: "md" },
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
    borderRadius: "xs",
    px: "1.5",
    h: "18px",
    fontSize: "2xs",
    fontWeight: "medium",
    lineHeight: "1",
    whiteSpace: "nowrap",
  },
  variants: {
    tone: {
      neutral: { bg: "inset", color: "engrave" },
      signal: { bg: "signalTint", color: "signalText" },
      online: { bg: "okTint", color: "ok" },
      live: { bg: "tallyTint", color: "tally" },
      warning: { bg: "warnTint", color: "warn" },
      danger: { bg: "dangerTint", color: "danger" },
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
        /* Chassis */
        ground: { value: "var(--color-ground)" },
        chassis: { value: "var(--color-chassis)" },
        inset: { value: "var(--color-inset)" },
        lift: { value: "var(--color-lift)" },
        video: { value: "var(--color-video)" },

        /* Lines */
        edge: { value: "var(--color-edge)" },
        seam: { value: "var(--color-seam)" },

        /* Text */
        text: { value: "var(--color-text)" },
        engrave: { value: "var(--color-engrave)" },
        faint: { value: "var(--color-faint)" },

        /* Signal — violet as light */
        signal: { value: "var(--color-signal)" },
        signalLit: { value: "var(--color-signal-lit)" },
        signalText: { value: "var(--color-signal-text)" },
        signalTint: { value: "var(--tint-signal)" },
        signalTintStrong: { value: "var(--tint-signal-strong)" },

        /* Status */
        tally: { value: "var(--color-tally)" },
        ok: { value: "var(--color-ok)" },
        warn: { value: "var(--color-warn)" },
        danger: { value: "var(--color-danger)" },

        tallyTint: {
          value: "color-mix(in srgb, var(--color-tally) 18%, transparent)",
        },
        okTint: {
          value: "color-mix(in srgb, var(--color-ok) 18%, transparent)",
        },
        warnTint: {
          value: "color-mix(in srgb, var(--color-warn) 18%, transparent)",
        },
        dangerTint: {
          value: "color-mix(in srgb, var(--color-danger) 14%, transparent)",
        },
        dangerEdge: {
          value: "color-mix(in srgb, var(--color-danger) 45%, transparent)",
        },

        /* Neutral interaction */
        tintHover: { value: "var(--tint-hover)" },
        tintActive: { value: "var(--tint-active)" },
      },
      radii: {
        xs: { value: "var(--radius-xs)" },
        sm: { value: "var(--radius-sm)" },
        md: { value: "var(--radius-md)" },
        lg: { value: "var(--radius-lg)" },
        /* Chakra's own components reach for `l1`–`l3` internally. */
        l1: { value: "var(--radius-xs)" },
        l2: { value: "var(--radius-sm)" },
        l3: { value: "var(--radius-md)" },
      },
      fonts: {
        heading: { value: "var(--font-ui)" },
        body: { value: "var(--font-ui)" },
        mono: { value: "var(--font-mono)" },
      },
      fontSizes: {
        "2xs": { value: "var(--text-2xs)" },
        xs: { value: "var(--text-xs)" },
        sm: { value: "var(--text-sm)" },
        md: { value: "var(--text-md)" },
        lg: { value: "var(--text-lg)" },
        xl: { value: "var(--text-xl)" },
        "2xl": { value: "var(--text-h3)" },
        "3xl": { value: "var(--text-h2)" },
        "4xl": { value: "var(--text-h1)" },
      },
      shadows: {
        menu: { value: "var(--shadow-menu)" },
        dialog: { value: "var(--shadow-dialog)" },
        glowSignal: { value: "var(--glow-signal)" },
        glowTally: { value: "var(--glow-tally)" },
      },
    },
    /**
     * Chakra reserves "bg" / "fg" / "border" as its own semantic tokens (its
     * preflight does `html { color: fg; bg: bg }`) with light/dark-conditional
     * values. Declaring ours under `theme.tokens` collided with those in name
     * only and lost — Chakra's light default (white bg, near-black text) won.
     * Overriding the semantic tokens directly, unconditionally, fixes both the
     * collision and every built-in Chakra component that reads them.
     *
     * Unconditional is correct here: Console is a single-key, dark-only
     * system. There is no light theme to switch to.
     */
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: "var(--color-ground)" },
          panel: { value: "var(--color-chassis)" },
          subtle: { value: "var(--color-inset)" },
        },
        fg: {
          DEFAULT: { value: "var(--color-text)" },
          muted: { value: "var(--color-engrave)" },
          subtle: { value: "var(--color-faint)" },
        },
        border: {
          DEFAULT: { value: "var(--color-edge)" },
          muted: { value: "var(--color-seam)" },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
      badge: badgeRecipe,
    },
  },
});

export const system = createSystem(defaultConfig, config);
