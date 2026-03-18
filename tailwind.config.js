/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'display': ['"Questrial"', 'sans-serif'],
        'body': ['"Poppins"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          amber: '#C6842A',
          'amber-dark': '#A66B1A',
          'amber-light': '#E8B86D',
          cream: '#fdf3e4',
          charcoal: '#2d2a26',
          warm: '#5c5650',
        },
      }
    },
  },
  plugins: [],
}
