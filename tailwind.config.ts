import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['ui-sans-serif', 'system-ui', 'Inter', 'Arial'] },
      colors: {
        brand: {
          600: '#0ea5e9',
          700: '#0284c7',
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
