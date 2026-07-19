import type { Config } from "tailwindcss";

// Extends the standard shadcn/Tailwind tokens with the Meno brand palette from
// Practical_Data_Jobs_Site (src/styles/theme.css) so the ported landing page
// renders identically. Brand scale = blue (primary) + cyan (accent); the
// default shadcn neutrals (background/foreground/muted) stay for the app UI.
export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn-style neutrals (app UI)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Meno brand palette (landing page)
        brand: {
          white: "#ffffff",
          "blue-50": "#eff6ff",
          "blue-100": "#dbeafe",
          "blue-500": "#3b82f6",
          "blue-600": "#2563eb",
          "blue-700": "#1d4ed8",
          "cyan-50": "#ecfeff",
          "cyan-100": "#cffafe",
          "cyan-400": "#22d3ee",
          "cyan-500": "#06b6d4",
          "cyan-600": "#0891b2",
          ink: "#0f172a",
          "ink-soft": "#334155",
          slate: "#64748b",
          "slate-2": "#94a3b8",
          muted: "#f8fafc",
          line: "#e2e8f0",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
