/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#283D2E',
        roast: '#967447',
        leaf: '#5F7F4F',
        matcha: {
          DEFAULT: '#967447',
          light: '#C9B99F',
        },
        cream: '#F7F2EA',
        tan: '#E9DDC8',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"PingFang TC"',
          '"Noto Sans TC"',
          '"Microsoft JhengHei"',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(80, 61, 38, 0.08)',
        card: '0 18px 44px rgba(80, 61, 38, 0.14)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
