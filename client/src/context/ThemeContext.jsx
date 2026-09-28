import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
  DARK: 'dark',       // Cyber Obsidian (Default)
  LIGHT: 'light',     // Executive Daylight
  CYBER: 'cyber'      // Neon Command Center
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('infragrid_theme');
      return saved && Object.values(THEMES).includes(saved) ? saved : THEMES.DARK;
    } catch {
      return THEMES.DARK;
    }
  });

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('infragrid_theme', theme);
    } catch (e) {
      console.warn('Could not persist theme to localStorage', e);
    }
  }, [theme]);

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === THEMES.DARK) return THEMES.LIGHT;
      if (prev === THEMES.LIGHT) return THEMES.CYBER;
      return THEMES.DARK;
    });
  };

  const setSpecificTheme = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, cycleTheme, setTheme: setSpecificTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};

export default ThemeContext;
