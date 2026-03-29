import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Shared UI package
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // -----------------------------------------------------------------------
      // shadcn/ui CSS variable tokens — resolved during TASK-003 shadcn init
      // These reference CSS custom properties set in globals.css :root {}
      // -----------------------------------------------------------------------
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // -------------------------------------------------------------------
        // HabitAI Design Tokens — hard-coded values for component authoring
        // These are the semantic names used in component files. They live
        // alongside (not replacing) the CSS variable tokens above.
        // -------------------------------------------------------------------

        // Brand: deep indigo/purple — CTAs, nav, AI chat bubble
        brand: {
          50:  "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",  // default CTA fill
          700: "#4338CA",  // hover
          800: "#3730A3",  // pressed
          900: "#312E81",  // sidebar, dark surfaces
        },

        // Highlight: amber/yellow — user preference, streak badges, celebrations
        highlight: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",  // streak badge fill, day dot grace
          500: "#F59E0B",  // fire icon
          600: "#D97706",  // pressed badge
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },

        // Semantic: success — streak maintained, check-in confirmed
        success: {
          50:  "#F0FDF4",
          100: "#DCFCE7",
          400: "#4ADE80",
          500: "#22C55E",  // check button fill, day dot logged
          600: "#16A34A",  // pressed check button
          700: "#15803D",
        },

        // Semantic: danger — streak broken, destructive actions
        danger: {
          50:  "#FFF1F2",
          400: "#FB7185",
          500: "#EF4444",  // streak broken
          600: "#DC2626",
        },

        // Semantic: caution — streak at risk (no log by 8pm)
        caution: {
          50:  "#FFFBEB",
          400: "#FB923C",
          500: "#F97316",  // at-risk indicator
          600: "#EA580C",
        },

        // Semantic: info — today marker, future days
        info: {
          50:  "#EFF6FF",
          400: "#60A5FA",
          500: "#3B82F6",  // today day dot, info banners
          600: "#2563EB",
        },

        // Neutral: full gray scale for text, borders, backgrounds
        neutral: {
          50:  "#F9FAFB",  // page bg
          100: "#F3F4F6",  // card bg
          200: "#E5E7EB",  // borders, dividers
          300: "#D1D5DB",  // disabled text
          400: "#9CA3AF",  // secondary labels
          500: "#6B7280",  // body text secondary
          600: "#4B5563",  // body text primary
          700: "#374151",  // headings secondary
          800: "#1F2937",  // headings primary
          900: "#111827",  // max contrast
        },
      },

      borderRadius: {
        // shadcn/ui variable-based (preserved from original)
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        // HabitAI token additions
        xl:   "16px",
        "2xl": "24px",
        "3xl": "32px",
      },

      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        // JetBrains Mono for streak numbers, analytics figures, timers
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },

      boxShadow: {
        // HabitAI component-specific shadows
        "habit-card":       "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
        "habit-card-hover": "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.07)",
        "streak-glow":      "0 0 12px rgba(251,191,36,0.5)",
        "check-glow":       "0 0 12px rgba(34,197,94,0.4)",
        "ring-focus":       "0 0 0 2px #4F46E5, 0 0 0 4px rgba(79,70,229,0.2)",
      },

      keyframes: {
        // shadcn/ui accordion (preserved)
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        // HabitAI animations
        "check-in": {
          "0%":   { transform: "scale(1)" },
          "50%":  { transform: "scale(0.88)" },
          "100%": { transform: "scale(1)" },
        },
        "streak-pop": {
          "0%":   { transform: "scale(0.8)", opacity: "0" },
          "60%":  { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "dot-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.6", transform: "scale(0.85)" },
        },
        "ring-fill": {
          from: { strokeDashoffset: "339" },
          to:   { strokeDashoffset: "var(--ring-offset, 0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to:   { transform: "scale(1)", opacity: "1" },
        },
      },

      animation: {
        // shadcn/ui (preserved)
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        // HabitAI
        "check-in":   "check-in 200ms ease-in-out",
        "streak-pop": "streak-pop 400ms cubic-bezier(0.34,1.56,0.64,1)",
        "dot-pulse":  "dot-pulse 2s ease-in-out infinite",
        "ring-fill":  "ring-fill 600ms ease-out forwards",
        "fade-up":    "fade-up 300ms ease-out",
        "fade-in":    "fade-in 200ms ease-out",
        "scale-in":   "scale-in 200ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
