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
        'pbg-ink': '#0F172A',           // Bold Slate-900 Ink Black
        'pbg-canvas': '#FFFDF5',        // Warm Vintage Paper Canvas
        'pbg-yellow': '#FFE600',        // Vivid Canary Yellow
        'pbg-yellow-soft': '#FEF08A',   // Pastel Sunshine Yellow
        'pbg-emerald': '#059669',       // Purbalingga Forest Emerald
        'pbg-green-vivid': '#10B981',   // Punchy Vibrant Green
        'pbg-mint': '#A7F3D0',          // Fresh Crisp Mint
        'pbg-blue': '#0284C7',          // Civic Royal Blue
        'pbg-sky': '#38BDF8',           // Electric Sky Cyan
        'pbg-ice': '#E0F2FE',           // Pastel Sky Tint
        'pbg-purple': '#8B5CF6',        // Vibrant Amethyst Violet
        'pbg-lavender': '#DDD6FE',      // Soft Lavender / Lilac
        'pbg-coral': '#F43F5E',         // Radiant Coral Rose
        'pbg-rose-soft': '#FFE4E6',     // Delicate Rose Tint
        'pbg-orange': '#F97316',        // Tangerine Sunset Orange
        'pbg-peach': '#FED7AA',         // Warm Pastel Peach
      },
      boxShadow: {
        'brutal-xs': '1.5px 1.5px 0px #0F172A',
        'brutal-sm': '2px 2px 0px #0F172A',
        'brutal': '4px 4px 0px #0F172A',
        'brutal-md': '5px 5px 0px #0F172A',
        'brutal-lg': '6px 6px 0px #0F172A',
        'brutal-xl': '8px 8px 0px #0F172A',
        // Colorful solid drop shadows
        'brutal-yellow': '4px 4px 0px #CA8A04',
        'brutal-emerald': '4px 4px 0px #047857',
        'brutal-blue': '4px 4px 0px #0369A1',
        'brutal-purple': '4px 4px 0px #6D28D9',
        'brutal-coral': '4px 4px 0px #BE123C',
        'brutal-orange': '4px 4px 0px #C2410C',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};

export default config;

