import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import LoginScreen from './LoginScreen';
import CadastroScreen from './CadastroScreen';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LoginRegisterTabs = () => {
  const [activeTab, setActiveTab] = useState<'Login' | 'Cadastro'>('Login');

  const handleTabChange = (tab: 'Login' | 'Cadastro') => {
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      {/* Abas de navegação */}
      <View style={styles.logoContainer}>
        <MaterialIcons name="local-library" size={50} color="#2979FF" />
        <Text style={styles.logoText}>Dicionário de Programação</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Login' && styles.activeTab]}
          onPress={() => handleTabChange('Login')}
        >
          <Text style={[styles.tabText, activeTab === 'Login' && styles.activeTabText]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Cadastro' && styles.activeTab]}
          onPress={() => handleTabChange('Cadastro')}
        >
          <Text style={[styles.tabText, activeTab === 'Cadastro' && styles.activeTabText]}>Cadastro</Text>
        </TouchableOpacity>
      </View>

      {/* Renderiza a tela ativa */}
      {activeTab === 'Login' ? <LoginScreen /> : <CadastroScreen />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    width: width * 0.4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#2979FF',
  },
  tabText: {
    fontSize: 16,
    color: '#2979FF',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2979FF',
    fontWeight: 'bold',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 70,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2979FF',
    marginTop: 5,
  }
});

export default LoginRegisterTabs;