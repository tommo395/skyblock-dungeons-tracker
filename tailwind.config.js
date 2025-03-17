/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base backgrounds
        primary: '#0f172a',     // Dark blue background
        secondary: '#1e293b',   // Slightly lighter blue
        tertiary: '#334155',    // Even lighter blue accent
        accent: '#475569',      // Border color

        // Text colors
        "text-primary": '#f8fafc',   // Almost white
        "text-secondary": '#94a3b8', // Light gray
        "text-tertiary": '#64748b',  // Darker gray
        
        // Class colors
        "class-archer": '#84cc16',   // Green
        "class-mage": '#a855f7',     // Purple
        "class-tank": '#06b6d4',     // Cyan
        "class-berserk": '#ef4444',  // Red
        "class-healer": '#eab308',   // Yellow
        
        // Rarity colors
        "rarity-common": '#aaaaaa',
        "rarity-uncommon": '#55ff55',
        "rarity-rare": '#5555ff',
        "rarity-epic": '#aa00aa',
        "rarity-legendary": '#ffaa00',
        "rarity-mythic": '#ff55ff',
        
        // Score colors
        "score-splus": '#aa00aa',
        "score-s": '#ffaa00',
        "score-a": '#55ff55',
        "score-b": '#5555ff',
        "score-c": '#aaaaaa',
        
        // UI colors
        "ui-primary": '#3b82f6',     // Blue
        "ui-success": '#10b981',     // Green
        "ui-warning": '#f59e0b',     // Amber
        "ui-danger": '#ef4444',      // Red
        "ui-info": '#06b6d4',        // Cyan
        
        // Mode colors
        "mode-normal": '#3b82f6',    // Blue for normal mode
        "mode-master": '#dc2626',    // Red for master mode
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
      }
    }
  },
  plugins: [],
}