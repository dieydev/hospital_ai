/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        medical: {
          primary: '#0284c7',       // Sky 600
          dark: '#0369a1',          // Sky 700
          light: '#f0f9ff',         // Sky 50
          border: '#bae6fd',        // Sky 200
          textMain: '#0f172a',      // Slate 900
          textSub: '#334155',       // Slate 700
          textMuted: '#64748b',     // Slate 500
          textPlaceholder: '#94a3b8', // Slate 400
        },
      },
      boxShadow: {
        medical: '0 10px 30px rgba(2, 132, 199, 0.1)',
        glow: '0 0 20px rgba(2, 132, 199, 0.25)',
      },
      backgroundImage: {
        'medical-gradient': 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e2e8f0 100%)',
        'medical-dark-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
      },
    },
  },
  plugins: [],
};
