import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser, loginUser } from '../services/apiService';

const { width } = Dimensions.get('window');

const LoginRegisterTabs = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');

  const handleLogin = async () => {
    try {
      const data = await loginUser(email, password);
      await AsyncStorage.setItem('authToken', data.token);
      Alert.alert('Login bem-sucedido!', `Bem-vindo, ${data.user.email}`);
    } catch (error) {
      Alert.alert('Erro ao fazer login', error instanceof Error ? error.message : 'Erro desconhecido.');
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }
    try {
      const data = await registerUser(email, password, role);
      await AsyncStorage.setItem('authToken', data.token);
      Alert.alert('Cadastro realizado com sucesso!', `Bem-vindo, ${data.user.email}`);
    } catch (error) {
      Alert.alert('Erro ao se cadastrar', error instanceof Error ? error.message : 'Erro desconhecido.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'login' && styles.activeTab]}
          onPress={() => setActiveTab('login')}
        >
          <Text style={styles.tabText}>Entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'register' && styles.activeTab]}
          onPress={() => setActiveTab('register')}
        >
          <Text style={styles.tabText}>Cadastrar</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'login' ? (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button title="Entrar" color="#004AAD" onPress={handleLogin} />
        </View>
      ) : (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirme a Senha"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Button title="Cadastrar" color="#004AAD" onPress={handleRegister} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14181B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#003B6E',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  activeTab: {
    backgroundColor: '#004AAD',
  },
  tabText: {
    color: '#FFF',
    fontSize: 16,
  },
  formContainer: {
    width: width * 0.8,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    marginBottom: 15,
    fontSize: 16,
    paddingVertical: 5,
  },
});

export default LoginRegisterTabs;
