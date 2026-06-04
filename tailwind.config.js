import tailwindAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app.js",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        panel: 'var(--bg-panel)',
        muted: 'var(--bg-muted)',
        elevated: 'var(--bg-elevated)',
        main: 'var(--text-main)',
        'text-muted': 'var(--text-muted)',
        'border-main': 'var(--border-main)',
        'border-subtle': 'var(--border-subtle)',
        accent: {
          DEFAULT: 'var(--accent-bg)',
          fg: 'var(--accent-fg)',
          text: 'var(--accent-text)',
          muted: 'var(--accent-muted)',
          border: 'var(--accent-border)',
        },
      },
      boxShadow: {
        'accent': 'var(--shadow-accent)',
        'sm-themed': 'var(--shadow-sm)',
        'md-themed': 'var(--shadow-md)',
        'soft': '0 2px 10px rgba(0,0,0,0.05)',
        'elevated': '0 10px 30px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [
    tailwindAnimate,
  ],
}
