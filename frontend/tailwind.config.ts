import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pbg-green': '#059669',
        'pbg-yellow': '#FFE600',
        'pbg-canvas': '#FFFDF8',
        'pbg-ink': '#121212',
        'pbg-coral': '#FF5C5C',
        'pbg-blue': '#38BDF8',
        'pbg-purple': '#C4B5FD',
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px #121212',
        'brutal': '4px 4px 0px #121212',
        'brutal-lg': '6px 6px 0px #121212',
        'brutal-xl': '8px 8px 0px #121212',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};

export default config;
