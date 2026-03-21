/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#070F0D',
        bg2:     '#0A1714',
        bg3:     '#0E1E1A',
        bg4:     '#122420',
        teal:    '#00E5C3',
        'teal-dark': '#00B89E',
        white:   '#EEF2F1',
        grey:    '#7A9490',
        grey2:   '#3D5550',
        red:     '#e24b4a',
        amber:   '#ef9f27',
        green:   '#1D9E75',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        mono:    ['"DM Mono"', 'monospace'],
        sans:    ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
}