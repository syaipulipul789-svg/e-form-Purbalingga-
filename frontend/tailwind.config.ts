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
        'pbg-emerald': '#065F46',       // Deep Forest Emerald (resmi Pemkab)
        'pbg-emerald-light': '#059669',
        'pbg-slate': '#0F172A',         // Border & Text Slate pekat
        'pbg-canvas': '#F8FAFC',        // Background canvas bersih
        'pbg-accent': '#0284C7',        // Biru layanan publik
        'pbg-amber': '#D97706',         // Aksen emas elegan
        'pbg-muted': '#64748B',         // Teks sekunder slate
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px #0F172A',
        'brutal': '4px 4px 0px #0F172A',
        'brutal-lg': '6px 6px 0px #0F172A',
        'brutal-xl': '8px 8px 0px #0F172A',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};

export default config;
