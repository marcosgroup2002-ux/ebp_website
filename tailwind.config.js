export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ebp: {
          blue: "#002B9A",
          "blue-dark": "#001B6B",
          red: "#E50914",
          "red-soft": "#DC2626",
          green: "#00873D",
          "green-light": "#16A34A",
        },
        surface: "#FAFAFC",
        ink: "#0F172A",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      container: {
        center: true,
        padding: { DEFAULT: "1.25rem", lg: "2rem" },
      },
      boxShadow: {
        card: "0 20px 45px -20px rgba(0, 43, 154, 0.25)",
        soft: "0 10px 30px -12px rgba(15, 23, 42, 0.15)",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        glowShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        wave1: "wave 1.1s ease-in-out infinite",
        wave2: "wave 1.1s ease-in-out infinite 0.15s",
        wave3: "wave 1.1s ease-in-out infinite 0.3s",
        wave4: "wave 1.1s ease-in-out infinite 0.45s",
        wave5: "wave 1.1s ease-in-out infinite 0.6s",
        floatY: "floatY 4s ease-in-out infinite",
        pulseRing: "pulseRing 2s cubic-bezier(0,0,0.2,1) infinite",
        marquee: "marquee 35s linear infinite",
        glowShift: "glowShift 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}

