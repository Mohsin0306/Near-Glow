import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Define theme values for Material-UI styling
export const themeValues = {
  light: {
    name: 'light',
    background: '#f9fafb',
    text: '#111827',
    textSecondary: '#4b5563',
    border: '#e5e7eb',
    card: '#ffffff',
    error: '#ef4444',
    divider: '#e5e7eb'
  },
  dark: {
    name: 'dark',
    background: '#111827',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    border: '#374151',
    card: '#1f2937',
    error: '#ef4444',
    divider: '#374151'
  },
  eyeCare: {
    name: 'eyeCare',
    background: '#F5E6D3',
    text: '#433422',
    textSecondary: '#6B5D4D',
    border: '#E6D5B8',
    card: '#FFF8ED',
    error: '#ef4444',
    divider: '#E6D5B8'
  }
};

// Tailwind classes for styling
export const themes = {
  light: {
    name: 'light',
    background: 'bg-gray-50',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    card: 'bg-white',
    cardHover: 'hover:shadow-xl',
    input: 'bg-white border-gray-200 focus:border-black',
    buttonPrimary: 'from-black to-gray-800 hover:from-gray-900 hover:to-gray-900 text-white',
    buttonSecondary: 'border-black text-black hover:bg-black hover:text-white',
    modalBg: 'bg-white',
    hover: 'hover:bg-gray-100',
  },
  dark: {
    name: 'dark',
    background: 'bg-gray-900',
    text: 'text-gray-100',
    textSecondary: 'text-gray-400',
    border: 'border-gray-800',
    card: 'bg-gray-800',
    cardHover: 'hover:shadow-xl shadow-gray-900/50',
    input: 'bg-gray-800 border-gray-700 focus:border-gray-500 text-gray-100',
    buttonPrimary: 'from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white',
    buttonSecondary: 'border-gray-700 text-gray-300 hover:bg-gray-700',
    modalBg: 'bg-gray-800',
    hover: 'hover:bg-gray-700',
  },
  eyeCare: {
    name: 'eyeCare',
    background: 'bg-[#F5E6D3]',
    text: 'text-[#433422]',
    textSecondary: 'text-[#6B5D4D]',
    border: 'border-[#E6D5B8]',
    card: 'bg-[#FFF8ED]',
    cardHover: 'hover:shadow-xl shadow-[#433422]/10',
    input: 'bg-[#FFF8ED] border-[#E6D5B8] focus:border-[#433422] text-[#433422]',
    buttonPrimary: 'from-[#433422] to-[#5C4934] hover:from-[#5C4934] hover:to-[#6B5D4D] text-[#FFF8ED]',
    buttonSecondary: 'border-[#433422] text-[#433422] hover:bg-[#433422] hover:text-[#FFF8ED]',
    modalBg: 'bg-[#FFF8ED]',
    hover: 'hover:bg-[#E6D5B8]',
  }
};

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const theme = themes[currentTheme];
  const themeValue = themeValues[currentTheme];

  const toggleTheme = (themeName) => {
    setCurrentTheme(themeName);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      currentTheme, 
      toggleTheme,
      themeValue 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const getThemeClass = (theme, element) => {
  return themes[theme]?.[element] || themes.light[element];
}; 