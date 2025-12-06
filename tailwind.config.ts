import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Casa Exchange theme colors
        gold: {
          DEFAULT: '#D4AF37', // Primary gold
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#D4AF37',
          600: '#B8960F',
          700: '#92750D',
          800: '#78620B',
          900: '#5C4A08',
        },
        cream: {
          DEFAULT: '#FDF8F0', // Primary cream
          50: '#FFFDF9',
          100: '#FDF8F0',
          200: '#FAF0E1',
          300: '#F5E6D0',
        },
        ink: {
          DEFAULT: '#1A1A1A', // Primary dark
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#D4D4D4',
          300: '#A3A3A3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#262626',
          800: '#1A1A1A',
          900: '#0F0F0F',
        },
        accent: {
          DEFAULT: '#8B4513', // Saddle brown
          500: '#8B4513',
          600: '#723A0F',
          700: '#5A2E0C',
        },
      },
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(212, 175, 55, 0.1), 0 2px 4px -1px rgba(212, 175, 55, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(212, 175, 55, 0.15), 0 4px 6px -2px rgba(212, 175, 55, 0.1)',
        'gold': '0 0 20px rgba(212, 175, 55, 0.3)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(212, 175, 55, 0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config

