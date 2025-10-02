import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { lg: "960px" } },
    extend: {
      fontFamily: { sans: ['ui-sans-serif','system-ui','Inter','-apple-system','Segoe UI','Roboto'] },
      colors: {
        // 高对比但不过分，接近 Vercel 的灰阶
        base: {
          bg: "#0a0a0a",           // 仅暗色时使用（我们默认浅色）
          border: "#e5e5e5",
          hover: "#1111110d",
          text: "#0a0a0a",
          subtle: "#6b7280",
        },
        brand: { 600: "#111111", 700: "#000000" },
        success: { 600: "#16a34a" },
        warn: { 600: "#ca8a04" },
        error: { 600: "#dc2626" },
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,.06)",
      },
      borderRadius: { xl: "14px", "2xl": "20px" },
    },
  },
  plugins: [],
} satisfies Config;
