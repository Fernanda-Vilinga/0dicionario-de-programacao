import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🎨 Temas
const lightTheme = {
  backgroundColor: '#f5f5f5',
  textColor: '#333333',
  buttonBackground: '#2979FF',
  buttonText: '#ffffff',
  headerBackground: '#ffffff',
  headerTextColor: '#333333',
  borderColor: '#e0e0e0',
  cardBackground: 'rgba(61, 59, 59, 0.1)',
  cardTextColor: '#333333',
  cardShadow: 'rgba(187, 183, 183, 0.1)',
  dashboardBackground: '#ffffff',
  dashboardTextColor: '#333333',
  dashboardCardBackground: '#ffffff',
  dashboardCardShadow: 'rgba(0, 0, 0, 0.1)',
  placeholderTextColor: '#888888',
  tabBarBackground: '#ffffff',
  tabActiveColor: '#2979FF',
  tabInactiveColor: '#999999',
  textColorSecondary: '#555',
  primaryColor: '#004AAD',
  // Novas variáveis de ícones
  logoutIconColor: '#FF3B30',
  notificationIconColor: '#2979FF',
  libraryIconColor: '#2979FF',
};

const darkTheme = {
  backgroundColor: '#121212',
  textColor: '#f5f5f5',
  buttonBackground: '#2979FF',
  buttonText: '#000000',
  headerBackground: '#1F1F1F',
  headerTextColor: '#f5f5f5',
  borderColor: '#333333',
  cardBackground: 'rgba(211, 205, 205, 0.1)',
  cardTextColor: '#f5f5f5',
  cardShadow: 'rgba(49, 48, 48, 0.5)',
  dashboardBackground: '#1F1F1F',
  dashboardTextColor: '#f5f5f5',
  dashboardCardBackground: '#1F1F1F',
  dashboardCardShadow: 'rgba(0, 0, 0, 0.5)',
  placeholderTextColor: '#aaaaaa',
  tabBarBackground: '#1F1F1F',
  tabActiveColor: '#82b1ff',
  tabInactiveColor: '#777777',
  textColorSecondary: '#aaa',
  primaryColor: '#4F8EF7',
  // Novas variáveis de ícones para o tema escuro
  logoutIconColor: '#FF3B30',
  notificationIconColor: '#82b1ff',
  libraryIconColor: '#82b1ff',
};

// ✅ Interface do contexto
interface ThemeContextData {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof lightTheme;
  mode: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextData>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: lightTheme,
  mode: 'light',
});

interface Props {
  children: ReactNode;
}

const THEME_KEY = 'APP_THEME';

export const ThemeProvider = ({ children }: Props) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme !== null) {
          setIsDarkMode(JSON.parse(savedTheme));
        }
      } catch (error) {
        console.error('Erro ao carregar o tema:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem(THEME_KEY, JSON.stringify(newTheme));
    } catch (error) {
      console.error('Erro ao salvar o tema:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;
  const mode = isDarkMode ? 'dark' : 'light';

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, mode }}>
      {children}
    </ThemeContext.Provider>
  );
};
