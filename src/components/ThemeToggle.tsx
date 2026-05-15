'use client';

import { useTheme, useThemeContext } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
      style={{ 
        backgroundColor: isDark ? 'rgba(74,122,168,0.2)' : 'rgba(57,99,139,0.1)',
        border: `1px solid ${isDark ? 'rgba(74,122,168,0.3)' : 'rgba(138,176,209,0.3)'}`
      }}
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      {isDark ? (
        <Sun className="w-4 h-4" style={{ color: '#fbbf24' }} />
      ) : (
        <Moon className="w-4 h-4" style={{ color: '#39638b' }} />
      )}
    </button>
  );
}
