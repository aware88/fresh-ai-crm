/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'aris-blue': 'var(--aris-blue)',
        'aris-purple': 'var(--aris-purple)',
        'aris-pink': 'var(--aris-pink)',
      },
      backgroundImage: {
        'aris-gradient': 'linear-gradient(to right, var(--aris-blue), var(--aris-purple), var(--aris-pink))',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
