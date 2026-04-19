import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      backgroundImage: {
        aurora:
          "radial-gradient(circle at top left, rgba(255,255,255,0.35), transparent 28%), radial-gradient(circle at top right, rgba(113,214,255,0.22), transparent 32%), linear-gradient(135deg, rgba(9,18,35,0.18), rgba(10,43,82,0.32))"
      },
      boxShadow: {
        glass:
          "0 24px 80px rgba(15, 23, 42, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.28)"
      },
      fontFamily: {
        sans: ["SF Pro Display", "Pretendard", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
