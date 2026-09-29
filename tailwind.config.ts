import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1200px" } },
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Baloo 2", "cursive"],
        sans: ["var(--font-sans)", "Poppins", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-secure-foreground))",
        },
        bubble: {
          DEFAULT: "#a9d8ee",
          ink: "#274156",
        },
        surface: {
          DEFAULT: "#fbf6e8",
          alt: "#f0e9d8",
        },
        ink: {
          DEFAULT: "#3d2b18",
          muted: "#6b5842",
          soft: "#9a8064",
        },
        line: "#3d2b18",
        goldenrod: {
          DEFAULT: "#f2c14e",
        },
        mint: {
          DEFAULT: "#c0dfc6",
        },
        success: {
          DEFAULT: "#3d7a44",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      boxShadow: {
        card: "3px 3px 0 rgba(0,0,0,0.08)",
        control: "0 2px 0 0 rgba(0,0,0,0.25)",
        pop: "6px 6px 0 rgba(0,0,0,0.12)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease both",
      },
    },
  },
  plugins: [],
};
export default config;
