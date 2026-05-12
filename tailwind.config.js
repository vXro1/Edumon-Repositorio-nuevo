/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ── Brand palette (maps to CSS custom properties) ── */
      colors: {
        /* Semantic */
        primary:   "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent:    "var(--color-accent)",
        success:   "var(--color-success)",
        warning:   "var(--color-warning)",
        error:     "var(--color-error)",

        /* Surfaces */
        surface:   "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        "surface-3": "var(--color-surface-3)",

        /* Text */
        "text-base":   "var(--color-text)",
        "text-muted":  "var(--color-text-muted)",
        "text-subtle": "var(--color-text-subtle)",

        /* Brand palette */
        "edu-purple": {
          50:  "var(--edu-purple-50)",
          100: "var(--edu-purple-100)",
          200: "var(--edu-purple-200)",
          300: "var(--edu-purple-300)",
          400: "var(--edu-purple-400)",
          500: "var(--edu-purple-500)",
          600: "var(--edu-purple-600)",
          700: "var(--edu-purple-700)",
          800: "var(--edu-purple-800)",
          900: "var(--edu-purple-900)",
          DEFAULT: "var(--edu-purple-500)",
        },
        "edu-pink": {
          50:  "var(--edu-pink-50)",
          100: "var(--edu-pink-100)",
          200: "var(--edu-pink-200)",
          300: "var(--edu-pink-300)",
          400: "var(--edu-pink-400)",
          500: "var(--edu-pink-500)",
          600: "var(--edu-pink-600)",
          700: "var(--edu-pink-700)",
          DEFAULT: "var(--edu-pink-500)",
        },
        "edu-cyan": {
          50:  "var(--edu-cyan-50)",
          100: "var(--edu-cyan-100)",
          200: "var(--edu-cyan-200)",
          300: "var(--edu-cyan-300)",
          400: "var(--edu-cyan-400)",
          500: "var(--edu-cyan-500)",
          600: "var(--edu-cyan-600)",
          700: "var(--edu-cyan-700)",
          DEFAULT: "var(--edu-cyan-500)",
        },
        "edu-green": {
          50:  "var(--edu-green-50)",
          100: "var(--edu-green-100)",
          200: "var(--edu-green-200)",
          500: "var(--edu-green-500)",
          600: "var(--edu-green-600)",
          700: "var(--edu-green-700)",
          DEFAULT: "var(--edu-green-500)",
        },
        "edu-yellow": {
          50:  "var(--edu-yellow-50)",
          100: "var(--edu-yellow-100)",
          500: "var(--edu-yellow-500)",
          600: "var(--edu-yellow-600)",
          700: "var(--edu-yellow-700)",
          DEFAULT: "var(--edu-yellow-500)",
        },
        "edu-neutral": {
          0:   "var(--edu-neutral-0)",
          50:  "var(--edu-neutral-50)",
          100: "var(--edu-neutral-100)",
          200: "var(--edu-neutral-200)",
          300: "var(--edu-neutral-300)",
          400: "var(--edu-neutral-400)",
          500: "var(--edu-neutral-500)",
          600: "var(--edu-neutral-600)",
          700: "var(--edu-neutral-700)",
          800: "var(--edu-neutral-800)",
          900: "var(--edu-neutral-900)",
        },

        /* Legacy aliases (backward compatibility) */
        blanco:       "#FFFFFF",
        fucsia:       "var(--edu-pink-500)",
        naranja:      "#FA6D00",
        amarillo:     "var(--edu-yellow-500)",
        exito:        "var(--color-success)",
        error:        "var(--color-error)",
        advertencia:  "var(--color-warning)",
      },

      /* ── Typography ── */
      fontFamily: {
        sans:    ["Inter", "DM Sans", "system-ui", "sans-serif"],
        display: ["Poppins", "Plus Jakarta Sans", "Inter", "sans-serif"],
        mono:    ["Fira Code", "Cascadia Code", "Consolas", "monospace"],
      },

      /* ── Radius ── */
      borderRadius: {
        xs:   "var(--radius-xs)",
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        "2xl":"var(--radius-2xl)",
        "3xl":"var(--radius-3xl)",
        full: "var(--radius-full)",
        /* Legacy */
        neum:   "1rem",
        neumLg: "2rem",
      },

      /* ── Shadows ── */
      boxShadow: {
        xs:    "var(--shadow-xs)",
        sm:    "var(--shadow-sm)",
        md:    "var(--shadow-md)",
        lg:    "var(--shadow-lg)",
        xl:    "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        card:  "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        modal: "var(--shadow-modal)",
        brand: "var(--shadow-brand)",
        focus: "var(--shadow-focus)",
        /* Clay */
        "clay-sm": "var(--clay-shadow-sm)",
        "clay-md": "var(--clay-shadow-md)",
        "clay-lg": "var(--clay-shadow-lg)",
        /* Legacy */
        neum:      "8px 8px 15px #d1d9e6, -8px -8px 15px #ffffff",
        neumInset: "inset 8px 8px 15px #d1d9e6, inset -8px -8px 15px #ffffff",
      },

      /* ── Transitions ── */
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "300ms",
      },
    },
  },
  plugins: [],
};
