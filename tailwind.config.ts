import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#58CC02",
        "primary-dark": "#3C9A00",
        "secondary": "#FF9600",
        "tertiary": "#8B5CF6",
        "success": "#22C55E",
        "error": "#FF6B6B",
        "background": "#FFF8F0",
        "surface": "#FFFFFF",
        "surface-border": "#F5EFE6",
        "text-primary": "#2D2A26",
        "text-muted": "#8B8578",
        "locked": "#D1D5DB",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "full": "9999px",
      },
      fontFamily: {
        "headline-xl": ["var(--font-rubik)", "sans-serif"],
        "headline-lg": ["var(--font-rubik)", "sans-serif"],
        "headline-md": ["var(--font-rubik)", "sans-serif"],
        "headline-2xl": ["var(--font-rubik)", "sans-serif"],
        "label-lg": ["var(--font-rubik)", "sans-serif"],
        "label-md": ["var(--font-rubik)", "sans-serif"],
        "label-sm": ["var(--font-rubik)", "sans-serif"],
        "body-lg": ["var(--font-nunito-sans)", "sans-serif"],
        "body-md": ["var(--font-nunito-sans)", "sans-serif"],
        "body-sm": ["var(--font-nunito-sans)", "sans-serif"],
        "body-xs": ["var(--font-nunito-sans)", "sans-serif"],
      },
      boxShadow: {
        "clay-primary": "0 8px 24px rgba(92, 154, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4)",
        "clay-primary-pressed": "0 2px 8px rgba(92, 154, 0, 0.2), inset 0 2px 8px rgba(92, 154, 0, 0.15)",
        "clay-secondary": "0 8px 24px rgba(255, 150, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4)",
        "clay-secondary-pressed": "0 2px 8px rgba(255, 150, 0, 0.2), inset 0 2px 8px rgba(255, 150, 0, 0.15)",
        "clay-tertiary": "0 8px 24px rgba(139, 92, 246, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4)",
        "clay-tertiary-pressed": "0 2px 8px rgba(139, 92, 246, 0.2), inset 0 2px 8px rgba(139, 92, 246, 0.15)",
        "clay-surface": "0 8px 24px rgba(45, 42, 38, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.6)",
        "clay-surface-pressed": "0 2px 8px rgba(45, 42, 38, 0.05), inset 0 2px 8px rgba(45, 42, 38, 0.03)",
        "clay-success": "0 8px 24px rgba(34, 197, 94, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4)",
        "clay-error": "0 8px 24px rgba(255, 107, 107, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4)",
        "subtle": "0 1px 8px rgba(0,0,0,0.04)",
        "glow": "0 2px 0 0 #22c55e",
      },
    },
  },
  plugins: [],
};

export default config;
