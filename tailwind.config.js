/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8A2036', 
          hover: '#A32842',
        },
        secondary: {
          DEFAULT: '#1B3F36',
          hover: '#255449',
        },
        accent: {
          DEFAULT: '#CBA052',
          hover: '#DDB365',
        },
        background: '#F7F6F3',
        surface: '#FFFFFF'
      }
    },
  },
  plugins: [],
}