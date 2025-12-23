/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#F7F6F2',
          'bg-dark': '#0E1111',
          surface: '#FFFFFF',
          'surface-dark': '#151A1A',
          card: '#FFFFFF',
          'card-dark': '#1B2223',
          text: '#1B1B1B',
          'text-dark': '#F4F6F8',
          muted: '#6B6F76',
          'muted-dark': '#A6ADB5',
          border: '#E6E4DF',
          'border-dark': '#2C3333',
          brand: '#2F6F62',
          'brand-dark': '#4EC3B5',
          accent: '#EFA640',
          'accent-dark': '#F1B457',
          danger: '#D64545',
        },
      },
      borderRadius: {
        xl: '18px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
