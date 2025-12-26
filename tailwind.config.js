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
          'bg-dark': '#121212',
          surface: '#FFFFFF',
          'surface-dark': '#1E1E1E',
          card: '#FFFFFF',
          'card-dark': '#1E1E1E',
          soft: '#E8F4F2',
          'soft-dark': '#282828',
          text: '#0D1B2A',
          'text-dark': '#EAEAEA',
          muted: '#6B7A8F',
          'muted-dark': '#A0A0A0',
          border: '#D1DDE6',
          'border-dark': '#333333',
          brand: '#FF4500',
          'brand-dark': '#FF4500',
          accent: '#FFD700',
          'accent-dark': '#FFD700',
          success: '#32CD32',
          'success-dark': '#32CD32',
          danger: '#FF4500',
          'danger-dark': '#FF4500',
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
