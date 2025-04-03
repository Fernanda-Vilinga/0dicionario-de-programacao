import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Temas com propriedades abrangentes, incluindo configurações específicas para a dashboard
const lightTheme = {
  // Geral
  backgroundColor: '#f5f5f5',
  textColor: '#333333',
  buttonBackground: '#2979FF',
  buttonText: '#ffffff',
  // Cabeçalho
  headerBackground: '#ffffff',
  headerTextColor: '#333333',
  // Bordas e cartões
  borderColor: '#e0e0e0',
  cardBackground: '#ffffff',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
  // Dashboard (pode ter ajustes diferenciados)
  dashboardBackground: '#ffffff',
  dashboardTextColor: '#333333',
  dashboardCardBackground: '#ffffff',
  dashboardCardShadow: 'rgba(0, 0, 0, 0.1)',
  placeholderTextColor: '#888888'
};

const darkTheme = {
  // Geral
  backgroundColor: '#121212',
  textColor: '#f5f5f5',
  buttonBackground: '#2979FF',
  buttonText: '#000000',
  // Cabeçalho
  headerBackground: '#1F1F1F',
  headerTextColor: '#f5f5f5',
  // Bordas e cartões
  borderColor: '#333333',
  cardBackground: '#1F1F1F',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
  // Dashboard
  dashboardBackground: '#1F1F1F',
  dashboardTextColor: '#f5f5f5',
  dashboardCardBackground: '#1F1F1F',
  dashboardCardShadow: 'rgba(0, 0, 0, 0.5)',
  placeholderTextColor: '#aaaaaa'
};

// Interface do contexto, agora incluindo o objeto theme com todas as propriedades
interface ThemeContextData {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof lightTheme;
}

export const ThemeContext = createContext<ThemeContextData>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: lightTheme,
});

interface Props {
  children: ReactNode;
}

const THEME_KEY = 'APP_THEME';

export const ThemeProvider = ({ children }: Props) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Carrega a preferência do AsyncStorage
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

  // Alterna e salva a preferência
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

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
