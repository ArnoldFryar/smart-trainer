/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./ui/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'hsl(var(--primary-50) / <alpha-value>)',
          100: 'hsl(var(--primary-100) / <alpha-value>)',
          200: 'hsl(var(--primary-200) / <alpha-value>)',
          300: 'hsl(var(--primary-300) / <alpha-value>)',
          400: 'hsl(var(--primary-400) / <alpha-value>)',
          500: 'hsl(var(--primary-500) / <alpha-value>)',
          600: 'hsl(var(--primary-600) / <alpha-value>)',
          700: 'hsl(var(--primary-700) / <alpha-value>)',
          800: 'hsl(var(--primary-800) / <alpha-value>)',
          900: 'hsl(var(--primary-900) / <alpha-value>)',
        },
        gray: {
          50: 'hsl(var(--gray-50) / <alpha-value>)',
          100: 'hsl(var(--gray-100) / <alpha-value>)',
          200: 'hsl(var(--gray-200) / <alpha-value>)',
          300: 'hsl(var(--gray-300) / <alpha-value>)',
          400: 'hsl(var(--gray-400) / <alpha-value>)',
          500: 'hsl(var(--gray-500) / <alpha-value>)',
          600: 'hsl(var(--gray-600) / <alpha-value>)',
          700: 'hsl(var(--gray-700) / <alpha-value>)',
          800: 'hsl(var(--gray-800) / <alpha-value>)',
          900: 'hsl(var(--gray-900) / <alpha-value>)',
        }
      }
    }
  },
  plugins: [],
}
