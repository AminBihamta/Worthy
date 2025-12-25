/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#FFF1FA',
          'bg-dark': '#140A1E',
          surface: '#FFFFFF',
          'surface-dark': '#1C1326',
          card: '#FFFFFF',
          'card-dark': '#241733',
          soft: '#FFE0F2',
          'soft-dark': '#2E1B40',
          text: '#2C0C4D',
          'text-dark': '#F9E6F4',
          muted: '#8A6B9A',
          'muted-dark': '#C8A9C2',
          border: '#F2C7E3',
          'border-dark': '#3A254F',
          brand: '#5C2AAE',
          'brand-dark': '#7D3AE6',
          accent: '#FF4FB6',
          'accent-dark': '#FF63C1',
          success: '#2CB67D',
          danger: '#EF4444',
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
