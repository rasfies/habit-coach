# DESIGN_TOKENS.md — AI Habit Coach Design System
## Author: UI_UX Agent
## Date: 2026-03-27
## Status: APPROVED for Phase 3

---

## Brand

- **App name:** HabitAI (working title)
- **Tagline:** Build habits. Together.
- **Tone:** Motivating, warm, modern. Calm productivity meets social energy.
- **Target:** Adults 25–40, self-improvement oriented.

---

## Color Palette

### Primary — Deep Indigo/Purple (main actions, CTAs, nav)

| Token            | Hex       | Usage                                      |
|------------------|-----------|--------------------------------------------|
| primary-50       | #EEF2FF   | Subtle tinted backgrounds                  |
| primary-100      | #E0E7FF   | Hover states on light surfaces             |
| primary-200      | #C7D2FE   | Disabled button fills                      |
| primary-300      | #A5B4FC   | Decorative accents, rings                  |
| primary-400      | #818CF8   | Icon fills, secondary labels               |
| primary-500      | #6366F1   | Mid-weight UI elements                     |
| primary-600      | #4F46E5   | **Default CTA / button fill**              |
| primary-700      | #4338CA   | Hover state for primary buttons            |
| primary-800      | #3730A3   | Pressed / active state                     |
| primary-900      | #312E81   | Dark mode surfaces, sidebar bg             |

### Accent / Highlight — Amber/Yellow (user preference — streaks, badges, celebrations)

| Token       | Hex       | Usage                                        |
|-------------|-----------|----------------------------------------------|
| accent-50   | #FFFBEB   | Pale celebration background                  |
| accent-100  | #FEF3C7   | Streak milestone card tint                   |
| accent-200  | #FDE68A   | Badge background (light mode)                |
| accent-300  | #FCD34D   | Day dot — grace day used                     |
| accent-400  | #FBBF24   | **Streak badge fill, milestone highlights**  |
| accent-500  | #F59E0B   | Fire icon color, milestone ring              |
| accent-600  | #D97706   | Pressed/active badge state                   |
| accent-700  | #B45309   | High-contrast accent text                    |
| accent-800  | #92400E   | Dark mode accent border                      |
| accent-900  | #78350F   | Dark mode accent text                        |

### Neutral — Gray scale (text, borders, backgrounds)

| Token        | Hex       | Usage                                |
|--------------|-----------|--------------------------------------|
| neutral-50   | #F9FAFB   | Page background                      |
| neutral-100  | #F3F4F6   | Card background                      |
| neutral-200  | #E5E7EB   | Borders, dividers                    |
| neutral-300  | #D1D5DB   | Disabled text, placeholders          |
| neutral-400  | #9CA3AF   | Secondary labels, captions           |
| neutral-500  | #6B7280   | Body text (secondary)                |
| neutral-600  | #4B5563   | Body text (primary)                  |
| neutral-700  | #374151   | Headings (secondary)                 |
| neutral-800  | #1F2937   | Headings (primary)                   |
| neutral-900  | #111827   | Maximum contrast text                |

### Semantic Colors

| Token           | Hex       | Usage                                            |
|-----------------|-----------|--------------------------------------------------|
| success-50      | #F0FDF4   | Streak-maintained card tint                      |
| success-100     | #DCFCE7   | Check button hover background                    |
| success-400     | #4ADE80   | Day dot — logged                                 |
| success-500     | #22C55E   | **Check button checked fill, streak maintained** |
| success-600     | #16A34A   | Check button pressed                             |
| success-700     | #15803D   | High-contrast success text                       |
| error-50        | #FFF1F2   | Streak-broken card tint                          |
| error-400       | #FB7185   | Day dot — missed                                 |
| error-500       | #EF4444   | **Streak broken indicator**                      |
| error-600       | #DC2626   | Error text, destructive actions                  |
| warning-50      | #FFFBEB   | Streak-at-risk card tint                         |
| warning-400     | #FB923C   | Day dot — at risk                                |
| warning-500     | #F97316   | **Streak at risk (no log by 8pm)**               |
| warning-600     | #EA580C   | Warning text                                     |
| info-50         | #EFF6FF   | Info card tint                                   |
| info-400        | #60A5FA   | Day dot — today/future                           |
| info-500        | #3B82F6   | **Info indicators, today marker**                |
| info-600        | #2563EB   | Info text                                        |

### Background / Surface

| Token        | Value     | Usage                                     |
|--------------|-----------|-------------------------------------------|
| bg-base      | #F9FAFB   | Page/screen background                    |
| bg-surface   | #FFFFFF   | Card backgrounds, input fields            |
| bg-elevated  | #FFFFFF   | Modal, popover, dropdown (with shadow)    |
| bg-overlay   | rgba(0,0,0,0.4) | Modal backdrop                      |

---

## Typography

### Fonts

| Role     | Family          | Notes                                      |
|----------|-----------------|--------------------------------------------|
| Heading  | Inter (variable)| Weight 600–700 for headings                |
| Body     | Inter (variable)| Weight 400–500 for body                    |
| Mono     | JetBrains Mono  | Streak numbers, analytics figures, timers  |

### Scale (rem)

| Token | rem      | px   | Usage                                 |
|-------|----------|------|---------------------------------------|
| xs    | 0.75rem  | 12px | Captions, timestamps, labels          |
| sm    | 0.875rem | 14px | Secondary body, button labels (sm)    |
| base  | 1rem     | 16px | Body text, default                    |
| lg    | 1.125rem | 18px | Lead text, card titles (sm)           |
| xl    | 1.25rem  | 20px | Section headings (sm)                 |
| 2xl   | 1.5rem   | 24px | Card headings, modal titles           |
| 3xl   | 1.875rem | 30px | Page headings                         |
| 4xl   | 2.25rem  | 36px | Hero headlines                        |

### Font Weights

| Token    | Value | Usage                                    |
|----------|-------|------------------------------------------|
| normal   | 400   | Body text, descriptions                  |
| medium   | 500   | Labels, navigation items                 |
| semibold | 600   | Card titles, button text                 |
| bold     | 700   | Headings, streak numbers, milestones     |

### Line Heights

| Token   | Value | Usage            |
|---------|-------|------------------|
| tight   | 1.25  | Headings         |
| snug    | 1.375 | Subheadings      |
| normal  | 1.5   | Body text        |
| relaxed | 1.625 | Long-form text   |

---

## Spacing (4px base grid)

| Token | px  | rem     | Usage example                   |
|-------|-----|---------|---------------------------------|
| 0.5   | 2px | 0.125rem| Fine-grain adjustment           |
| 1     | 4px | 0.25rem | Icon padding, dense list gaps   |
| 2     | 8px | 0.5rem  | Inline element gaps, chip pad   |
| 3     | 12px| 0.75rem | Input padding (vertical)        |
| 4     | 16px| 1rem    | Standard element padding        |
| 5     | 20px| 1.25rem | Card padding (mobile)           |
| 6     | 24px| 1.5rem  | Card padding (desktop)          |
| 8     | 32px| 2rem    | Section gaps                    |
| 10    | 40px| 2.5rem  | Large section gaps              |
| 12    | 48px| 3rem    | Hero section padding            |
| 16    | 64px| 4rem    | Page-level vertical rhythm      |
| 20    | 80px| 5rem    | Section separators              |
| 24    | 96px| 6rem    | Max hero padding                |

---

## Border Radius

| Token | px      | Usage                                        |
|-------|---------|----------------------------------------------|
| sm    | 4px     | Badges, chips, small tags                    |
| md    | 8px     | Inputs, small buttons                        |
| lg    | 12px    | Cards, modals, dropdowns                     |
| xl    | 16px    | Large cards, panels                          |
| 2xl   | 24px    | Hero cards, feature panels                  |
| full  | 9999px  | Pills, avatars, check buttons, day dots      |

---

## Shadows

| Token      | Value                                              | Usage                          |
|------------|----------------------------------------------------|--------------------------------|
| shadow-sm  | 0 1px 2px 0 rgba(0,0,0,0.05)                      | Subtle card lift               |
| shadow-md  | 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1) | Card default      |
| shadow-lg  | 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1) | Elevated card, modal |
| shadow-xl  | 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1) | Popovers, deep modals |

---

## Z-index Scale

| Token      | Value | Usage                              |
|------------|-------|------------------------------------|
| z-base     | 0     | Normal document flow               |
| z-dropdown | 100   | Select menus, dropdowns            |
| z-sticky   | 200   | Sticky headers, fixed navigation   |
| z-modal    | 300   | Modal dialogs, drawers             |
| z-toast    | 400   | Toast notifications (above modal)  |

---

## Component Patterns

### HabitCard
- Container: white bg-surface card, shadow-md, rounded-xl, padding-6
- Left: 40px icon circle (primary-100 bg, primary-600 icon) + habit name (text-lg semibold neutral-800) + description (text-sm neutral-500)
- Right: StreakBadge + CheckButton (56px)
- Milestone state (7, 14, 30+ days): subtle accent-50 card background tint, accent-400 left border accent (4px)
- Checked today: success-50 card tint, success-500 left border
- Hover: shadow-lg, slight scale(1.01) transform

### StreakBadge
- Default: neutral-100 background, neutral-700 text, flame icon neutral-400
- Active (streak > 0): accent-100 bg, accent-700 text, flame icon accent-500
- Milestone (3, 7, 14, 30+): accent-400 bg, white text, flame icon white, slight glow shadow
- Shape: rounded-full, px-3 py-1, text-sm font-bold, JetBrains Mono for number

### GroupMember Avatar Stack
- Row: avatar (32px circle, rounded-full, border-2 border-white) + -8px overlap
- Max 5 visible; "+N" badge for overflow (neutral-200 bg, neutral-600 text)
- Shadow on each avatar: shadow-sm

### AICoachMessage Bubble
- Container: max-w-sm, rounded-2xl, padding-4
- Background: linear-gradient(135deg, primary-600 → primary-800) for 'daily'; accent-400 → accent-600 for 'milestone'; primary-500 → success-600 for 'encouragement'
- Text: white, text-sm/base, leading-relaxed
- Avatar: 36px robot/sparkle icon, white bg circle, left of bubble
- Timestamp: text-xs, white/70 opacity, bottom-right
- Type badge: xs pill (white/20 bg) top-right corner

### ProgressRing
- SVG circle, 120px default size
- Track: neutral-200 stroke, 8px strokeWidth
- Progress arc: primary-600 stroke, animated stroke-dashoffset on mount (600ms ease-out)
- Center text: percentage (text-2xl bold JetBrains Mono, neutral-800) + "today" label (text-xs neutral-500)
- Milestone (100%): accent-400 stroke, center shows checkmark

### DayDot
- Size: 12px circle, rounded-full
- logged: success-500 fill (#22C55E)
- missed: neutral-300 fill (#D1D5DB)
- grace: accent-400 fill (#FBBF24)
- today: info-500 fill (#3B82F6) with pulsing ring animation
- future: neutral-200 fill (#E5E7EB)
- Spacing: 4px gap between dots in a row

### CheckButton
- Size: 56px circle, rounded-full
- Unchecked: border-2 border-neutral-300, bg transparent, hover border-success-400 bg-success-50
- Checked: bg-success-500, border-success-500, white checkmark icon (20px)
- Transition: 200ms ease-in-out all properties
- Active/press: scale(0.92) transform
- Disabled: opacity-40, cursor-not-allowed

---

## CSS Variables

```css
:root {
  /* === PRIMARY (Indigo) === */
  --color-primary-50: #EEF2FF;
  --color-primary-100: #E0E7FF;
  --color-primary-200: #C7D2FE;
  --color-primary-300: #A5B4FC;
  --color-primary-400: #818CF8;
  --color-primary-500: #6366F1;
  --color-primary-600: #4F46E5;
  --color-primary-700: #4338CA;
  --color-primary-800: #3730A3;
  --color-primary-900: #312E81;

  /* === ACCENT (Amber/Yellow) === */
  --color-accent-50: #FFFBEB;
  --color-accent-100: #FEF3C7;
  --color-accent-200: #FDE68A;
  --color-accent-300: #FCD34D;
  --color-accent-400: #FBBF24;
  --color-accent-500: #F59E0B;
  --color-accent-600: #D97706;
  --color-accent-700: #B45309;
  --color-accent-800: #92400E;
  --color-accent-900: #78350F;

  /* === NEUTRAL (Gray) === */
  --color-neutral-50: #F9FAFB;
  --color-neutral-100: #F3F4F6;
  --color-neutral-200: #E5E7EB;
  --color-neutral-300: #D1D5DB;
  --color-neutral-400: #9CA3AF;
  --color-neutral-500: #6B7280;
  --color-neutral-600: #4B5563;
  --color-neutral-700: #374151;
  --color-neutral-800: #1F2937;
  --color-neutral-900: #111827;

  /* === SUCCESS (Green) === */
  --color-success-50: #F0FDF4;
  --color-success-100: #DCFCE7;
  --color-success-400: #4ADE80;
  --color-success-500: #22C55E;
  --color-success-600: #16A34A;
  --color-success-700: #15803D;

  /* === ERROR (Red) === */
  --color-error-50: #FFF1F2;
  --color-error-400: #FB7185;
  --color-error-500: #EF4444;
  --color-error-600: #DC2626;

  /* === WARNING (Orange) === */
  --color-warning-50: #FFFBEB;
  --color-warning-400: #FB923C;
  --color-warning-500: #F97316;
  --color-warning-600: #EA580C;

  /* === INFO (Blue) === */
  --color-info-50: #EFF6FF;
  --color-info-400: #60A5FA;
  --color-info-500: #3B82F6;
  --color-info-600: #2563EB;

  /* === BACKGROUND / SURFACE === */
  --color-bg-base: #F9FAFB;
  --color-bg-surface: #FFFFFF;
  --color-bg-elevated: #FFFFFF;

  /* === TYPOGRAPHY === */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* === SPACING (4px grid) === */
  --space-1: 0.25rem;   /* 4px  */
  --space-2: 0.5rem;    /* 8px  */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */

  /* === BORDER RADIUS === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* === SHADOWS === */
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);

  /* === Z-INDEX === */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-toast: 400;

  /* === shadcn/ui CSS variable mapping === */
  --background: 249 250 251;       /* neutral-50 */
  --foreground: 17 24 39;          /* neutral-900 */
  --card: 255 255 255;
  --card-foreground: 17 24 39;
  --popover: 255 255 255;
  --popover-foreground: 17 24 39;
  --primary: 79 70 229;            /* primary-600 */
  --primary-foreground: 255 255 255;
  --secondary: 238 242 255;        /* primary-50 */
  --secondary-foreground: 67 56 202; /* primary-700 */
  --muted: 243 244 246;            /* neutral-100 */
  --muted-foreground: 107 114 128; /* neutral-500 */
  --accent: 251 191 36;            /* accent-400 */
  --accent-foreground: 120 53 15;  /* accent-900 */
  --destructive: 239 68 68;        /* error-500 */
  --destructive-foreground: 255 255 255;
  --border: 229 231 235;           /* neutral-200 */
  --input: 229 231 235;
  --ring: 79 70 229;               /* primary-600 */
  --radius: 0.75rem;               /* 12px — lg */
}
```

---

## Tailwind Extension

The following object goes into the `extend` block of `tailwind.config.ts`:

```typescript
// Paste into tailwind.config.ts → theme.extend
{
  colors: {
    // Brand primary (indigo)
    brand: {
      50:  '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
    },
    // Accent (amber/yellow — user preference)
    highlight: {
      50:  '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
    // Semantic
    success: {
      50:  '#F0FDF4',
      100: '#DCFCE7',
      400: '#4ADE80',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
    },
    danger: {
      50:  '#FFF1F2',
      400: '#FB7185',
      500: '#EF4444',
      600: '#DC2626',
    },
    caution: {
      50:  '#FFFBEB',
      400: '#FB923C',
      500: '#F97316',
      600: '#EA580C',
    },
    info: {
      50:  '#EFF6FF',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
    },
  },
  fontFamily: {
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  borderRadius: {
    '2xl': '24px',
    '3xl': '32px',
  },
  boxShadow: {
    'habit-card': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
    'habit-card-hover': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.07)',
    'streak-glow': '0 0 12px rgba(251,191,36,0.5)',
    'check-glow': '0 0 12px rgba(34,197,94,0.4)',
  },
  keyframes: {
    'check-in': {
      '0%':   { transform: 'scale(1)' },
      '50%':  { transform: 'scale(0.88)' },
      '100%': { transform: 'scale(1)' },
    },
    'streak-pop': {
      '0%':   { transform: 'scale(0.8)', opacity: '0' },
      '60%':  { transform: 'scale(1.15)' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
    'dot-pulse': {
      '0%, 100%': { opacity: '1', transform: 'scale(1)' },
      '50%':      { opacity: '0.6', transform: 'scale(0.85)' },
    },
    'ring-fill': {
      from: { strokeDashoffset: '339' },
      to:   { strokeDashoffset: 'var(--ring-offset)' },
    },
    'fade-up': {
      from: { opacity: '0', transform: 'translateY(8px)' },
      to:   { opacity: '1', transform: 'translateY(0)' },
    },
  },
  animation: {
    'check-in':    'check-in 200ms ease-in-out',
    'streak-pop':  'streak-pop 400ms cubic-bezier(0.34,1.56,0.64,1)',
    'dot-pulse':   'dot-pulse 2s ease-in-out infinite',
    'ring-fill':   'ring-fill 600ms ease-out forwards',
    'fade-up':     'fade-up 300ms ease-out',
  },
}
```

---

## React Native Tokens

Import and use in React Native `StyleSheet.create()` calls:

```typescript
// packages/ui/src/tokens.ts  (also exported from packages/ui/src/index.ts)

export const colors = {
  // Primary (indigo)
  primary: {
    50:  '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  // Accent (amber/yellow)
  accent: {
    50:  '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  // Neutral
  neutral: {
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  // Semantic
  success: {
    50:  '#F0FDF4',
    100: '#DCFCE7',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  error: {
    50:  '#FFF1F2',
    400: '#FB7185',
    500: '#EF4444',
    600: '#DC2626',
  },
  warning: {
    50:  '#FFFBEB',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
  },
  info: {
    50:  '#EFF6FF',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
  },
  // Surfaces
  bg: {
    base:     '#F9FAFB',
    surface:  '#FFFFFF',
    elevated: '#FFFFFF',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

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

export const typography = {
  fontFamily: {
    sans: 'Inter',
    mono: 'JetBrains Mono',
  },
  fontSize: {
    xs:   12,
    sm:   14,
    base: 16,
    lg:   18,
    xl:   20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal:   '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },
  lineHeight: {
    tight:   1.25,
    snug:    1.375,
    normal:  1.5,
    relaxed: 1.625,
  },
} as const;

export const radii = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  '2xl': 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

export const zIndex = {
  base:     0,
  dropdown: 100,
  sticky:   200,
  modal:    300,
  toast:    400,
} as const;

// Convenience re-export
export const tokens = { colors, spacing, typography, radii, shadows, zIndex } as const;
export type Tokens = typeof tokens;
```

---

*DESIGN_TOKENS.md v1.0 — written by UI_UX agent — approved for Phase 3*
