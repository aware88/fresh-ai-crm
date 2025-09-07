/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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
        card: {
          DEFAULT: 'var(--card-background)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--background)',
          foreground: 'var(--foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        sidebar: {
          DEFAULT: 'var(--sidebar-background)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
      backgroundImage: {
        'aris-gradient': 'linear-gradient(to right, var(--aris-blue), var(--aris-purple), var(--aris-pink))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
