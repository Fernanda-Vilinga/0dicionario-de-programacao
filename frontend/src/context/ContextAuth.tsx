import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: boolean;  // Se o usuário está logado (true ou false)
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<boolean | null>(null);

  useEffect(() => {
    // Checar se há um usuário logado armazenado
    const checkUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      setUser(!!storedUser); // Converte para booleano
    };
    checkUser();
  }, []);

  const login = async () => {
    await AsyncStorage.setItem('user', 'true'); // Simulando um login
    setUser(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user'); // Simulando um logout
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user: user ?? false, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
