import React, { createContext, useContext, useEffect } from 'react';

type Theme = 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    try {
      localStorage.setItem('skillcame-theme', 'dark');
    } catch (e) {
      // In private browsing or sandbox
    }
  }, []);

  const toggleTheme = () => {
    // Disabled for dark-mode only SaaS platform
  };

  const setTheme = () => {
    // Disabled for dark-mode only SaaS platform
  };

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

