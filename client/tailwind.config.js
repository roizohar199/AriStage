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
          orange: "#F59E0B", // 🍊 צבע כתום עיקרי
          orangeLight: "#ffb93f", // ✨ צבע כתום בהיר להובר/הארה
          orangeDark: "#ce8200", // ✨ צבע כתום כהה להובר/הארה
        },
        neutral: {
          950: "rgb(var(--neutral-950) / <alpha-value>)",
          900: "rgb(var(--neutral-900) / <alpha-value>)",
          800: "rgb(var(--neutral-800) / <alpha-value>)",
          700: "rgb(var(--neutral-700) / <alpha-value>)",
          600: "rgb(var(--neutral-600) / <alpha-value>)",
          400: "rgb(var(--neutral-400) / <alpha-value>)",
          300: "rgb(var(--neutral-300) / <alpha-value>)",
          200: "rgb(var(--neutral-200) / <alpha-value>)",
          100: "rgb(var(--neutral-100) / <alpha-value>)",
        },
      },

      // 🟧 צללים
      boxShadow: {
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
      keyframes: {
        "fade-slide": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-slide": "fade-slide 0.3s ease-out",
      },

      // ⚡ זמן מעבר
      transitionDuration: {
        200: "200ms",
        300: "300ms",
      },
    },
  },
  plugins: [
    plugin(({ addBase, theme }) => {
      const brandOrange = theme("colors.brand.orange");
      const channels = hexToRgbChannels(brandOrange);
      if (!channels) return;

      addBase({
        ":root": {
          "--tw-color-brand-orange": channels.join(" "),
        },
      });
    }),
  ],
};
