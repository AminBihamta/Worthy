/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#F8FAFB',
          'bg-dark': '#0D1117',
          surface: '#FFFFFF',
          'surface-dark': '#161B22',
          card: '#FFFFFF',
          'card-dark': '#1C2432',
          soft: '#E8F4F2',
          'soft-dark': '#243447',
          text: '#0D1B2A',
          'text-dark': '#E6EDF3',
          muted: '#6B7A8F',
          'muted-dark': '#8B949E',
          border: '#D1DDE6',
          'border-dark': '#30363D',
          brand: '#0A9396',
          'brand-dark': '#58D5D8',
          accent: '#EE9B00',
          'accent-dark': '#FFB703',
          success: '#38B000',
          'success-dark': '#3FB950',
          danger: '#D62828',
          'danger-dark': '#F85149',
        },
      },
      borderRadius: {
        xl: '18px',
        '2xl': '24px',
        '3xl': '28px',
      },
      fontFamily: {
        body: ['Manrope_400Regular'],
        display: ['Manrope_600SemiBold'],
        emphasis: ['Manrope_500Medium'],
        strong: ['Manrope_700Bold'],
      },
    },
  },
  plugins: [],
};
