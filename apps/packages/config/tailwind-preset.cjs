/** Shared Tailwind design tokens for every app in the marketplace. */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#111827",
          50: "#F3F4F6",
          100: "#E5E7EB",
          200: "#D1D5DB",
          300: "#9CA3AF",
          400: "#6B7280",
          500: "#4B5563",
          600: "#374151",
          700: "#1F2937",
          800: "#161E2E",
          900: "#111827",
        },
        secondary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        accent: {
          DEFAULT: "#14B8A6",
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
        },
        background: "#F9FAFB",
        surface: "#FFFFFF",
        border: "#E5E7EB",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        link: "#2563EB",
        dark: {
          background: "#0B0F19",
          surface: "#111827",
          border: "#1F2937",
        },
      },
      fontFamily: {
        heading: ["Sora", "Urbanist", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Urbanist", "Sora", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Sora", "Urbanist", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 8px 0 rgb(17 24 39 / 0.06)",
        card: "0 4px 20px -2px rgb(17 24 39 / 0.08)",
        glass: "0 8px 32px 0 rgb(17 24 39 / 0.10)",
        "glass-dark": "0 8px 32px 0 rgb(0 0 0 / 0.35)",
        glow: "0 0 25px -5px rgba(37, 99, 235, 0.4)",
        "glow-accent": "0 0 25px -5px rgba(20, 184, 166, 0.4)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(4%, -6%) scale(1.05)" },
          "66%": { transform: "translate(-3%, 3%) scale(0.97)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.4s infinite linear",
        marquee: "marquee 28s linear infinite",
        blob: "blob 16s ease-in-out infinite",
      },
      backgroundImage: {
        noise:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
