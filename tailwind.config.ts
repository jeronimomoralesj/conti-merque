import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        merq: {
          orange: "#ff9900",
          "orange-dark": "#e68a00",
        },
      },
    },
  },
  plugins: [],
};
export default config;
