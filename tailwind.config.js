/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tm: {
          blue: '#004165',
          blueDark: '#002E48',
          maroon: '#772432',
          yellow: '#F2DF74',
          ink: '#1D2A33',
          muted: '#4E5B66',
          line: '#D4DCE3',
          bg: '#F4F6F8',
          tint: '#E6EEF5',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
