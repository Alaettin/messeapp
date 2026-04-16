/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#FFFFFF',
          surface: '#F8F8F8',
          elevated: '#FFFFFF',
          input: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#00A587',
          hover: '#006150',
          muted: '#E6F7F3',
        },
        border: {
          DEFAULT: '#E5E7EB',
          hover: '#D1D5DB',
          accent: '#00A587',
        },
        txt: {
          primary: '#3B4846',
          secondary: '#949A93',
          muted: '#B0B5AF',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 165, 135, 0.15)',
        'glow-lg': '0 0 30px rgba(0, 165, 135, 0.25)',
      },
    },
  },
  plugins: [],
};
