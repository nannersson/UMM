/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./dist/**/*.{html,js}"
  ],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      {
        mytheme: {
          
          "primary": "#0d9488",
          "secondary": "#d926a9",
          "accent": "#1FB2A6",
          "neutral": "#d1fae5",
          "base-100": "#101814",
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#dc2626",
        }
      }
    ]
  },
  plugins: [
    require('daisyui')
  ],
}
