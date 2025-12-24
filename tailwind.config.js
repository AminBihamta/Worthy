/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#F6F5F2',
          'bg-dark': '#0E0F12',
          surface: '#FFFFFF',
          'surface-dark': '#15171C',
          card: '#FFFFFF',
          'card-dark': '#1B1E24',
          soft: '#F1F1EE',
          'soft-dark': '#23262E',
          text: '#101114',
          'text-dark': '#F5F7FA',
          muted: '#8D929B',
          'muted-dark': '#9AA2AE',
          border: '#E7E5E0',
          'border-dark': '#262A33',
          brand: '#101114',
          'brand-dark': '#F5F7FA',
          accent: '#FFB347',
          'accent-dark': '#FFC773',
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
