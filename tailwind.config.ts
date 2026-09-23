import type { Config } from "tailwindcss";

/**
 * Brand scale derived from #166534 (the 600 step). 50–200 are tints for
 * selected / hover fills, 700–900 are pressed states and text on tints.
 */
const brand = {
  50: "#F0F7F2",
  100: "#DCEEE2",
  200: "#B9DCC6",
  300: "#8CC4A2",
  400: "#55A578",
  500: "#2E8756",
  600: "#166534",
  700: "#125229",
  800: "#0F4222",
  900: "#0C361C",
  950: "#061E0F",
  DEFAULT: "#166534",
};

const config: Config = {
  content: [
    "./node_modules/flowbite-react/**/*.js",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./provider/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // SF on Apple devices; Inter (loaded by next/font) everywhere else.
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          "var(--font-inter)",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        brand,
        // Apple HIG light neutrals
        label: "#1D1D1F",
        "label-2": "#6E6E73",
        "label-3": "#86868B",
        "label-4": "#AEAEB2",
        separator: "#E5E5EA",
        surface: "hsl(var(--surface))",
        "surface-2": "hsl(var(--surface-2))",
        // legacy names still referenced in a few places
        primary_color: "#1D1D1F",
        text_primary_color: "#166534",
        input_bg: "#F5F5F7",
        // shadcn
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Layered, low-contrast shadows with a hairline edge, as in AppKit.
        "mac-sm": "0 0 0 1px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06)",
        mac: "0 0 0 1px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)",
        "mac-lg": "0 0 0 1px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.14)",
        "mac-inset": "inset 0 0 0 1px rgba(0,0,0,0.06)",
      },
      fontSize: {
        // macOS type ramp
        caption: ["11px", { lineHeight: "14px" }],
        footnote: ["12px", { lineHeight: "16px" }],
        body: ["13px", { lineHeight: "18px" }],
        callout: ["14px", { lineHeight: "20px" }],
        headline: ["15px", { lineHeight: "20px", fontWeight: "600" }],
        title3: ["17px", { lineHeight: "22px", fontWeight: "600" }],
        title2: ["20px", { lineHeight: "25px", fontWeight: "600" }],
        title1: ["24px", { lineHeight: "30px", fontWeight: "700" }],
      },
      keyframes: {
        slideInLeft: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        slideInLeft: "slideInLeft 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [require("flowbite/plugin"), require("tailwindcss-animate")],
};
export default config;
