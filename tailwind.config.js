/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx, html}',
    './src/main/**/*.{js,jsx,ts,tsx,html}',
    './src/renderer/**/*.{js,jsx,ts,tsx,html}',
    './release/**/*.{html,erb}',
    './*.{html,erb}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
