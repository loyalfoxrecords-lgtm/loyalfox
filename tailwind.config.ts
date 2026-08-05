import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          neon: "#39ff14",
          dim: "rgba(57,255,20,0.15)",
          faint: "rgba(57,255,20,0.06)",
        },
        black: {
          DEFAULT: "#060606",
          2: "#0e0e0e",
          3: "#161616",
          4: "#202020",
        },
        muted: "#555",
      },
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        mono: ["Share Tech Mono", "monospace"],
        body: ["Barlow", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
