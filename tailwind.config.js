/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: "#0f172a",
          hover: "#1e293b",
          active: "#1d4ed8",
          text: "#94a3b8",
          "text-active": "#f8fafc",
        },
        header: {
          bg: "#ffffff",
          border: "#e2e8f0",
        },
      },
    },
  },
  plugins: [],
};


