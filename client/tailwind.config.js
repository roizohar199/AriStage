import plugin from "tailwindcss/plugin";

const hexToRgbChannels = (hex) => {
  if (!hex) return null;
  const normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    const [r, g, b] = normalized.split("").map((c) => parseInt(c + c, 16));
    return [r, g, b];
  }
  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "rgb(var(--brand-primary) / <alpha-value>)",
          primaryLight: "rgb(var(--brand-primary-light) / <alpha-value>)",
          primaryDark: "rgb(var(--brand-primary-dark) / <alpha-value>)",
        },
        neutral: {
          999: "rgb(var(--neutral-999) / <alpha-value>)",
          950: "rgb(var(--neutral-950) / <alpha-value>)",
          900: "rgb(var(--neutral-900) / <alpha-value>)",
          850: "rgb(var(--neutral-850) / <alpha-value>)",
          800: "rgb(var(--neutral-800) / <alpha-value>)",
          750: "rgb(var(--neutral-750) / <alpha-value>)",
          700: "rgb(var(--neutral-700) / <alpha-value>)",
          650: "rgb(var(--neutral-650) / <alpha-value>)",
          600: "rgb(var(--neutral-600) / <alpha-value>)",
          550: "rgb(var(--neutral-550) / <alpha-value>)",
          500: "rgb(var(--neutral-500) / <alpha-value>)",
          450: "rgb(var(--neutral-450) / <alpha-value>)",
          400: "rgb(var(--neutral-400) / <alpha-value>)",
          350: "rgb(var(--neutral-350) / <alpha-value>)",
          300: "rgb(var(--neutral-300) / <alpha-value>)",
          250: "rgb(var(--neutral-250) / <alpha-value>)",
          200: "rgb(var(--neutral-200) / <alpha-value>)",
          150: "rgb(var(--neutral-150) / <alpha-value>)",
          100: "rgb(var(--neutral-100) / <alpha-value>)",
          50: "rgb(var(--neutral-50) / <alpha-value>)",
        },
      },

      // 🌫️ זכוכית
      backdropBlur: {
        glass: "20px",
      },

      // 🟧 צללים (אחד, מאוחד, נכון)
      boxShadow: {
        // semantic (tokens from CSS vars)
        surface: "var(--shadow-surface)",
        raised: "var(--shadow-raised)",
        floating: "var(--shadow-floating)",
        overlay: "var(--shadow-overlay)",
        pressed: "var(--shadow-pressed)",

        // legacy / special
        ios: "0 4px 30px rgba(0,0,0,0.1)",
        innerIos: "inset 0 1px rgba(255,255,255,0.08)",
        glow: "0 0 12px rgba(255,136,0,0.4)",
      },

      // ✍️ פונט
      fontFamily: {
        assistant: ["Assistant", "system-ui", "sans-serif"],
      },

      // 🔘 פינות עגולות
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },

      // ⏱️ אנימציות
      // NOTE: Motion is centralized as semantic tokens in src/src/styles/index.css

      // ⚡ זמן מעבר
      transitionDuration: {
        200: "200ms",
        300: "300ms",
      },
    },
  },
  plugins: [
    // NOTE: יש לך brand.primary/primaryLight/primaryDark, אין "brand.primary".
    // לכן מחליפים ל-primary כדי שה-plugin באמת יעבוד.
    plugin(({ addBase, theme }) => {
      const brandPrimary = theme("colors.brand.primary"); // "rgb(var(--brand-primary) / <alpha-value>)"
      // מזה לא HEX ולכן אי אפשר hexToRgbChannels.
      // אם אתה רוצה באמת channels, תגדיר HEX קבוע (או תמחוק את plugin הזה).
      // כרגע אני משאיר אותו כבוי (לא עושה כלום) כדי לא לשבור build.
      void brandPrimary;
      addBase({});
    }),

    plugin(({ addComponents, theme }) => {
      addComponents({
        // -----------------
        // Typography
        // -----------------
        ".h-page": {
          fontSize: theme("fontSize.2xl"),
          fontWeight: theme("fontWeight.semibold"),
          color: theme("colors.neutral.100"),
        },
        ".h-section": {
          fontSize: theme("fontSize.xl"),
          fontWeight: theme("fontWeight.medium"),
          color: theme("colors.neutral.100"),
        },
        ".h-card": {
          fontSize: theme("fontSize.lg"),
          fontWeight: theme("fontWeight.medium"),
          color: theme("colors.neutral.100"),
        },
        ".text-body": {
          fontSize: theme("fontSize.base"),
          color: theme("colors.neutral.200"),
        },
        ".text-label": {
          fontSize: theme("fontSize.sm"),
          color: theme("colors.neutral.300"),
        },
        ".text-meta": {
          fontSize: theme("fontSize.xs"),
          color: theme("colors.neutral.400"),
        },
        ".text-disabled": {
          fontSize: theme("fontSize.sm"),
          color: theme("colors.neutral.450"),
        },

        // -----------------
        // Buttons
        // -----------------
        ".btn-primary": {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: theme("spacing.2"),
          fontSize: theme("fontSize.sm"),
          fontWeight: theme("fontWeight.medium"),
          borderRadius: theme("borderRadius.xl"),
          transitionProperty: "all",
          transitionDuration: theme("transitionDuration.200"),
          paddingLeft: theme("spacing.4"),
          paddingRight: theme("spacing.4"),
          paddingTop: theme("spacing.2"),
          paddingBottom: theme("spacing.2"),
          backgroundColor: theme("colors.brand.primary"),
          color: theme("colors.neutral.100"),

          // מומלץ: להשתמש בצל הסמנטי
          boxShadow: theme("boxShadow.raised"),

          "&:hover": {
            backgroundColor: theme("colors.brand.primaryLight"),
          },
          "&:active": {
            backgroundColor: theme("colors.brand.primaryDark"),
            boxShadow: theme("boxShadow.pressed"),
          },
          "&:focus": {
            outline: "none",
          },

          // IMPORTANT: ringWidth/ringColor זה לא CSS תקין כאן.
          // אם אתה רוצה focus ring, תשתמש ב-boxShadow או outline.
          "&:focus-visible": {
            boxShadow: `0 0 0 2px ${theme(
              "colors.brand.primaryLight",
            )}, 0 0 0 4px ${theme("colors.neutral.950")}`,
          },
        },

        ".btn-secondary": {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: theme("spacing.2"),
          fontSize: theme("fontSize.sm"),
          fontWeight: theme("fontWeight.medium"),
          borderRadius: theme("borderRadius.xl"),
          transitionProperty: "all",
          transitionDuration: theme("transitionDuration.200"),
          paddingLeft: theme("spacing.4"),
          paddingRight: theme("spacing.4"),
          paddingTop: theme("spacing.2"),
          paddingBottom: theme("spacing.2"),
          backgroundColor: theme("colors.neutral.800"),
          color: theme("colors.neutral.100"),

          boxShadow: theme("boxShadow.surface"),

          "&:hover": {
            backgroundColor: theme("colors.neutral.750"),
            boxShadow: theme("boxShadow.raised"),
          },
          "&:active": {
            backgroundColor: theme("colors.neutral.700"),
            boxShadow: theme("boxShadow.pressed"),
          },
          "&:focus": {
            outline: "none",
          },
          "&:focus-visible": {
            boxShadow: `0 0 0 2px ${theme(
              "colors.neutral.600",
            )}, 0 0 0 4px ${theme("colors.neutral.950")}`,
          },
        },

        // -----------------
        // Table / List Helpers
        // -----------------
        ".table-header": {
          fontSize: theme("fontSize.sm"),
          fontWeight: theme("fontWeight.medium"),
          color: theme("colors.neutral.300"),
        },
        ".table-cell": {
          fontSize: theme("fontSize.base"),
          color: theme("colors.neutral.200"),
        },
        ".table-meta": {
          fontSize: theme("fontSize.xs"),
          color: theme("colors.neutral.400"),
        },
      });
    }),
  ],
};
