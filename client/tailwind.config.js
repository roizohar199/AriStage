/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FF8800", // 🍊 צבע כתום עיקרי
          orangeLight: "#FFAE42", // ✨ צבע כתום בהיר להובר/הארה
          dark: "#0A0A0A", // 🖤 רקע כהה ראשי
          mid: "#1C1C1E", // 🌑 אפור כהה
          light: "#F2F2F7", // ☁️ טקסט/רקע בהיר
        },
        neutral: {
          950: "#0A0A0A",
          900: "#121212",
          800: "#1A1A1A",
        },
      },

      // 🌫️ זכוכית
      backdropBlur: {
        glass: "20px",
      },

      // 🟧 צללים
      boxShadow: {
        ios: "0 4px 30px rgba(0,0,0,0.1)",
        innerIos: "inset 0 1px rgba(255,255,255,0.08)",
        glow: "0 0 12px rgba(255,136,0,0.4)",
      },

      // ✍️ פונט
      fontFamily: {
        heebo: ["Heebo", "system-ui", "sans-serif"],
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
  plugins: [],
};
