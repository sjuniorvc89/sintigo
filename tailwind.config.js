/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        migo: {
          dark: '#060912',
          card: '#0E1526',
          cardHover: '#131D30',
          border: '#1E2D4A',
          accent: '#6366F1',
          accentHover: '#4F46E5',
          sarcasm: '#F43F5E',
          success: '#10B981',
          warning: '#F59E0B',
          cyan: '#06B6D4',
          purple: '#8B5CF6',
        }
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(-1deg)' },
          '66%': { transform: 'translateY(-5px) rotate(1deg)' },
        },
        floatLarge: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        bounce_enter: {
          '0%': { transform: 'scale(0.3) translateY(40px)', opacity: '0' },
          '60%': { transform: 'scale(1.08) translateY(-8px)', opacity: '1' },
          '80%': { transform: 'scale(0.96) translateY(3px)' },
          '100%': { transform: 'scale(1) translateY(0px)', opacity: '1' },
        },
        celebrate: {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '15%': { transform: 'scale(1.15) rotate(-8deg)' },
          '30%': { transform: 'scale(1.2) rotate(8deg)' },
          '45%': { transform: 'scale(1.15) rotate(-5deg)' },
          '60%': { transform: 'scale(1.1) rotate(5deg)' },
          '75%': { transform: 'scale(1.05) rotate(-2deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        shame: {
          '0%': { transform: 'scale(1) translateX(0px)' },
          '10%': { transform: 'scale(0.95) translateX(-6px)' },
          '20%': { transform: 'scale(0.95) translateX(6px)' },
          '30%': { transform: 'scale(0.95) translateX(-4px)' },
          '40%': { transform: 'scale(0.95) translateX(4px)' },
          '50%': { transform: 'scale(0.98) translateX(0px)' },
          '100%': { transform: 'scale(1) translateX(0px)' },
        },
        thinking: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-4px) rotate(3deg)' },
          '75%': { transform: 'translateY(-2px) rotate(-2deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.12)' },
        },
        glow_success: {
          '0%, 100%': { boxShadow: '0 0 20px 4px rgba(16, 185, 129, 0.3)' },
          '50%': { boxShadow: '0 0 50px 12px rgba(16, 185, 129, 0.6)' },
        },
        glow_error: {
          '0%, 100%': { boxShadow: '0 0 20px 4px rgba(244, 63, 94, 0.3)' },
          '50%': { boxShadow: '0 0 50px 12px rgba(244, 63, 94, 0.6)' },
        },
        wave: {
          '0%, 100%': { height: '8px' },
          '50%': { height: '36px' },
        },
        slide_up: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0px)', opacity: '1' },
        },
        slide_in_right: {
          '0%': { transform: 'translateX(24px)', opacity: '0' },
          '100%': { transform: 'translateX(0px)', opacity: '1' },
        },
        option_pop: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '60%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        xp_fill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--xp-width)' },
        },
        particle_fly: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(var(--tx), var(--ty)) scale(0)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        floatLarge: 'floatLarge 5s ease-in-out infinite',
        bounce_enter: 'bounce_enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        celebrate: 'celebrate 0.8s ease-in-out forwards',
        shame: 'shame 0.7s ease-in-out forwards',
        thinking: 'thinking 2s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.5s ease-in-out infinite',
        glow_success: 'glow_success 1.5s ease-in-out infinite',
        glow_error: 'glow_error 1.5s ease-in-out infinite',
        wave: 'wave 1s ease-in-out infinite',
        slide_up: 'slide_up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slide_in_right: 'slide_in_right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        option_pop: 'option_pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        shimmer: 'shimmer 2.5s linear infinite',
      }
    },
  },
  plugins: [],
}
