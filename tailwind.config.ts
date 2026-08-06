import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        koinonia: {
          navy: '#0F172A',     // Primary structural (slate-900)
          amber: '#D97706',    // Primary action / Warm Light (amber-600)
          olive: '#15803D',    // Prayer / Intercession (green-700)
          burgundy: '#881337', // Worship highlight (rose-900)
          parchment: '#FAF8F5' // Warm light surface
        }
      },
      fontFamily: {
        serif: ['var(--font-cinzel)', 'Georgia', 'serif'],
        sans: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

export default config;
