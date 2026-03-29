/**
 * @habit-coach/ui — shared component library + design tokens
 *
 * This barrel exports:
 *  1. Design tokens (colors, spacing, typography, radii, shadows, zIndex)
 *     — used by both web (reference values) and mobile (StyleSheet)
 *
 *  2. Shared React components (populated in TASK-006):
 *     Button, Card, Input, Avatar, Badge, Skeleton — Radix/shadcn-based
 *
 * Import tokens in mobile components:
 *   import { colors, spacing, typography, radii, shadows } from "@habit-coach/ui";
 *
 * Import tokens in web utilities / theming:
 *   import { colors } from "@habit-coach/ui";
 */

// ---------------------------------------------------------------------------
// Design Tokens
// ---------------------------------------------------------------------------

/** Brand primary — deep indigo/purple scale */
export const colors = {
  primary: {
    50:  "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1",
    600: "#4F46E5",
    700: "#4338CA",
    800: "#3730A3",
    900: "#312E81",
  },
  /** Accent — amber/yellow (user preference: streak highlights, badges, celebrations) */
  accent: {
    50:  "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  /** Neutral gray scale */
  neutral: {
    50:  "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  /** Semantic: success (streak maintained, checked in) */
  success: {
    50:  "#F0FDF4",
    100: "#DCFCE7",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
  },
  /** Semantic: error (streak broken) */
  error: {
    50:  "#FFF1F2",
    400: "#FB7185",
    500: "#EF4444",
    600: "#DC2626",
  },
  /** Semantic: warning (streak at risk — no log by 8pm) */
  warning: {
    50:  "#FFFBEB",
    400: "#FB923C",
    500: "#F97316",
    600: "#EA580C",
  },
  /** Semantic: info (today marker, future days) */
  info: {
    50:  "#EFF6FF",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
  },
  /** Background / surface tokens */
  bg: {
    base:     "#F9FAFB",
    surface:  "#FFFFFF",
    elevated: "#FFFFFF",
  },
  white:       "#FFFFFF",
  black:       "#000000",
  transparent: "transparent",
} as const;

/** Spacing — 4px base grid. Values in pixels (number) for React Native StyleSheet. */
export const spacing = {
  0.5:  2,
  1:    4,
  2:    8,
  3:    12,
  4:    16,
  5:    20,
  6:    24,
  8:    32,
  10:   40,
  12:   48,
  16:   64,
  20:   80,
  24:   96,
} as const;

/** Typography tokens */
export const typography = {
  fontFamily: {
    sans: "Inter",
    mono: "JetBrains Mono",
  },
  fontSize: {
    xs:    12,
    sm:    14,
    base:  16,
    lg:    18,
    xl:    20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  fontWeight: {
    normal:   "400" as const,
    medium:   "500" as const,
    semibold: "600" as const,
    bold:     "700" as const,
  },
  lineHeight: {
    tight:   1.25,
    snug:    1.375,
    normal:  1.5,
    relaxed: 1.625,
  },
} as const;

/** Border radius tokens. Values in pixels (number) for React Native. */
export const radii = {
  sm:    4,
  md:    8,
  lg:    12,
  xl:    16,
  "2xl": 24,
  full:  9999,
} as const;

/** Shadow tokens — React Native compatible (also usable as reference for web) */
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 } as const,
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 } as const,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 } as const,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 } as const,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

/** Z-index scale */
export const zIndex = {
  base:     0,
  dropdown: 100,
  sticky:   200,
  modal:    300,
  toast:    400,
} as const;

/** Convenience re-export of all tokens as a single object */
export const tokens = {
  colors,
  spacing,
  typography,
  radii,
  shadows,
  zIndex,
} as const;

export type Colors    = typeof colors;
export type Spacing   = typeof spacing;
export type Typography = typeof typography;
export type Radii     = typeof radii;
export type Shadows   = typeof shadows;
export type Tokens    = typeof tokens;

// ---------------------------------------------------------------------------
// Shared React Components
// (Populated in TASK-006 — Radix/shadcn primitives for web)
// ---------------------------------------------------------------------------

// export { Button, type ButtonProps }   from "./components/button";
// export { Card, CardHeader, CardContent, CardFooter, type CardProps } from "./components/card";
// export { Input, type InputProps }     from "./components/input";
// export { Avatar, AvatarImage, AvatarFallback } from "./components/avatar";
// export { Badge, type BadgeProps }     from "./components/badge";
// export { Skeleton }                   from "./components/skeleton";
