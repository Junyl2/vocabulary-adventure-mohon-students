/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 18px 45px rgba(20, 75, 120, 0.16)',
        pop: '0 10px 0 rgba(14, 116, 144, 0.24)',
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
        pop: 'pop 320ms ease-out',
        shake: 'shake 360ms ease-in-out',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-7px)' },
          '75%': { transform: 'translateX(7px)' },
        },
      },
    },
  },
  plugins: [],
};
