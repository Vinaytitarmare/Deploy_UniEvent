import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');
  const [textScale, setTextScale] = useState(1);
  const [isHighContrast, setIsHighContrast] = useState(false);

  const baseTheme = isDarkMode ? darkTheme : lightTheme;

  // Derive dynamic theme
  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      // If high contrast, force starker background/text
      ...(isHighContrast && {
        background: isDarkMode ? '#000000' : '#FFFFFF',
        surface: isDarkMode ? '#121212' : '#FFFFFF',
        text: isDarkMode ? '#FFFFFF' : '#000000',
        textSecondary: isDarkMode ? '#FFFF00' : '#000000', // Yellow/Black for extreme contrast
        primary: isDarkMode ? '#00FFFF' : '#00008B' // Cyan/DarkBlue
      })
    },
    typography: {
      h1: { ...baseTheme.typography.h1, fontSize: baseTheme.typography.h1.fontSize * textScale },
      h2: { ...baseTheme.typography.h2, fontSize: baseTheme.typography.h2.fontSize * textScale },
      h3: { ...baseTheme.typography.h3, fontSize: baseTheme.typography.h3.fontSize * textScale },
      body: { ...baseTheme.typography.body, fontSize: baseTheme.typography.body.fontSize * textScale },
      caption: { ...baseTheme.typography.caption, fontSize: baseTheme.typography.caption.fontSize * textScale },
      button: { ...baseTheme.typography.button, fontSize: baseTheme.typography.button.fontSize * textScale },
    }
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('themePreference');
      const storedScale = await AsyncStorage.getItem('textScale');
      const storedContrast = await AsyncStorage.getItem('highContrast');

      if (storedTheme) setIsDarkMode(storedTheme === 'dark');
      if (storedScale) setTextScale(parseFloat(storedScale));
      if (storedContrast) setIsHighContrast(storedContrast === 'true');
    } catch (e) {
      console.log('Failed to load preferences', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem('themePreference', newMode ? 'dark' : 'light');
  };

  const updateTextScale = async (scale) => {
    setTextScale(scale);
    await AsyncStorage.setItem('textScale', String(scale));
  };

  const toggleHighContrast = async () => {
    const newVal = !isHighContrast;
    setIsHighContrast(newVal);
    await AsyncStorage.setItem('highContrast', String(newVal));
  };

  if (loading) return null;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, textScale, updateTextScale, isHighContrast, toggleHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
