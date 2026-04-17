/** @type {import('tailwindcss').Config} */
module.exports = {
  // Bổ sung thêm "./src/**/*.{js,jsx,ts,tsx}" để vét cạn code
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
