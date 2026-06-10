import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          ink: "#101318",
          panel: "#181d24",
          line: "#2d3642",
          frost: "#e7eef7",
          signal: "#39c0d4",
          amber: "#f4b942",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

